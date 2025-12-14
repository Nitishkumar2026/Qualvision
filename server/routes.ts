import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { analyzeInspection } from "./analysisEngine";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post(
    "/api/inspections",
    upload.fields([
      { name: "realImage", maxCount: 1 },
      { name: "cadImage", maxCount: 1 },
      { name: "maskImage", maxCount: 1 },
      { name: "jsonFile", maxCount: 1 },
    ]),
    async (req, res) => {
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

        const jsonContent = JSON.parse(files.jsonFile[0].buffer.toString());
        const firstKey = Object.keys(jsonContent)[0];
        const partsDefinitions = jsonContent[firstKey];

        const analysisResults = analyzeInspection(
          files.maskImage[0].buffer,
          partsDefinitions
        );

        const partsAnalyzed = analysisResults.length;
        const partsPassed = analysisResults.filter(
          (p) => p.status === "present"
        ).length;
        const partsFailed = partsAnalyzed - partsPassed;

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

        res.json(inspection);
      } catch (error) {
        console.error("Inspection error:", error);
        res.status(500).json({ error: "Failed to process inspection" });
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
