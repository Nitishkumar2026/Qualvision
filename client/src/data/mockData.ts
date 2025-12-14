import { InspectionSample } from '@/lib/types';

// Importing assets directly to ensure Vite processes them
import real006 from '@assets/006_real_1765724369247.jpeg';
import cad006 from '@assets/0006_CAD_1765724369249.png';
// import mask006 from '@assets/0006_Mask_1765724369248.bmp'; // BMP might not be supported by browser img tag directly without conversion, but we'll try

import real007 from '@assets/007_real_1765724369242.jpeg';
import cad007 from '@assets/0007_CAD_1765724369246.png';

import real008 from '@assets/008_real_1765724369233.jpeg';
import cad008 from '@assets/0008_CAD_1765724369238.png';

// Mock data based on the provided JSON structure
// Status is mocked for demonstration as we don't have the CV backend running

export const SAMPLES: InspectionSample[] = [
  {
    id: 'sample-006',
    name: 'Bracket Assembly (006)',
    realImage: real006,
    cadImage: cad006,
    parts: [
      { id: 1000060, name: "small_washer_2", stencilValue: 1, status: 'present' },
      { id: 1000058, name: "small_washer_1", stencilValue: 2, status: 'present' },
      { id: 1000055, name: "large_washer_5", stencilValue: 3, status: 'absent' }, // Mocking absence
      { id: 1000053, name: "large_washer_4", stencilValue: 4, status: 'present' },
      { id: 1000021, name: "M10_bolt_5", stencilValue: 18, status: 'present' },
      { id: 1000064, name: "side_cover", stencilValue: 29, status: 'present' },
      { id: 1000067, name: "box", stencilValue: 30, status: 'present' },
    ]
  },
  {
    id: 'sample-007',
    name: 'Slotted Box (007)',
    realImage: real007,
    cadImage: cad007,
    parts: [
      { id: 1000070, name: "slanted_plate", stencilValue: 31, status: 'present' },
      { id: 1000033, name: "M8_nuts_6", stencilValue: 13, status: 'absent' },
      { id: 1000031, name: "M8_nuts_5", stencilValue: 14, status: 'present' },
      { id: 1000067, name: "box", stencilValue: 30, status: 'present' },
      { id: 1000010, name: "M8_bolt_6", stencilValue: 23, status: 'present' },
    ]
  },
  {
    id: 'sample-008',
    name: 'Bolt Configuration (008)',
    realImage: real008,
    cadImage: cad008,
    parts: [
      { id: 1000044, name: "M10_nuts_5", stencilValue: 8, status: 'present' },
      { id: 1000042, name: "M10_nuts_4", stencilValue: 9, status: 'present' },
      { id: 1000040, name: "M10_nuts_3", stencilValue: 10, status: 'present' },
      { id: 1000038, name: "M10_nuts_2", stencilValue: 11, status: 'misaligned' }, // Mocking misalignment
      { id: 1000064, name: "side_cover", stencilValue: 29, status: 'present' },
      { id: 1000067, name: "box", stencilValue: 30, status: 'present' },
    ]
  }
];
