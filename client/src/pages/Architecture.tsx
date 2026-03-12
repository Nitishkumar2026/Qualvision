import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Box, Camera, Cpu, Layers, ScanLine, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ArchitecturePage() {
  return (
    <DashboardLayout>
      <div className="p-8 overflow-y-auto h-full">
        <div className="max-w-5xl mx-auto space-y-8">

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">System Architecture</h1>
            <p className="text-muted-foreground text-lg">
              High-level design for spatial verification and dimensional analysis (Problem Statement 2).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Camera}
              title="1. Image Acquisition"
              description="We use high-quality cameras and steady lighting to take clear photos with minimal shadows."
            />
            <FeatureCard
              icon={Layers}
              title="2. CAD Projection"
              description="We align the CAD model to the photos using visible markers so the model and image match."
            />
            <FeatureCard
              icon={ScanLine}
              title="3. Delta Analysis"
              description="We detect edges in the photo and compare them to the CAD shape pixel by pixel to find differences."
            />
          </div>

          <div className="relative py-12">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border border-dashed" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground font-mono">DATA FLOW DIAGRAM</span>
            </div>
          </div>

          {/* Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <ProcessNode
              step="01"
              title="Input"
              items={["Live Images", "CAD File (STL/STEP)", "Camera Settings"]}
              color="border-blue-500/50"
            />
            <div className="hidden lg:flex items-center justify-center text-muted-foreground">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            <ProcessNode
              step="02"
              title="Preprocessing"
              items={["Fix perspective", "Map image pixels to real size", "Create CAD mask"]}
              color="border-purple-500/50"
            />
            <div className="hidden lg:flex items-center justify-center text-muted-foreground">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            <ProcessNode
              step="03"
              title="Analysis Engine"
              items={["Match features between photo and CAD", "Estimate part position and angle", "Measure overlap (IoU)"]}
              color="border-orange-500/50"
            />
            <div className="hidden lg:flex items-center justify-center text-muted-foreground">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            <ProcessNode
              step="04"
              title="Output"
              items={["Is the component present?", "Position error (mm)", "Rotation error (deg)"]}
              color="border-green-500/50"
            />
          </div>

          <Card className="bg-muted/30 border-primary/20 mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <CardTitle>Algorithm Approach — Problem 2</CardTitle>
              </div>
              <CardDescription>
                We determine a part's position and presence using ORB feature alignment and SSIM analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border z-0 hidden md:block" />

                <div className="space-y-6 relative z-10">
                  <PipelineStep
                    number="1"
                    title="Feature Extraction"
                    description="Find edges and key points in the photo to detect component shapes."
                    tech="OpenCV Canny / ORB"
                  />
                  <PipelineStep
                    number="2"
                    title="Projective Transformation"
                    description="Render the CAD model with a virtual camera using the same camera settings as the real one."
                    tech="Mask-based Segmentation"
                  />
                  <PipelineStep
                    number="3"
                    title="Dimensional Verification"
                    description="Convert pixel distances to millimetres and compare part positions and sizes."
                    tech="SSIM Structural Index"
                  />
                  <PipelineStep
                    number="4"
                    title="Thresholding"
                    description="Compare measured differences to tolerance limits (e.g., ±0.5 mm) to decide pass/fail."
                    tech="Statistical Analysis"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

function PipelineStep({ number, title, description, tech }: any) {
  return (
    <div className="flex gap-4 items-start bg-card p-4 rounded-lg border border-border shadow-sm relative">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-background">
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-lg">{title}</h4>
          <Badge variant="secondary" className="text-[10px] h-5">{tech}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function ProcessNode({ step, title, items, color }: any) {
  return (
    <div className={cn("p-4 rounded-lg border bg-card relative overflow-hidden", color)}>
      <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-4xl">{step}</div>
      <h3 className="font-semibold mb-3 relative z-10">{title}</h3>
      <ul className="space-y-2 relative z-10">
        {items.map((item: string, i: number) => (
          <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-foreground/50" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
