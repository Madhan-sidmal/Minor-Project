import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Play, Loader2, Camera, AlertTriangle, TrendingUp, Droplet, Beaker } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DigitalTwin3D } from "@/components/DigitalTwin3D";
import { SoilSensorPanel } from "@/components/SoilSensorPanel";
import { FieldCalibrationPanel, FieldCalibration, DEFAULT_CALIBRATION } from "@/components/FieldCalibrationPanel";
import { simulate, ExperimentParams, LandData, SimulationOutput, SoilAnalysis } from "@/lib/twin-simulation";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from "recharts";
import ReactMarkdown from "react-markdown";

const CROPS = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Tomato", "Soybean"];
const SCENARIOS: ExperimentParams["scenario"][] = ["normal", "drought", "heatwave", "heavy_rain", "frost"];

const DigitalTwin = ({ mode = "farmer" }: { mode?: "farmer" | "admin" }) => {
  const { t, lang: language } = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [land, setLand] = useState<LandData | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [params, setParams] = useState<ExperimentParams>({
    crop: "Rice",
    irrigationLevel: 70,
    fertilizerLevel: 50,
    plantingDensity: 60,
    scenario: "normal",
    daysAhead: 60,
  });

  const [sim, setSim] = useState<SimulationOutput | null>(null);
  const [forecast, setForecast] = useState<string>("");
  const [forecasting, setForecasting] = useState(false);
  const [soil, setSoil] = useState<SoilAnalysis | undefined>(undefined);
  const [calibration, setCalibration] = useState<FieldCalibration>(DEFAULT_CALIBRATION);

  // Live re-simulate when soil readings change (e.g. sensor stream)
  useEffect(() => {
    if (land) setSim(simulate(land, params, soil));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soil]);

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large (max 8MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke("digital-twin-analyze", {
          body: { mode: "analyze", imageBase64: base64 },
        });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        setLand(data as LandData);
        if (data.cropGuess && CROPS.includes(data.cropGuess)) {
          setParams((p) => ({ ...p, crop: data.cropGuess }));
        }
        // Seed field calibration from AI area estimate (assume square if no aspect known)
        if (data.areaEstimateSqm && data.areaEstimateSqm > 4) {
          const side = Math.round(Math.sqrt(data.areaEstimateSqm));
          setCalibration((c) => ({ ...c, widthM: side, lengthM: side }));
        }
        toast.success("Land analyzed!");
        // Auto-run baseline sim
        const out = simulate(data as LandData, params, soil);
        setSim(out);
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Analysis failed");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const runExperiment = async () => {
    if (!land) {
      toast.error("Upload a photo first");
      return;
    }
    const out = simulate(land, params, soil);
    setSim(out);
    setForecasting(true);
    setForecast("");
    try {
      const { data, error } = await supabase.functions.invoke("digital-twin-analyze", {
        body: { mode: "forecast", land, params, soil, language },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setForecast(data.forecast || "");
    } catch (e: any) {
      toast.error(e.message || "Forecast failed");
    } finally {
      setForecasting(false);
    }
  };

  const titles: Record<string, Record<string, string>> = {
    en: {
      title: "Digital Twin",
      subtitle: "Photograph your land, simulate crops, forecast outcomes",
      uploadCta: "Upload land photo",
      takePhoto: "Take photo",
      analyzing: "Analyzing terrain with AI…",
      experiment: "Experiment",
      irrigation: "Irrigation level",
      fertilizer: "Fertilizer",
      density: "Planting density",
      scenario: "Weather scenario",
      horizon: "Forecast horizon (days)",
      run: "Run forecast",
      generating: "Generating AI forecast…",
      growth: "Predicted crop growth",
      health: "Health",
      biomass: "Biomass",
      stress: "Water stress",
      finalHealth: "Final health",
      yieldChange: "Yield change",
      water: "Total water",
      risks: "Risks",
      narrative: "AI Forecast",
      uploadHint: "JPG / PNG up to 8MB. We never store your photo.",
    },
    hi: {
      title: "डिजिटल ट्विन",
      subtitle: "अपनी ज़मीन की फ़ोटो लें, फसल अनुकरण करें, परिणाम की भविष्यवाणी करें",
      uploadCta: "ज़मीन की फ़ोटो अपलोड करें",
      takePhoto: "फ़ोटो लें",
      analyzing: "AI से भू-भाग का विश्लेषण…",
      experiment: "प्रयोग",
      irrigation: "सिंचाई स्तर",
      fertilizer: "खाद",
      density: "रोपण घनत्व",
      scenario: "मौसम परिदृश्य",
      horizon: "पूर्वानुमान अवधि (दिन)",
      run: "पूर्वानुमान चलाएँ",
      generating: "AI पूर्वानुमान बन रहा है…",
      growth: "अनुमानित फसल वृद्धि",
      health: "स्वास्थ्य",
      biomass: "जैव-भार",
      stress: "पानी का तनाव",
      finalHealth: "अंतिम स्वास्थ्य",
      yieldChange: "उपज परिवर्तन",
      water: "कुल पानी",
      risks: "जोखिम",
      narrative: "AI पूर्वानुमान",
      uploadHint: "JPG / PNG, 8MB तक। हम आपकी फ़ोटो संग्रहित नहीं करते।",
    },
    kn: {
      title: "ಡಿಜಿಟಲ್ ಟ್ವಿನ್",
      subtitle: "ನಿಮ್ಮ ಭೂಮಿಯ ಫೋಟೋ ತೆಗೆದು, ಬೆಳೆ ಅನುಕರಿಸಿ, ಮುನ್ಸೂಚನೆ ಪಡೆಯಿರಿ",
      uploadCta: "ಭೂಮಿಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
      takePhoto: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
      analyzing: "AI ಮೂಲಕ ಭೂಪ್ರದೇಶ ವಿಶ್ಲೇಷಣೆ…",
      experiment: "ಪ್ರಯೋಗ",
      irrigation: "ನೀರಾವರಿ ಮಟ್ಟ",
      fertilizer: "ಗೊಬ್ಬರ",
      density: "ನೆಡುವ ಸಾಂದ್ರತೆ",
      scenario: "ಹವಾಮಾನ ಸನ್ನಿವೇಶ",
      horizon: "ಮುನ್ಸೂಚನೆ ಅವಧಿ (ದಿನಗಳು)",
      run: "ಮುನ್ಸೂಚನೆ ರನ್ ಮಾಡಿ",
      generating: "AI ಮುನ್ಸೂಚನೆ ತಯಾರಾಗುತ್ತಿದೆ…",
      growth: "ಅಂದಾಜು ಬೆಳೆ ಬೆಳವಣಿಗೆ",
      health: "ಆರೋಗ್ಯ",
      biomass: "ಜೈವಿಕ ಭಾರ",
      stress: "ನೀರಿನ ಒತ್ತಡ",
      finalHealth: "ಅಂತಿಮ ಆರೋಗ್ಯ",
      yieldChange: "ಇಳುವರಿ ಬದಲಾವಣೆ",
      water: "ಒಟ್ಟು ನೀರು",
      risks: "ಅಪಾಯಗಳು",
      narrative: "AI ಮುನ್ಸೂಚನೆ",
      uploadHint: "JPG / PNG, 8MB ವರೆಗೆ. ನಾವು ಫೋಟೋ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.",
    },
  };
  const L = titles[language] || titles.en;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(mode === "admin" ? "/admin" : "/farmer")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">{t.back}</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold">{L.title}</h1>
          </div>
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="container px-4 py-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{L.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{L.subtitle}</p>
        </div>

        {/* Upload */}
        {!land && (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{L.uploadCta}</p>
              <p className="text-xs text-muted-foreground mt-1">{L.uploadHint}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="flex gap-2 justify-center">
              <Button onClick={() => fileRef.current?.click()} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                {analyzing ? L.analyzing : L.takePhoto}
              </Button>
            </div>
          </div>
        )}

        {/* 3D Twin + Photo */}
        {land && (
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DigitalTwin3D
                heightmap={land.heightmap}
                vegetationDensity={land.vegetationDensity}
                soilColor={land.soilColor}
                health={sim?.finalHealth ?? land.healthScore}
                scenario={params.scenario}
                irrigationLevel={params.irrigationLevel}
                soilMoisture={soil?.moisture}
                scale={calibration}
              />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {photoPreview && (
                <img src={photoPreview} alt="Land" className="w-full h-32 object-cover rounded-lg" />
              )}
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Terrain</span><span className="font-medium">{land.dominantTerrain}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Soil</span><span className="font-medium">{land.soilGuess}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vegetation</span><span className="font-medium">{(land.vegetationDensity * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Health</span><span className="font-medium">{land.healthScore}/100</span></div>
                {land.areaEstimateSqm && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Area est.</span><span className="font-medium">{land.areaEstimateSqm} m²</span></div>
                )}
              </div>
              <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{land.notes}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> Replace photo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>
        )}

        {/* Soil & Sensor input */}
        {land && <SoilSensorPanel value={soil} onChange={setSoil} />}

        {/* Experiment Controls */}
        {land && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> {L.experiment}</h3>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-muted-foreground">{t.cropType}</label>
                <Select value={params.crop} onValueChange={(v) => setParams({ ...params, crop: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">{L.scenario}</label>
                <Select value={params.scenario} onValueChange={(v) => setParams({ ...params, scenario: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCENARIOS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <SliderRow label={L.irrigation} value={params.irrigationLevel} onChange={(v) => setParams({ ...params, irrigationLevel: v })} suffix="%" />
              <SliderRow label={L.fertilizer} value={params.fertilizerLevel} onChange={(v) => setParams({ ...params, fertilizerLevel: v })} suffix="%" />
              <SliderRow label={L.density} value={params.plantingDensity} onChange={(v) => setParams({ ...params, plantingDensity: v })} suffix="%" />
              <SliderRow label={L.horizon} value={params.daysAhead} min={14} max={150} step={7} onChange={(v) => setParams({ ...params, daysAhead: v })} suffix="d" />
            </div>

            <Button onClick={runExperiment} disabled={forecasting} className="w-full">
              {forecasting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              {forecasting ? L.generating : L.run}
            </Button>
          </div>
        )}

        {/* Results */}
        {sim && (
          <div className={`grid gap-3 ${sim.soilScore !== undefined ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label={L.finalHealth} value={`${sim.finalHealth}`} sub="/100" />
            <StatCard icon={<Sparkles className="h-4 w-4 text-accent" />} label={L.yieldChange} value={`${sim.yieldChangePct > 0 ? "+" : ""}${sim.yieldChangePct}%`} sub="" tone={sim.yieldChangePct >= 0 ? "good" : "bad"} />
            <StatCard icon={<Droplet className="h-4 w-4 text-chart-blue" />} label={L.water} value={`${sim.totalWaterLiters}`} sub="L/m²" />
            {sim.soilScore !== undefined && (
              <StatCard icon={<Beaker className="h-4 w-4 text-chart-green" />} label="Soil score" value={`${sim.soilScore}`} sub="/100" tone={sim.soilScore >= 70 ? "good" : sim.soilScore < 50 ? "bad" : undefined} />
            )}
          </div>
        )}

        {sim && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">{L.growth}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sim.growthCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 18%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(120, 8%, 55%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(120, 8%, 55%)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(150, 18%, 10%)", border: "1px solid hsl(150, 12%, 18%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="health" stroke="hsl(142, 60%, 45%)" name={L.health} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="biomass" stroke="hsl(40, 90%, 55%)" name={L.biomass} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="waterStress" stroke="hsl(0, 70%, 55%)" name={L.stress} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {sim && sim.risks.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> {L.risks}
            </h3>
            <ul className="space-y-1">
              {sim.risks.map((r, i) => (
                <li key={i} className="text-sm text-secondary-foreground flex gap-2">
                  <span className="text-destructive">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {forecast && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {L.narrative}
            </h3>
            <div className="prose prose-sm prose-invert max-w-none text-secondary-foreground">
              <ReactMarkdown>{forecast}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function SliderRow({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "" }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">{icon}{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${tone === "bad" ? "text-destructive" : tone === "good" ? "text-primary" : ""}`}>{value}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

export default DigitalTwin;
