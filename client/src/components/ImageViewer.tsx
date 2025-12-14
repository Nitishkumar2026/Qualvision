import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Layers, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImageViewerProps {
  realImage: string;
  cadImage: string;
  title: string;
}

export function ImageViewer({ realImage, cadImage, title }: ImageViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'real' | 'cad'>('split');
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm tracking-wide">{title}</h2>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Live Feed</Badge>
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
      <div className="flex-1 relative bg-black/90 p-4 overflow-hidden">
        
        {viewMode === 'split' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <ImagePanel src={realImage} label="REAL CAPTURE" />
            <ImagePanel src={cadImage} label="CAD MODEL" />
          </div>
        )}

        {viewMode === 'real' && (
          <div className="h-full w-full">
            <ImagePanel src={realImage} label="REAL CAPTURE" />
          </div>
        )}

        {viewMode === 'cad' && (
          <div className="h-full w-full">
            <ImagePanel src={cadImage} label="CAD MODEL" />
          </div>
        )}

      </div>
    </div>
  );
}

function ImagePanel({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-white/10 group">
      <img 
        src={src} 
        alt={label} 
        className="w-full h-full object-contain bg-black/50"
      />
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/70 border border-white/10">
        {label}
      </div>
      
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
