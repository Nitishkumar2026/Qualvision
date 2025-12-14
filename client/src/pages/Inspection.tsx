import { useState, useRef, useEffect } from "react";
import { SAMPLES } from "@/data/mockData";
import { ImageViewer } from "@/components/ImageViewer";
import { PartsList } from "@/components/PartsList";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileJson, Image as ImageIcon, Play, RotateCcw, FileOutput, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Part } from "@/lib/types";

// Helper to determine mock results based on filename
const getMockResultForFile = (filename: string, partName: string): Part['status'] => {
  if (filename.includes("006")) {
    const sample = SAMPLES.find(s => s.id === 'sample-006');
    return sample?.parts.find(p => p.name === partName)?.status || 'present';
  }
  if (filename.includes("007")) {
    const sample = SAMPLES.find(s => s.id === 'sample-007');
    return sample?.parts.find(p => p.name === partName)?.status || 'present';
  }
  if (filename.includes("008")) {
    const sample = SAMPLES.find(s => s.id === 'sample-008');
    return sample?.parts.find(p => p.name === partName)?.status || 'present';
  }
  // Default random behavior for unknown files to simulate detection
  return Math.random() > 0.8 ? 'absent' : 'present';
};

export default function InspectionPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  
  // File states
  const [realImage, setRealImage] = useState<File | null>(null);
  const [cadImage, setCadImage] = useState<File | null>(null);
  const [maskImage, setMaskImage] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  // Preview URLs
  const [realPreview, setRealPreview] = useState<string | null>(null);
  const [cadPreview, setCadPreview] = useState<string | null>(null);

  // Parsed Data
  const [parts, setParts] = useState<Part[]>([]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (realPreview) URL.revokeObjectURL(realPreview);
      if (cadPreview) URL.revokeObjectURL(cadPreview);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'real' | 'cad' | 'mask' | 'json') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'real') {
      setRealImage(file);
      setRealPreview(URL.createObjectURL(file));
    } else if (type === 'cad') {
      setCadImage(file);
      setCadPreview(URL.createObjectURL(file));
    } else if (type === 'mask') {
      setMaskImage(file);
    } else if (type === 'json') {
      setJsonFile(file);
    }
  };

  const runInspection = async () => {
    if (!realImage || !cadImage || !maskImage || !jsonFile) {
      toast({
        title: "Missing Files",
        description: "Please upload all 4 required files to start inspection.",
        variant: "destructive",
      });
      return;
    }

    setStep('processing');

    // Simulate Python backend processing time
    setTimeout(async () => {
      try {
        const text = await jsonFile.text();
        const json = JSON.parse(text);
        
        // The JSON structure from the user is like: { "filename.bmp": [ { NodeId, Name, StencilValue } ] }
        // We need to extract the array regardless of the key
        const firstKey = Object.keys(json)[0];
        const rawParts = json[firstKey];

        const processedParts: Part[] = rawParts.map((p: any) => ({
          id: p.NodeId,
          name: p.Name,
          stencilValue: p.StencilValue,
          status: getMockResultForFile(jsonFile.name, p.Name) // "AI" Logic Simulation
        }));

        setParts(processedParts);
        setStep('results');
        toast({
          title: "Inspection Complete",
          description: `Analyzed ${processedParts.length} components.`,
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error Parsing JSON",
          description: "The JSON file format is invalid.",
          variant: "destructive",
        });
        setStep('upload');
      }
    }, 2500); // 2.5s simulated delay
  };

  const reset = () => {
    setStep('upload');
    setRealImage(null);
    setCadImage(null);
    setMaskImage(null);
    setJsonFile(null);
    setRealPreview(null);
    setCadPreview(null);
    setParts([]);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        
        {/* Header - Changes based on step */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {step === 'results' ? 'Inspection Report' : 'New Inspection Task'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === 'results' 
                ? `Analysis Result for ${realImage?.name}` 
                : 'Upload component data to verify against CAD model'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {step === 'results' && (
              <>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Scan
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <FileOutput className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* UPLOAD SCREEN */}
          {step === 'upload' && (
            <div className="h-full overflow-y-auto p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
              <div className="max-w-2xl w-full space-y-8">
                
                <div className="text-center space-y-2 mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold">Upload Inspection Assets</h2>
                  <p className="text-muted-foreground">
                    Select the Real Image, CAD Reference, Mask, and Parts Map JSON.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UploadCard 
                    label="Real Image" 
                    accept="image/*" 
                    icon={ImageIcon} 
                    file={realImage} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'real')} 
                  />
                  <UploadCard 
                    label="CAD Model Image" 
                    accept="image/*" 
                    icon={Layers} 
                    file={cadImage} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'cad')} 
                  />
                  <UploadCard 
                    label="Segmentation Mask" 
                    accept="image/*" 
                    icon={Layers} 
                    file={maskImage} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'mask')} 
                  />
                  <UploadCard 
                    label="Parts Map JSON" 
                    accept=".json" 
                    icon={FileJson} 
                    file={jsonFile} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'json')} 
                  />
                </div>

                <div className="pt-8 flex justify-center">
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto min-w-[200px] text-base" 
                    onClick={runInspection}
                    disabled={!realImage || !cadImage || !maskImage || !jsonFile}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Run Inspection
                  </Button>
                </div>

              </div>
            </div>
          )}

          {/* PROCESSING SCREEN */}
          {step === 'processing' && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-muted rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Processing Images...</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Running computer vision algorithms to detect parts, verify presence, and check alignment.
              </p>
              
              <div className="mt-8 space-y-2 text-sm text-left max-w-xs mx-auto font-mono text-muted-foreground/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> Loaded 4 files
                </div>
                <div className="flex items-center gap-2 animate-pulse delay-75">
                  <div className="w-3 h-3 rounded-full bg-primary/50" /> Parsing JSON structure...
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-3 h-3 rounded-full bg-muted" /> Matching features...
                </div>
              </div>
            </div>
          )}

          {/* RESULTS SCREEN */}
          {step === 'results' && realPreview && cadPreview && (
            <div className="flex h-full animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 p-6 overflow-hidden">
                <ImageViewer 
                  realImage={realPreview} 
                  cadImage={cadPreview} 
                  title={realImage?.name || "Inspection View"}
                />
              </div>
              <div className="h-full border-l border-border">
                <PartsList parts={parts} />
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

function UploadCard({ label, accept, icon: Icon, file, onChange }: any) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card 
      className={`border-dashed transition-all cursor-pointer hover:bg-muted/30 ${file ? 'border-primary bg-primary/5' : 'border-border'}`}
      onClick={() => inputRef.current?.click()}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 h-32">
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept={accept} 
          onChange={onChange} 
        />
        {file ? (
          <div className="text-center animate-in zoom-in-50">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 text-primary-foreground">
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-green-600 font-medium mt-1">Ready to upload</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground group">
            <Icon className="w-8 h-8 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="font-medium text-sm">{label}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">Click to browse</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Icon component import helper
import { Layers } from "lucide-react";
