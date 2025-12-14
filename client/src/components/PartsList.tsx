import { Part } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PartsListProps {
  parts: Part[];
}

export function PartsList({ parts }: PartsListProps) {
  const presentCount = parts.filter(p => p.status === 'present').length;
  const absentCount = parts.filter(p => p.status === 'absent').length;
  const misalignedCount = parts.filter(p => p.status === 'misaligned').length;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border w-80">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-1">Inspection Results</h3>
        <div className="flex gap-2 text-xs text-muted-foreground mb-4">
          <span className="text-green-500">{presentCount} Present</span>
          <span>•</span>
          <span className="text-red-500">{absentCount} Absent</span>
          <span>•</span>
          <span className="text-yellow-500">{misalignedCount} Alert</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search part ID..." className="h-8 pl-8 text-xs bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/50">
          {parts.map((part) => (
            <div key={part.id} className="p-3 hover:bg-muted/30 transition-colors group cursor-pointer">
              <div className="flex items-start justify-between mb-1">
                <span className="font-mono text-xs text-muted-foreground">#{part.id}</span>
                <StatusBadge status={part.status} />
              </div>
              <div className="font-medium text-sm truncate" title={part.name}>
                {part.name}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Stencil ID: {part.stencilValue}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-muted/10">
        <div className="text-[10px] text-center text-muted-foreground">
          Analysis completed in 124ms
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Part['status'] }) {
  if (status === 'present') {
    return (
      <div className="flex items-center gap-1 text-[10px] font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
        <CheckCircle2 className="w-3 h-3" />
        <span>MATCH</span>
      </div>
    );
  }
  if (status === 'absent') {
    return (
      <div className="flex items-center gap-1 text-[10px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
        <XCircle className="w-3 h-3" />
        <span>MISSING</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[10px] font-medium text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
      <AlertTriangle className="w-3 h-3" />
      <span>CHECK</span>
    </div>
  );
}
