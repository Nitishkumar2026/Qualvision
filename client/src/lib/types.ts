export interface Part {
  id: number;
  name: string;
  stencilValue: number;
  status: 'present' | 'absent' | 'misaligned' | 'unknown';
  deviation?: number; // Added for Problem Statement 2 (Dimensional Verification)
  x?: number; // Normalized X coordinate (0-100)
  y?: number; // Normalized Y coordinate (0-100)
  x_cad?: number;
  y_cad?: number;
  x_real?: number;
  y_real?: number;
}

export interface PoseMetrics {
  rxDeg: number;
  ryDeg: number;
  zMm: number;
}

export interface InspectionSample {
  id: string;
  name: string;
  realImage: string;
  cadImage: string;
  maskImage?: string; // Optional since some failed to load in context
  parts: Part[];
}
