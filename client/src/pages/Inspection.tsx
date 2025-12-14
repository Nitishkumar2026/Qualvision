import { useState } from "react";
import { SAMPLES } from "@/data/mockData";
import { ImageViewer } from "@/components/ImageViewer";
import { PartsList } from "@/components/PartsList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function InspectionPage() {
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLES[0].id);
  
  const currentSample = SAMPLES.find(s => s.id === selectedSampleId) || SAMPLES[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Component Analysis</h1>
            <p className="text-xs text-muted-foreground">Select a sample to inspect discrepancies</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedSampleId} onValueChange={setSelectedSampleId}>
              <SelectTrigger className="w-[240px] bg-background">
                <SelectValue placeholder="Select sample" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLES.map(sample => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-hidden">
             <ImageViewer 
               realImage={currentSample.realImage} 
               cadImage={currentSample.cadImage}
               title={currentSample.name}
             />
          </div>
          
          <div className="h-full border-l border-border">
            <PartsList parts={currentSample.parts} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
