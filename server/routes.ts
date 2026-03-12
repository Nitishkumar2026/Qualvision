import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { computePose } from "./analysisEngine";
import bmp from "bmp-js";
import { parseBMPMask } from "./maskParser";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  broadcast: (data: any) => void
): Promise<Server> {
  app.post("/api/debug/mask-stats", upload.single("maskImage"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "maskImage required" });
      }
      const data = bmp.decode(file.buffer);
      const rHist = new Map<number, number>();
      const gHist = new Map<number, number>();
      const bHist = new Map<number, number>();
      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i];
        const g = data.data[i + 1];
        const b = data.data[i + 2];
        rHist.set(r, (rHist.get(r) ?? 0) + 1);
        gHist.set(g, (gHist.get(g) ?? 0) + 1);
        bHist.set(b, (bHist.get(b) ?? 0) + 1);
      }
      const top = (hist: Map<number, number>) =>
        Array.from(hist.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([val, cnt]) => ({ value: val, count: cnt }));
      return res.json({
        width: data.width,
        height: data.height,
        topR: top(rHist),
        topG: top(gHist),
        topB: top(bHist),
        uniqueR: rHist.size,
        uniqueG: gHist.size,
        uniqueB: bHist.size,
      });
    } catch (err) {
      console.error("mask-stats error", err);
      res.status(500).json({ error: "Failed to parse mask" });
    }
  });

  app.post("/api/debug/mask-count/:value", upload.single("maskImage"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "maskImage required" });
      const v = parseInt(req.params.value, 10);
      const data = bmp.decode(file.buffer);
      let count = 0;
      for (let i = 0; i < data.data.length; i += 4) {
        const b = data.data[i + 2];
        if (b === v) count++;
      }
      res.json({ value: v, count });
    } catch (err) {
      res.status(500).json({ error: "Failed to parse" });
    }
  });

  app.post("/api/debug/mask-count-core/:value", upload.single("maskImage"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "maskImage required" });
      const v = parseInt(req.params.value, 10);
      const { parseBMPMask, countStencilValuePixels } = await import("./maskParser");
      const mask = parseBMPMask(file.buffer);
      const count = countStencilValuePixels(mask, v);
      res.json({ value: v, count });
    } catch {
      res.status(500).json({ error: "Failed to parse" });
    }
  });
  app.post(
    "/api/inspections",
    upload.fields([
      { name: "realImage", maxCount: 1 },
      { name: "cadImage", maxCount: 1 },
      { name: "maskImage", maxCount: 1 },
      { name: "jsonFile", maxCount: 1 },
    ]),
    async (req, res) => {
      let tempFiles: string[] = [];
      try {
        const files = req.files as {
          realImage?: Express.Multer.File[];
          cadImage?: Express.Multer.File[];
          maskImage?: Express.Multer.File[];
          jsonFile?: Express.Multer.File[];
        };

        if (
          !files.realImage?.[0] ||
          !files.cadImage?.[0] ||
          !files.maskImage?.[0] ||
          !files.jsonFile?.[0]
        ) {
          return res.status(400).json({ error: "All 4 files are required" });
        }

        broadcast({ type: "progress", step: "upload_complete", message: "Assets uploaded and validated" });

        // Filename Validation
        const extractId = (name: string) => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : NaN;
        };

        const realId = extractId(files.realImage[0].originalname);
        const cadId = extractId(files.cadImage[0].originalname);
        const maskId = extractId(files.maskImage[0].originalname);
        const jsonId = extractId(files.jsonFile[0].originalname);

        const ids = [realId, cadId, maskId, jsonId].filter(id => !isNaN(id));

        // Only validate if we successfully extracted IDs from all files
        if (ids.length === 4) {
          const uniqueIds = new Set(ids);
          if (uniqueIds.size > 1) {
            return res.status(400).json({
              error: `Filename mismatch detected. Files appear to belong to different models (IDs: ${Array.from(uniqueIds).join(', ')}). Please ensure all files correspond to the same part model.`
            });
          }
        }

        // Save files to temp directory for Python script
        // Using project-local temp dir on E: drive because C: drive is full
        const tempDir = path.join(process.cwd(), "temp");
        const id = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);

        const realPath = path.join(tempDir, `real_${id}.jpg`); // Assuming jpg/png, extension doesn't matter much for opencv
        const cadPath = path.join(tempDir, `cad_${id}.png`);
        const maskPath = path.join(tempDir, `mask_${id}.bmp`);
        const jsonPath = path.join(tempDir, `map_${id}.json`);

        tempFiles = [realPath, cadPath, maskPath, jsonPath];

        await fs.writeFile(realPath, files.realImage[0].buffer);
        await fs.writeFile(cadPath, files.cadImage[0].buffer);
        await fs.writeFile(maskPath, files.maskImage[0].buffer);
        await fs.writeFile(jsonPath, files.jsonFile[0].buffer);

        broadcast({ type: "progress", step: "pre_processing", message: "Optimizing images for neural analysis" });

        // Execute Python script
        const pythonScript = path.join(process.cwd(), "server", "validate_inspection.py");

        const pythonResult = await new Promise<string>((resolve, reject) => {
          const process = spawn("python", [
            pythonScript,
            realPath,
            cadPath,
            maskPath,
            jsonPath
          ]);

          let stdout = "";
          let stderr = "";

          process.stdout.on("data", (data) => {
            const out = data.toString();
            stdout += out;

            // Forward progress from python
            try {
              const lines = out.split('\n');
              for (const line of lines) {
                if (line.trim().startsWith('{')) {
                  const parsed = JSON.parse(line);
                  if (parsed.type === 'progress') {
                    broadcast(parsed);
                  }
                }
              }
            } catch (e) {
              // Ignore partial JSON or non-progress output
            }
          });

          process.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          process.on("close", (code) => {
            if (code !== 0) {
              console.error("Python stderr:", stderr);
              console.error("Python stdout so far:", stdout);
              reject(new Error(`Python script exited with code ${code}: ${stderr}`));
            } else {
              resolve(stdout);
            }
          });
        });

        // Parse Python result - look for the encapsulated result block
        let result;
        const startMarker = "__RESULT_START__";
        const endMarker = "__RESULT_END__";

        const startIdx = pythonResult.lastIndexOf(startMarker);
        const endIdx = pythonResult.lastIndexOf(endMarker);

        console.log("=== PARSING DEBUG ===");
        console.log("Output length:", pythonResult.length);
        console.log("Start marker at:", startIdx);
        console.log("End marker at:", endIdx);

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          const jsonString = pythonResult.substring(startIdx + startMarker.length, endIdx).trim();
          console.log("Extracted JSON (first 200 chars):", jsonString.substring(0, 200));
          try {
            result = JSON.parse(jsonString);
            console.log("✓ Parse successful, parts:", result.parts?.length || 0);
          } catch (e: any) {
            console.error("✗ Parse error:", e.message);
            console.error("Full JSON string:", jsonString);
          }
        } else {
          // Fallback to old regex/search method if markers are missing for some reason
          const resultStart = pythonResult.lastIndexOf('{"valid":');
          if (resultStart !== -1) {
            const potentialJson = pythonResult.substring(resultStart);
            const lastBrace = potentialJson.lastIndexOf('}');
            if (lastBrace !== -1) {
              try {
                result = JSON.parse(potentialJson.substring(0, lastBrace + 1));
              } catch (e) { }
            }
          }
        }

        if (!result) {
          console.error("=== PARSE FAILED - Full Output (first 3000 chars) ===");
          console.error(pythonResult.substring(0, 3000));
          console.error("=== END ===");
          throw new Error("Failed to parse Python output. Check server console for full output.");
        }

        if (!result.valid) {
          return res.status(400).json({ error: result.error || "Validation failed" });
        }

        const analysisResults = result.parts;
        const partsDefinitions = analysisResults.map((p: any) => ({
          NodeId: p.id,
          Name: p.name,
          StencilValue: p.stencilValue
        }));

        broadcast({ type: "progress", step: "mesh_pose_computation", message: "Calculating spatial pose and alignment" });
        const pose = computePose(files.maskImage[0].buffer, partsDefinitions);

        const partsAnalyzed = result.partsAnalyzed;
        const partsPassed = result.partsPassed;
        const partsFailed = result.partsFailed;

        const inspection = await storage.createInspection({
          realImageName: files.realImage[0].originalname,
          cadImageName: files.cadImage[0].originalname,
          maskImageName: files.maskImage[0].originalname,
          jsonFileName: files.jsonFile[0].originalname,
          partsAnalyzed,
          partsPassed,
          partsFailed,
          parts: analysisResults,
        });

        res.json({ ...inspection, pose });

      } catch (error: any) {
        console.error("Inspection error:", error);
        res.status(500).json({ error: error.message || "Failed to process inspection" });
      } finally {
        // Cleanup temp files
        for (const f of tempFiles) {
          try {
            await fs.unlink(f);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    }
  );

  app.get("/api/inspections", async (req, res) => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const inspections = await storage.getInspectionHistory(limit);
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  app.get("/api/inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });

  return httpServer;
}
