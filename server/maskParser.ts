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
}

export function parseBMPMask(buffer: Buffer): MaskParseResult {
  const bmpData = bmp.decode(buffer);
  
  const getPixelValue = (x: number, y: number): number => {
    if (x < 0 || x >= bmpData.width || y < 0 || y >= bmpData.height) {
      return 0;
    }
    
    const index = (y * bmpData.width + x) * 4;
    const r = bmpData.data[index];
    return r;
  };
  
  return {
    width: bmpData.width,
    height: bmpData.height,
    pixelData: bmpData.data,
    getPixelValue,
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
