export interface Part {
  id: number;
  name: string;
  stencilValue: number;
  status: 'present' | 'absent' | 'misaligned';
}

export interface InspectionSample {
  id: string;
  name: string;
  realImage: string;
  cadImage: string;
  maskImage?: string; // Optional since some failed to load in context
  parts: Part[];
}
