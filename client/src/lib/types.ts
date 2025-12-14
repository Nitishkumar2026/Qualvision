export interface Part {
  id: number;
  name: string;
  stencilValue: number;
  status: 'present' | 'absent' | 'misaligned';
  deviation?: number; // Added for Problem Statement 2 (Dimensional Verification)
}

export interface InspectionSample {
  id: string;
  name: string;
  realImage: string;
  cadImage: string;
  maskImage?: string; // Optional since some failed to load in context
  parts: Part[];
}
