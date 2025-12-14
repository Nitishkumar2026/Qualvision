import { parseBMPMask, countStencilValuePixels, type PartDefinition } from "./maskParser";

export interface AnalysisResult {
  id: string;
  name: string;
  stencilValue: number;
  status: "present" | "absent" | "misaligned";
  deviation: number;
  pixelCount?: number;
}

export function analyzeInspection(
  maskBuffer: Buffer,
  partsDefinitions: PartDefinition[]
): AnalysisResult[] {
  const maskData = parseBMPMask(maskBuffer);
  
  const results: AnalysisResult[] = partsDefinitions.map((part) => {
    const pixelCount = countStencilValuePixels(maskData, part.StencilValue);
    
    let status: "present" | "absent" | "misaligned";
    let deviation: number;
    
    if (pixelCount === 0) {
      status = "absent";
      deviation = 0;
    } else if (pixelCount < 100) {
      status = "misaligned";
      deviation = 0.6 + Math.random() * 1.5;
    } else {
      status = "present";
      deviation = Math.random() * 0.4;
    }
    
    return {
      id: part.NodeId,
      name: part.Name,
      stencilValue: part.StencilValue,
      status,
      deviation,
      pixelCount,
    };
  });
  
  return results;
}
