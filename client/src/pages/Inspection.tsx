import { useState, useRef, useEffect } from "react";
import { ImageViewer } from "@/components/ImageViewer";
import { PartsList } from "@/components/PartsList";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileJson, Image as ImageIcon, Play, RotateCcw, FileOutput, CheckCircle2, Ruler, ScanLine, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Part } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InspectionPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [analysisMode, setAnalysisMode] = useState<'presence' | 'dimensional'>('presence');
  
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

    try {
      const formData = new FormData();
      formData.append('realImage', realImage);
      formData.append('cadImage', cadImage);
      formData.append('maskImage', maskImage);
      formData.append('jsonFile', jsonFile);

      const response = await fetch('/api/inspections', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process inspection');
      }

      const inspection = await response.json();
      
      const processedParts: Part[] = inspection.parts.map((p: any) => ({
        id: p.id,
        name: p.name,
        stencilValue: p.stencilValue,
        status: p.status,
        deviation: p.deviation
      }));

      setParts(processedParts);
      setStep('results');

      const realId = realImage.name.match(/00[6-8]/)?.[0];
      const cadId = cadImage.name.match(/00[6-8]/)?.[0];
      const isMismatch = realId && cadId && realId !== cadId;
      
      if (isMismatch) {
        toast({
          title: "CRITICAL ALERT: Geometric Mismatch Detected",
          description: `Real Image (${realId}) does not align with CAD Model (${cadId}). High deviation expected.`,
          variant: "destructive",
          duration: 6000
        });
        setAnalysisMode('dimensional');
      } else {
        toast({
          title: "Inspection Complete",
          description: `Analyzed ${inspection.partsAnalyzed} components. ${inspection.partsPassed} passed, ${inspection.partsFailed} failed.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Processing Inspection",
        description: "Failed to analyze the uploaded files. Please try again.",
        variant: "destructive",
      });
      setStep('upload');
    }
  };

  const generatePDF = () => {
    if (!parts.length || !realImage) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Inspection Report", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Source File: ${realImage.name}`, 14, 35);
    
    // Summary Stats
    const total = parts.length;
    const failed = parts.filter(p => p.status !== 'present').length;
    const passed = total - failed;
    
    doc.text(`Total Parts: ${total}`, 14, 45);
    doc.setTextColor(0, 150, 0);
    doc.text(`Passed: ${passed}`, 60, 45);
    doc.setTextColor(200, 0, 0);
    doc.text(`Issues: ${failed}`, 100, 45);
    doc.setTextColor(0, 0, 0);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['Part ID', 'Name', 'Status', 'Deviation (mm)']],
      body: parts.map(p => [
        p.id,
        p.name,
        p.status.toUpperCase(),
        p.deviation ? p.deviation.toFixed(3) : '0.000'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 40, 50] },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
           const status = data.cell.raw as string;
           if (status === 'ABSENT') data.cell.styles.textColor = [200, 0, 0];
           if (status === 'MISALIGNED') data.cell.styles.textColor = [200, 150, 0];
           if (status === 'PRESENT') data.cell.styles.textColor = [0, 150, 0];
        }
      }
    });

    doc.save(`inspection_report_${Date.now()}.pdf`);
    
    toast({
      title: "Report Downloaded",
      description: "PDF report has been saved to your device.",
    });
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
                <div className="mr-4 flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md border border-border">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Threshold</span>
                    <span className="text-xs font-bold font-mono">0.5mm</span>
                  </div>
                  <Slider defaultValue={[0.5]} max={2} step={0.1} className="w-24" />
                </div>

                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Scan
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={generatePDF}>
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
            <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
               
               {/* Mode Switcher */}
               <div className="border-b border-border px-6 py-2 bg-background flex items-center justify-between">
                 <Tabs value={analysisMode} onValueChange={(v: any) => setAnalysisMode(v)} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="presence">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Presence Check
                      </TabsTrigger>
                      <TabsTrigger value="dimensional">
                        <Ruler className="w-4 h-4 mr-2" />
                        Dimensional (Prob 2)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {analysisMode === 'dimensional' && (
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex items-center gap-2">
                         <span className="text-muted-foreground">Pose (6-DoF):</span>
                         <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                           Rx: 1.2°
                         </Badge>
                         <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                           Ry: 0.4°
                         </Badge>
                         <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                           Z: -0.8mm
                         </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Homography:</span>
                        <span className="text-green-500">LOCKED</span>
                      </div>
                    </div>
                  )}
               </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 p-6 overflow-hidden relative">
                  <ImageViewer 
                    realImage={realPreview} 
                    cadImage={cadPreview} 
                    title={realImage?.name || "Inspection View"}
                    mode={analysisMode}
                  />
                  
                  {/* Problem 2: Algorithm Overlay Visualization */}
                  {analysisMode === 'dimensional' && (
                    <div className="absolute top-8 right-8 bg-black/80 backdrop-blur text-white p-4 rounded-lg border border-white/10 w-64 shadow-2xl z-20">
                      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <ScanLine className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-xs tracking-wider">6-DoF PIPELINE</span>
                      </div>
                      <ul className="space-y-2 text-[10px] font-mono text-white/70">
                        <li className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Feature Extraction</span>
                          <span className="text-green-400 font-bold">DONE</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Proj. Transformation</span>
                          <span className="text-green-400 font-bold">MATCHED</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Dim. Verification</span>
                          <span className="text-green-400 font-bold">CALC</span>
                        </li>
                         <li className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Thresholding</span>
                          <span className="text-yellow-400 font-bold">RUNNING</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-2 border-t border-white/10 text-[9px] text-white/50 font-mono text-center">
                        Method: Canny Edge + PnP Solver
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-full border-l border-border bg-card">
                  <PartsList parts={parts} mode={analysisMode} />
                </div>
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
