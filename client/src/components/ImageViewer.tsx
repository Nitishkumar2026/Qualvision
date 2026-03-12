import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Layers, Maximize2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Part } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ImageViewerProps {
  realImage: string;
  cadImage: string;
  title: string;
  mode?: 'presence' | 'dimensional';
  parts?: Part[];
  hoveredPartId?: number | null;
  onHoverPart?: (id: number | null) => void;
}

export function ImageViewer({
  realImage,
  cadImage,
  title,
  mode = 'presence',
  parts = [],
  hoveredPartId,
  onHoverPart
}: ImageViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'real' | 'cad'>('split');
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm tracking-wide">{title}</h2>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {mode === 'dimensional' ? 'Metric Analysis' : 'Live Feed'}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'split' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode('split')}
            className="text-xs"
          >
            Split View
          </Button>
          <Button
            variant={viewMode === 'real' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode('real')}
            className="text-xs"
          >
            Real Only
          </Button>
          <Button
            variant={viewMode === 'cad' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode('cad')}
            className="text-xs"
          >
            CAD Only
          </Button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative bg-black/90 p-2 md:p-4 overflow-hidden">

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 h-full">
            <ImagePanel
              src={realImage}
              label="REAL CAPTURE"
              mode={mode}
              parts={parts}
              hoveredPartId={hoveredPartId}
              onHoverPart={onHoverPart}
            />
            <ImagePanel
              src={cadImage}
              label="CAD MODEL"
              mode={mode}
              parts={parts}
              hoveredPartId={hoveredPartId}
              onHoverPart={onHoverPart}
              isCad
            />
          </div>
        )}

        {viewMode === 'real' && (
          <div className="h-full w-full">
            <ImagePanel
              src={realImage}
              label="REAL CAPTURE"
              mode={mode}
              parts={parts}
              hoveredPartId={hoveredPartId}
              onHoverPart={onHoverPart}
            />
          </div>
        )}

        {viewMode === 'cad' && (
          <div className="h-full w-full">
            <ImagePanel
              src={cadImage}
              label="CAD MODEL"
              mode={mode}
              parts={parts}
              hoveredPartId={hoveredPartId}
              onHoverPart={onHoverPart}
              isCad
            />
          </div>
        )}

      </div>
    </div>
  );
}

function ImagePanel({
  src,
  label,
  mode,
  isCad,
  parts = [],
  hoveredPartId,
  onHoverPart
}: {
  src: string;
  label: string,
  mode: string,
  isCad?: boolean,
  parts?: Part[],
  hoveredPartId?: number | null,
  onHoverPart?: (id: number | null) => void
}) {
  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-white/10 group">
      <img
        src={src}
        alt={label}
        className={`w-full h-full object-contain bg-black/50 ${mode === 'dimensional' && !isCad ? 'grayscale contrast-125' : ''}`}
      />
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/70 border border-white/10 z-10">
        {label}
      </div>

      {/* Part Markers Overlay */}
      <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
        {parts.map((part) => {
          // Select coordinates based on view mode (CAD vs Real)
          const posX = isCad ? (part.x_cad ?? part.x) : (part.x_real ?? part.x);
          const posY = isCad ? (part.y_cad ?? part.y) : (part.y_real ?? part.y);

          if (posX === undefined || posY === undefined) return null;

          const isHovered = hoveredPartId === part.id;
          const statusColor = part.status === 'present' ? 'bg-green-500' : part.status === 'absent' ? 'bg-red-500' : 'bg-yellow-500';

          return (
            <motion.div
              key={part.id}
              className="absolute pointer-events-auto cursor-pointer flex items-center justify-center translate-x-[-50%] translate-y-[-50%]"
              style={{ left: `${posX}%`, top: `${posY}%` }}
              onMouseEnter={() => onHoverPart?.(part.id)}
              onMouseLeave={() => onHoverPart?.(null)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isHovered ? 1.5 : 1,
                opacity: 0.8,
                zIndex: isHovered ? 50 : 20
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isHovered && (
                <motion.div
                  className={cn("absolute inset-0 rounded-full opacity-40", statusColor)}
                  animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <div className={cn("w-3 h-3 rounded-full border-2 border-white shadow-lg relative z-10", statusColor)} />

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute whitespace-nowrap bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-white/20 backdrop-blur shadow-2xl pointer-events-none"
                  >
                    <span className="font-bold text-primary mr-1">#{part.id}</span>
                    {part.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Dimensional Analysis Overlay (Problem 2) */}
      {mode === 'dimensional' && !isCad && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Simulated Edge Detection Overlay (SVG) */}
          <svg className="w-full h-full opacity-60">
            {/* These would be dynamically generated by Canny in real backend */}
            <rect x="25%" y="30%" width="50%" height="40%" fill="none" stroke="cyan" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="30%" cy="35%" r="15" fill="none" stroke="red" strokeWidth="2" />
            <line x1="30%" y1="35%" x2="32%" y2="37%" stroke="red" strokeWidth="1" />

            {/* Deviation Label */}
            <text x="32%" y="38%" fill="red" fontSize="12" fontFamily="monospace">Δ 2.4mm</text>

            <circle cx="70%" cy="35%" r="15" fill="none" stroke="#00ff00" strokeWidth="1" />
            <text x="70%" y="38%" fill="#00ff00" fontSize="12" fontFamily="monospace">✓ 0.1mm</text>
          </svg>

          <div className="absolute bottom-2 left-2 right-2 bg-red-500/10 border border-red-500/20 text-red-200 p-2 rounded text-[10px] font-mono">
            ⚠ DIMENSIONAL DEVIATION DETECTED IN UPPER LEFT QUADRANT
          </div>
        </div>
      )}

      {/* Target reticle effect */}
      <div className="absolute inset-0 border border-white/5 pointer-events-none">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50" />
      </div>
    </div>
  )
}
