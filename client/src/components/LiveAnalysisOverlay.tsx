import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scan,
    Cpu,
    Layers,
    Box,
    CheckCircle2,
    Loader2,
    Activity,
    Zap,
    Fingerprint,
    Grid3X3
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressStep {
    step: string;
    message: string;
    timestamp: number;
}

interface LiveAnalysisOverlayProps {
    isVisible: boolean;
    currentStep: string;
    currentMessage: string;
}

const STEPS_CONFIG: Record<string, { icon: any, label: string, color: string }> = {
    upload_complete: { icon: CheckCircle2, label: "Asset Intake", color: "text-green-400" },
    pre_processing: { icon: Cpu, label: "Neural Pre-processing", color: "text-blue-400" },
    structural_analysis_start: { icon: Activity, label: "Structural Mapping", color: "text-purple-400" },
    orb_analysis: { icon: Fingerprint, label: "ORB Feature Extraction", color: "text-yellow-400" },
    ssim_analysis: { icon: Grid3X3, label: "SSIM Verification", color: "text-cyan-400" },
    detailed_analysis_start: { icon: Layers, label: "Sub-component Analysis", color: "text-orange-400" },
    part_analysis: { icon: Box, label: "Part Verification", color: "text-pink-400" },
    mesh_pose_computation: { icon: Zap, label: "Mesh Pose Alignment", color: "text-indigo-400" },
};

export const LiveAnalysisOverlay: React.FC<LiveAnalysisOverlayProps> = ({
    isVisible,
    currentStep,
    currentMessage
}) => {
    const [history, setHistory] = useState<ProgressStep[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (currentStep) {
            setHistory(prev => {
                // Avoid duplicate messages for same step if they are identical
                if (prev.length > 0 && prev[prev.length - 1].message === currentMessage) {
                    return prev;
                }
                return [...prev, { step: currentStep, message: currentMessage, timestamp: Date.now() }];
            });

            // Simple progress calculation based on known steps
            const steps = Object.keys(STEPS_CONFIG);
            const index = steps.indexOf(currentStep);
            if (index !== -1) {
                setProgress(((index + 1) / steps.length) * 100);
            }
        }
    }, [currentStep, currentMessage]);

    useEffect(() => {
        if (!isVisible) {
            setHistory([]);
            setProgress(0);
        }
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-border bg-muted/30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Scan className="w-6 h-6 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">Real-Time Analysis Engine</h2>
                                        <p className="text-sm text-muted-foreground italic">Processing computer vision tech stacks...</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-mono font-bold text-primary">{Math.round(progress)}%</span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Calibration</span>
                                </div>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {history.map((item, idx) => {
                                    const config = STEPS_CONFIG[item.step] || { icon: Loader2, label: "Analysis", color: "text-muted-foreground" };
                                    const Icon = config.icon;
                                    const isLatest = idx === history.length - 1;

                                    return (
                                        <motion.div
                                            key={item.timestamp + idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex gap-4 p-3 rounded-lg border transition-colors ${isLatest ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 border-transparent opacity-60"
                                                }`}
                                        >
                                            <div className={`mt-1 ${config.color}`}>
                                                <Icon className={`w-5 h-5 ${isLatest && item.step !== 'upload_complete' ? 'animate-spin-slow' : ''}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                        {config.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground/50">
                                                        +{((item.timestamp - (history[0]?.timestamp || item.timestamp)) / 1000).toFixed(1)}s
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${isLatest ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                                    {item.message}
                                                </p>
                                            </div>
                                            {isLatest && (
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="flex items-center"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        <div className="p-4 bg-muted/50 border-t border-border flex justify-between items-center text-[10px] uppercase tracking-tighter text-muted-foreground">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> OpenCV 4.8</span>
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> PyTorch JIT</span>
                            </div>
                            <span>Kernel ID: XR-900-V</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
