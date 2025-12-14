declare module 'bmp-js' {
  interface BmpData {
    width: number;
    height: number;
    data: Uint8Array;
  }

  export function decode(buffer: Buffer): BmpData;
  export function encode(data: BmpData): { data: Buffer };
}
