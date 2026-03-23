import { DecisionTreeResult } from "@/lib/ml-simulation";
import { ArrowRight, Power, Droplets, Timer } from "lucide-react";

interface Props {
  result: DecisionTreeResult;
}

export function DecisionTreePanel({ result }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stage 2: Decision Tree</h3>
          <p className="text-xs text-muted-foreground mt-1">Automated Irrigation Decision Engine</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-sm font-semibold ${
          result.shouldIrrigate 
            ? "bg-primary/10 border-primary/30 text-primary" 
            : "bg-secondary border-border text-muted-foreground"
        }`}>
          <Power className="h-3.5 w-3.5" />
          {result.shouldIrrigate ? "IRRIGATE" : "STANDBY"}
        </div>
      </div>

      {/* Decision Path */}
      <div className="bg-secondary/50 rounded-md p-3">
        <p className="text-xs text-muted-foreground mb-2">Decision Path</p>
        <div className="space-y-1">
          {result.path.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span className="text-xs text-secondary-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reason */}
      <p className="text-sm text-foreground">{result.reason}</p>

      {/* Irrigation Parameters */}
      {result.shouldIrrigate && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Water Amount</span>
            </div>
            <p className="font-mono text-xl font-semibold text-primary">{result.waterAmount}<span className="text-sm ml-1">L</span></p>
          </div>
          <div className="rounded-md border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <p className="font-mono text-xl font-semibold text-accent">{result.duration}<span className="text-sm ml-1">min</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
