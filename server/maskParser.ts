import bmp from "bmp-js";

export interface PartDefinition {
  NodeId: string;
  Name: string;
  StencilValue: number;
}

export interface MaskParseResult {
  width: number;
  height: number;
  pixelData: Uint8Array;
  getPixelValue: (x: number, y: number) => number;
  channel: "r" | "g" | "b";
}

export function parseBMPMask(buffer: Buffer): MaskParseResult {
  const bmpData = bmp.decode(buffer);
  
  const unique = { r: new Set<number>(), g: new Set<number>(), b: new Set<number>() };
  for (let i = 0; i < bmpData.data.length; i += 4) {
    const r = bmpData.data[i];
    const g = bmpData.data[i + 1];
    const b = bmpData.data[i + 2];
    if (r !== 0 && r !== 255) unique.r.add(r);
    if (g !== 0 && g !== 255) unique.g.add(g);
    if (b !== 0 && b !== 255) unique.b.add(b);
  }
  let channel: "r" | "g" | "b" = "r";
  const counts = { r: unique.r.size, g: unique.g.size, b: unique.b.size };
  if (counts.b >= counts.g && counts.b >= counts.r) channel = "b";
  else if (counts.g >= counts.r) channel = "g";
  else channel = "r";
  
  const getPixelValue = (x: number, y: number): number => {
    if (x < 0 || x >= bmpData.width || y < 0 || y >= bmpData.height) {
      return 0;
    }
    
    const index = (y * bmpData.width + x) * 4;
    const r = bmpData.data[index];
    const g = bmpData.data[index + 1];
    const b = bmpData.data[index + 2];
    return channel === "b" ? b : channel === "g" ? g : r;
  };
  
  return {
    width: bmpData.width,
    height: bmpData.height,
    pixelData: bmpData.data,
    getPixelValue,
    channel,
  };
}

export function countStencilValuePixels(
  maskResult: MaskParseResult,
  stencilValue: number
): number {
  let count = 0;
  for (let y = 0; y < maskResult.height; y++) {
    for (let x = 0; x < maskResult.width; x++) {
      if (maskResult.getPixelValue(x, y) === stencilValue) {
        count++;
      }
    }
  }
  return count;
}
