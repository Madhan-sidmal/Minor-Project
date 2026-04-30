import { useState, useEffect, useCallback } from "react";
import { runFullPipeline, generateHistoricalUsage, PipelineResult } from "@/lib/ml-simulation";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { translateCrop, translateSoil, translateClassification, getGreeting } from "@/lib/i18n";
import { Droplets, Thermometer, CloudRain, Sun, Wind, Leaf, Power, RefreshCw, Settings, ChevronRight, TrendingUp, Lightbulb, ArrowLeft, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CROP_TYPES = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Tomato", "Soybean"];
const SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peat"];

const FarmerPortal = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [historicalUsage, setHistoricalUsage] = useState<number[]>([]);
  const [cropType, setCropType] = useState(() => localStorage.getItem("farmer-crop") || "Rice");
  const [soilType, setSoilType] = useState(() => localStorage.getItem("farmer-soil") || "Loamy");
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      const usage = generateHistoricalUsage();
      setHistoricalUsage(usage);
      setResult(runFullPipeline(cropType, soilType));
      setIsRefreshing(false);
    }, 800);
  }, [cropType, soilType]);

  useEffect(() => { refresh(); }, []);

  const saveSettings = () => {
    localStorage.setItem("farmer-crop", cropType);
    localStorage.setItem("farmer-soil", soilType);
    setShowSettings(false);
    toast.success(t.settingsSaved);
    refresh();
  };

  const greeting = getGreeting(t);

  const conditionColors = {
    dry: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", icon: "🔴" },
    optimal: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", icon: "🟢" },
    wet: { bg: "bg-chart-blue/10", border: "border-chart-blue/30", text: "text-chart-blue", icon: "🔵" },
    saturated: { bg: "bg-chart-cyan/10", border: "border-chart-cyan/30", text: "text-chart-cyan", icon: "🟣" },
  };

  if (!result) return (
    <div className="dashboard-bright min-h-screen flex items-center justify-center">
      <RefreshCw className="h-8 w-8 text-primary animate-spin" />
    </div>
  );

  const cls = result.randomForest.classification;
  const colors = conditionColors[cls];

  const forecastData = result.linearRegression.forecast.map((f) => ({
    day: `${t.today} +${f.day}`,
    value: f.predictedUsage,
  }));

  const tips = [t.tip1, t.tip2, t.tip3, t.tip4];

  return (
    <div className="dashboard-bright min-h-screen">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">{t.back}</span>
          </button>
          <LanguageSwitcher compact />
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold">{greeting} 🌾</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {translateCrop(cropType, t)} • {translateSoil(soilType, t)}
          </p>
        </div>

        {/* Digital Twin CTA */}
        <button
          onClick={() => navigate("/twin")}
          className="w-full rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 p-4 text-left flex items-center gap-3 hover:border-accent/50 transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">🌍</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Digital Twin</p>
            <p className="text-xs text-muted-foreground">Photograph your land → 3D view & forecast</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-in slide-in-from-top-2">
            <h3 className="font-semibold">{t.settings}</h3>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">{t.selectCrop}</label>
              <div className="grid grid-cols-3 gap-2">
                {CROP_TYPES.map((c) => (
                  <button key={c} onClick={() => setCropType(c)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      cropType === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}>
                    {translateCrop(c, t)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">{t.selectSoil}</label>
              <div className="grid grid-cols-3 gap-2">
                {SOIL_TYPES.map((s) => (
                  <button key={s} onClick={() => setSoilType(s)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      soilType === s ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}>
                    {translateSoil(s, t)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveSettings} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
              {t.saveSettings}
            </button>
          </div>
        )}

        {/* Main Status Card */}
        <div className={`rounded-2xl border-2 p-6 ${colors.bg} ${colors.border} transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{t.irrigationStatus}</span>
            <span className="text-3xl">{result.decisionTree.shouldIrrigate ? "💧" : "✅"}</span>
          </div>

          <div className={`text-3xl font-bold mb-2 ${result.decisionTree.shouldIrrigate ? "text-primary" : "text-muted-foreground"}`}>
            {result.decisionTree.shouldIrrigate ? t.irrigationOn : t.irrigationOff}
          </div>

          <p className="text-sm text-secondary-foreground leading-relaxed">{result.decisionTree.reason}</p>

          {result.decisionTree.shouldIrrigate && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-background/50 p-3 text-center">
                <Droplets className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold font-mono text-primary">{result.decisionTree.waterAmount}</p>
                <p className="text-xs text-muted-foreground">{t.liters}</p>
              </div>
              <div className="rounded-xl bg-background/50 p-3 text-center">
                <Power className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-2xl font-bold font-mono text-accent">{result.decisionTree.duration}</p>
                <p className="text-xs text-muted-foreground">{t.minutes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Soil Condition */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t.soilCondition}</h3>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{colors.icon}</span>
            <div className="flex-1">
              <p className={`text-xl font-bold ${colors.text}`}>{translateClassification(cls, t)}</p>
              <p className="text-sm text-muted-foreground">
                {t.confidence}: {(result.randomForest.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono">{result.sensorData.soilMoisture.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">{t.soilMoisture}</p>
            </div>
          </div>
        </div>

        {/* Quick Weather Strip */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t.weatherToday}</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <Thermometer className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="font-mono font-semibold text-sm">{result.sensorData.temperature.toFixed(0)}°</p>
              <p className="text-[10px] text-muted-foreground">{t.temperature}</p>
            </div>
            <div>
              <Droplets className="h-5 w-5 mx-auto text-chart-blue mb-1" />
              <p className="font-mono font-semibold text-sm">{result.sensorData.humidity.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">{t.humidity}</p>
            </div>
            <div>
              <CloudRain className="h-5 w-5 mx-auto text-chart-cyan mb-1" />
              <p className="font-mono font-semibold text-sm">{result.sensorData.rainfall.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">{t.rainfall} (mm)</p>
            </div>
            <div>
              <Sun className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="font-mono font-semibold text-sm">{result.sensorData.sunlight.toFixed(0)}h</p>
              <p className="text-[10px] text-muted-foreground">{t.sunlight}</p>
            </div>
          </div>
        </div>

        {/* Water Forecast */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">{t.waterForecast}</h3>
            <span className="text-xs text-muted-foreground">{t.nextDays}</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="farmerForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 18%)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(120, 8%, 55%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(120, 8%, 55%)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(150, 18%, 10%)", border: "1px solid hsl(150, 12%, 18%)", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="value" stroke="hsl(142, 60%, 45%)" fill="url(#farmerForecast)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Farming Tips */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-medium text-muted-foreground">{t.tipsTitle}</h3>
          </div>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30">
                <span className="text-primary mt-0.5">•</span>
                <p className="text-sm text-secondary-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          {t.tapToRefresh}
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">{t.teamCredit}</p>
      </main>
    </div>
  );
};

export default FarmerPortal;
