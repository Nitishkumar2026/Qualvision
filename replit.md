# QUAL_VISION - Automated Part Inspection System

## Overview

QUAL_VISION is an automated visual inspection system designed for manufacturing quality control. The application enables quality engineers and production supervisors to verify that physical parts match their CAD designs by comparing real images against CAD renderings using mask-based pixel analysis.

The system supports two inspection modes:
- **Presence Detection**: Verifies whether expected parts are present or absent in an assembly
- **Dimensional Verification**: Measures spatial deviations between manufactured parts and CAD specifications

Users upload four files (real image, CAD image, BMP mask, and JSON parts mapping), and the system analyzes each part's presence/absence by parsing stencil values from the mask and counting corresponding pixels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local UI state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Design**: RESTful endpoints under `/api/*` prefix
- **File Handling**: Multer for multipart form uploads (in-memory storage)
- **Analysis Engine**: Custom BMP mask parser using bmp-js library to decode stencil values and count pixels per part

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Key Tables**: 
  - `inspections` - stores analysis results with parts data as JSONB
  - `users` - basic auth structure (not fully implemented)

### Core Processing Pipeline
1. User uploads 4 files via multipart form
2. Server parses JSON to extract part definitions (NodeId, Name, StencilValue)
3. BMP mask is decoded to extract pixel data
4. For each part, system counts pixels matching its stencil value
5. Parts are classified as present (>100 pixels), absent (0 pixels), or misaligned (<100 pixels)
6. Results stored in database and returned to client

### Client-Server Communication
- Development: Vite dev server proxies API requests to Express backend
- Production: Express serves static files from `dist/public` and handles API routes
- File uploads use FormData with multipart encoding

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema-first approach
- **connect-pg-simple**: Session storage (configured but sessions not actively used)

### Image Processing
- **bmp-js**: Decodes BMP mask files to extract pixel stencil values
- Custom type declarations in `server/bmp-js.d.ts`

### PDF Generation
- **jsPDF** with **jspdf-autotable**: Client-side PDF report generation for inspection results

### UI Framework Dependencies
- **Radix UI**: Full suite of accessible, unstyled primitives (dialog, dropdown, tabs, etc.)
- **Framer Motion**: Animation library for image viewer transitions
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **Vite**: Frontend build and dev server
- **esbuild**: Production server bundling
- **Replit plugins**: Dev banner, cartographer, runtime error overlay