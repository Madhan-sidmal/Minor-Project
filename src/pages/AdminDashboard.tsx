import { useState, useEffect, useCallback } from "react";
import { runFullPipeline, generateHistoricalUsage, PipelineResult } from "@/lib/ml-simulation";
import { SensorPanel } from "@/components/SensorPanel";
import { RandomForestPanel } from "@/components/RandomForestPanel";
import { DecisionTreePanel } from "@/components/DecisionTreePanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { PipelineFlow } from "@/components/PipelineFlow";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { Play, RotateCcw, Zap, Leaf, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translateCrop, translateSoil } from "@/lib/i18n";

const CROP_TYPES = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Tomato", "Soybean"];
const SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peat"];

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
      setPipelineResult(runFullPipeline(cropType, soilType));
      setRunCount((c) => c + 1);
      setIsRunning(false);
    }, 600);
  }, [cropType, soilType]);

  useEffect(() => { runPipeline(); }, []);
  useEffect(() => {
    if (!autoRun) return;
    const interval = setInterval(runPipeline, 5000);
    return () => clearInterval(interval);
  }, [autoRun, runPipeline]);

  return (
    <div className="dashboard-bright min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">{t.adminPortal}</h1>
              <p className="text-[10px] text-muted-foreground">{t.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/twin")} className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Digital Twin
            </Button>
            <span className="text-xs font-mono text-muted-foreground">{t.runs}: {runCount}</span>
            <Button variant={autoRun ? "default" : "outline"} size="sm" onClick={() => setAutoRun(!autoRun)} className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {t.autoMode} {autoRun ? "ON" : "OFF"}
            </Button>
            <Button size="sm" onClick={runPipeline} disabled={isRunning}>
              {isRunning ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              <span className="ml-1 text-xs">{t.runPipeline}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <PipelineFlow result={pipelineResult} isRunning={isRunning} />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">{t.cropType}</label>
            <Select value={cropType} onValueChange={setCropType}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CROP_TYPES.map((c) => <SelectItem key={c} value={c}>{translateCrop(c, t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">{t.soilType}</label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOIL_TYPES.map((s) => <SelectItem key={s} value={s}>{translateSoil(s, t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {pipelineResult && (
          <>
            <SensorPanel data={pipelineResult.sensorData} />
            <div className="grid lg:grid-cols-2 gap-6">
              <RandomForestPanel result={pipelineResult.randomForest} />
              <DecisionTreePanel result={pipelineResult.decisionTree} />
            </div>
            <ForecastPanel result={pipelineResult.linearRegression} historicalUsage={historicalUsage} />
            <footer className="text-center py-4 border-t border-border">
              <p className="text-xs text-muted-foreground">{t.teamCredit}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.pipelineDesc}</p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
