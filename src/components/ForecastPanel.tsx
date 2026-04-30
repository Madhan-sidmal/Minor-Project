import { LinearRegressionResult } from "@/lib/ml-simulation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface Props {
  result: LinearRegressionResult;
  historicalUsage: number[];
}

export function ForecastPanel({ result, historicalUsage }: Props) {
  const trendIcon = {
    increasing: <TrendingUp className="h-4 w-4 text-destructive" />,
    decreasing: <TrendingDown className="h-4 w-4 text-primary" />,
    stable: <Minus className="h-4 w-4 text-accent" />,
  };

  const trendColor = {
    increasing: "text-destructive",
    decreasing: "text-primary",
    stable: "text-accent",
  };

  // Combine historical + forecast for chart
  const chartData = [
    ...historicalUsage.slice(-14).map((val, i) => ({
      label: `Day ${i + 1}`,
      actual: val,
      predicted: null as number | null,
    })),
    ...result.forecast.map((f) => ({
      label: `+${f.day}d`,
      actual: null as number | null,
      predicted: f.predictedUsage,
    })),
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stage 3: Linear Regression</h3>
          <p className="text-xs text-muted-foreground mt-1">7-Day Water Usage Forecast</p>
        </div>
        <div className="flex items-center gap-2">
          {trendIcon[result.trend]}
          <span className={`text-sm font-medium ${trendColor[result.trend]}`}>{result.trend}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="predictGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fill="url(#actualGrad)" strokeWidth={2} connectNulls={false} />
            <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fill="url(#predictGrad)" strokeWidth={2} strokeDasharray="5 5" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">R² Score</p>
          <p className="font-mono text-lg font-semibold text-foreground">{result.rSquared}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Slope</p>
          <p className="font-mono text-lg font-semibold text-foreground">{result.slope}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Avg Forecast</p>
          <p className="font-mono text-lg font-semibold text-accent">
            {(result.forecast.reduce((s, f) => s + f.predictedUsage, 0) / result.forecast.length).toFixed(1)}L
          </p>
        </div>
      </div>
    </div>
  );
}
