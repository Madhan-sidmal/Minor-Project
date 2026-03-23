import { RandomForestResult } from "@/lib/ml-simulation";

interface Props {
  result: RandomForestResult;
}

const classColors: Record<string, string> = {
  dry: "text-destructive",
  optimal: "text-primary",
  wet: "text-chart-blue",
  saturated: "text-chart-cyan",
};

const classBgColors: Record<string, string> = {
  dry: "bg-destructive/10 border-destructive/30",
  optimal: "bg-primary/10 border-primary/30",
  wet: "bg-chart-blue/10 border-chart-blue/30",
  saturated: "bg-chart-cyan/10 border-chart-cyan/30",
};

export function RandomForestPanel({ result }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stage 1: Random Forest</h3>
          <p className="text-xs text-muted-foreground mt-1">100 Decision Trees → Majority Vote Classification</p>
        </div>
        <div className={`px-3 py-1.5 rounded-md border font-mono text-sm font-semibold ${classBgColors[result.classification]}`}>
          <span className={classColors[result.classification]}>{result.classification.toUpperCase()}</span>
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-mono text-primary">{(result.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${result.confidence * 100}%` }} />
        </div>
      </div>

      {/* Tree Votes */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Tree Votes Distribution</p>
        <div className="flex gap-1 h-8">
          {result.treeVotes.map((v) => (
            <div
              key={v.classification}
              className={`rounded-sm flex items-center justify-center text-xs font-mono transition-all ${classBgColors[v.classification]}`}
              style={{ width: `${v.count}%` }}
              title={`${v.classification}: ${v.count} votes`}
            >
              {v.count > 10 && v.count}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {result.treeVotes.map((v) => (
            <span key={v.classification} className={`text-xs ${classColors[v.classification]}`}>
              {v.classification}: {v.count}
            </span>
          ))}
        </div>
      </div>

      {/* Feature Importance */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Feature Importance</p>
        <div className="space-y-1.5">
          {result.featureImportance.map((f) => (
            <div key={f.feature} className="flex items-center gap-2">
              <span className="text-xs text-secondary-foreground w-24 truncate">{f.feature}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${f.importance * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-10 text-right">{(f.importance * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
