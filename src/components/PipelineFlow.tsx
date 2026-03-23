import { PipelineResult } from "@/lib/ml-simulation";
import { ArrowRight, TreeDeciduous, GitBranch, TrendingUp, Database } from "lucide-react";

interface Props {
  result: PipelineResult | null;
  isRunning: boolean;
}

function StageNode({ icon: Icon, label, status, active }: {
  icon: React.ElementType;
  label: string;
  status: string;
  active: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? "scale-105" : "opacity-60"}`}>
      <div className={`rounded-full p-2.5 border transition-all duration-300 ${
        active ? "bg-primary/10 border-primary/40 glow-green" : "bg-secondary border-border"
      }`}>
        <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <span className="text-xs font-medium">{label}</span>
      <span className={`text-[10px] font-mono ${active ? "text-primary" : "text-muted-foreground"}`}>{status}</span>
    </div>
  );
}

export function PipelineFlow({ result, isRunning }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        <StageNode icon={Database} label="Sensors" status={result ? "LIVE" : "IDLE"} active={!!result} />
        <ArrowRight className={`h-4 w-4 shrink-0 ${isRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <StageNode icon={TreeDeciduous} label="Random Forest" status={result ? `${(result.randomForest.confidence * 100).toFixed(0)}%` : "—"} active={!!result} />
        <ArrowRight className={`h-4 w-4 shrink-0 ${isRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <StageNode icon={GitBranch} label="Decision Tree" status={result ? (result.decisionTree.shouldIrrigate ? "ON" : "OFF") : "—"} active={!!result} />
        <ArrowRight className={`h-4 w-4 shrink-0 ${isRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <StageNode icon={TrendingUp} label="Regression" status={result ? result.linearRegression.trend : "—"} active={!!result} />
      </div>
    </div>
  );
}
