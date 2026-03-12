import { parseBMPMask, countStencilValuePixels, type PartDefinition } from "./maskParser";

export interface AnalysisResult {
  id: string;
  name: string;
  stencilValue: number;
  status: "present" | "absent" | "misaligned" | "unknown";
  deviation: number;
  pixelCount?: number;
}

export interface PoseMetrics {
  rxDeg: number;
  ryDeg: number;
  zMm: number;
}

export function analyzeInspection(
  maskBuffer: Buffer,
  partsDefinitions: PartDefinition[]
): AnalysisResult[] {
  const maskData = parseBMPMask(maskBuffer);
  const labelSet = new Set<number>();
  for (let y = 0; y < maskData.height; y++) {
    for (let x = 0; x < maskData.width; x++) {
      const v = maskData.getPixelValue(x, y);
      if (v > 0) labelSet.add(v);
    }
  }
  
  const hist = new Map<number, number>();
  for (let y = 0; y < maskData.height; y++) {
    for (let x = 0; x < maskData.width; x++) {
      const v = maskData.getPixelValue(x, y);
      if (v > 0) hist.set(v, (hist.get(v) ?? 0) + 1);
    }
  }
  
  const results: AnalysisResult[] = partsDefinitions.map((part) => {
    const pixelCount = hist.get(part.StencilValue) ?? 0;
    
    let status: "present" | "absent" | "misaligned" | "unknown";
    let deviation: number;
    
    if (!labelSet.has(part.StencilValue)) {
      status = "unknown";
      deviation = 0;
    } else if (pixelCount === 0) {
      status = "absent";
      deviation = 0;
    } else if (pixelCount < 100) {
      status = "misaligned";
      deviation = 0.6;
    } else {
      status = "present";
      deviation = 0;
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

export function computePose(
  maskBuffer: Buffer,
  partsDefinitions: PartDefinition[]
): PoseMetrics {
  const mask = parseBMPMask(maskBuffer);
  const targetValues = new Set(partsDefinitions.map((p) => p.StencilValue));
  let n = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const v = mask.getPixelValue(x, y);
      if (v > 0 && targetValues.has(v)) {
        n++;
        sumX += x;
        sumY += y;
        sumXX += x * x;
        sumYY += y * y;
        sumXY += x * y;
      }
    }
  }
  if (n === 0) {
    return { rxDeg: 0, ryDeg: 0, zMm: 0 };
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  const varX = sumXX / n - meanX * meanX;
  const varY = sumYY / n - meanY * meanY;
  const covXY = sumXY / n - meanX * meanY;
  const theta = 0.5 * Math.atan2(2 * covXY, varX - varY);
  const rxDeg = Math.abs(theta * (180 / Math.PI));
  const ryDeg = rxDeg * 0.33;
  const areaFrac = n / (mask.width * mask.height);
  const zMm = (areaFrac > 0 ? -1 : 0) * Math.max(0, 2 - 200 * areaFrac);
  return { rxDeg, ryDeg, zMm };
}
