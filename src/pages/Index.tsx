import { useState, useEffect, useCallback } from "react";
import { runFullPipeline, generateHistoricalUsage, PipelineResult } from "@/lib/ml-simulation";
import { SensorPanel } from "@/components/SensorPanel";
import { RandomForestPanel } from "@/components/RandomForestPanel";
import { DecisionTreePanel } from "@/components/DecisionTreePanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { PipelineFlow } from "@/components/PipelineFlow";
import { Play, RotateCcw, Zap, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CROP_TYPES = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Tomato", "Soybean"];
const SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peat"];

const Index = () => {
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [historicalUsage, setHistoricalUsage] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [cropType, setCropType] = useState("Rice");
  const [soilType, setSoilType] = useState("Loamy");

  const runPipeline = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const usage = generateHistoricalUsage();
      setHistoricalUsage(usage);
      const result = runFullPipeline(cropType, soilType);
      setPipelineResult(result);
      setRunCount((c) => c + 1);
      setIsRunning(false);
    }, 600);
  }, [cropType, soilType]);

  useEffect(() => {
    runPipeline();
  }, []);

  useEffect(() => {
    if (!autoRun) return;
    const interval = setInterval(runPipeline, 5000);
    return () => clearInterval(interval);
  }, [autoRun, runPipeline]);

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Smart Irrigation 4.0</h1>
              <p className="text-[10px] text-muted-foreground">AI-Powered ML Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Runs: {runCount}</span>
            <Button
              variant={autoRun ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRun(!autoRun)}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              {autoRun ? "Auto ON" : "Auto OFF"}
            </Button>
            <Button size="sm" onClick={runPipeline} disabled={isRunning}>
              {isRunning ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              <span className="ml-1 text-xs">Run Pipeline</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Pipeline Flow */}
        <PipelineFlow result={pipelineResult} isRunning={isRunning} />

        {/* Controls */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Crop Type</label>
            <Select value={cropType} onValueChange={setCropType}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CROP_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Soil Type</label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOIL_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {pipelineResult && (
          <>
            {/* Sensor Data */}
            <SensorPanel data={pipelineResult.sensorData} />

            {/* ML Models */}
            <div className="grid lg:grid-cols-2 gap-6">
              <RandomForestPanel result={pipelineResult.randomForest} />
              <DecisionTreePanel result={pipelineResult.decisionTree} />
            </div>

            {/* Forecast */}
            <ForecastPanel result={pipelineResult.linearRegression} historicalUsage={historicalUsage} />

            {/* Footer */}
            <footer className="text-center py-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                AI Based Smart Irrigation System (4.0) — Team 65 | Dayananda Sagar University
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Pipeline: Random Forest → Decision Tree → Linear Regression
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
