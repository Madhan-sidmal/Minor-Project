import { useEffect, useState } from "react";
import { Beaker, Wifi, WifiOff, Loader2, Check, RefreshCw, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SoilAnalysis } from "@/lib/twin-simulation";
import { toast } from "sonner";

interface Props {
  value: SoilAnalysis | undefined;
  onChange: (s: SoilAnalysis | undefined) => void;
}

// Simulated sensor stream (mirrors the project's ESP32 reading model).
// Replace `pollSensor` with a real fetch to your edge function / device endpoint.
async function pollSensor(): Promise<SoilAnalysis> {
  // Add slight jitter so live values look believable
  const j = (base: number, spread: number) => +(base + (Math.random() - 0.5) * spread).toFixed(1);
  await new Promise((r) => setTimeout(r, 350));
  return {
    ph: j(6.6, 0.4),
    nitrogen: Math.round(j(85, 20)),
    phosphorus: Math.round(j(35, 10)),
    potassium: Math.round(j(140, 30)),
    moisture: Math.round(j(48, 8)),
    ec: j(1.4, 0.4),
    organicMatter: j(2.8, 0.6),
    temperature: j(26, 2),
    source: "sensor",
    takenAt: new Date().toISOString(),
  };
}

export const SoilSensorPanel = ({ value, onChange }: Props) => {
  const [tab, setTab] = useState<"sensor" | "manual">("sensor");
  const [connected, setConnected] = useState(false);
  const [polling, setPolling] = useState(false);
  const [autoStream, setAutoStream] = useState(false);
  const [draft, setDraft] = useState<SoilAnalysis>(value || { source: "manual" });

  useEffect(() => {
    if (!autoStream) return;
    const id = setInterval(async () => {
      const s = await pollSensor();
      setDraft(s);
      onChange(s);
    }, 4000);
    return () => clearInterval(id);
  }, [autoStream, onChange]);

  const connect = async () => {
    setPolling(true);
    try {
      const s = await pollSensor();
      setConnected(true);
      setDraft(s);
      onChange(s);
      toast.success("Sensor connected — live readings active");
    } catch {
      toast.error("Could not reach sensor");
    } finally {
      setPolling(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAutoStream(false);
    toast.message("Sensor disconnected");
  };

  const refresh = async () => {
    setPolling(true);
    try {
      const s = await pollSensor();
      setDraft(s);
      onChange(s);
    } finally {
      setPolling(false);
    }
  };

  const setField = (k: keyof SoilAnalysis, v: string) => {
    const num = v === "" ? undefined : Number(v);
    const next = { ...draft, [k]: num, source: "manual" as const };
    setDraft(next);
  };

  const applyManual = () => {
    onChange({ ...draft, source: "manual", takenAt: new Date().toISOString() });
    toast.success("Soil analysis applied");
  };

  const clear = () => {
    setDraft({ source: "manual" });
    onChange(undefined);
    setConnected(false);
    setAutoStream(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Beaker className="h-4 w-4 text-primary" />
          Soil Analysis & Sensors
        </h3>
        {value?.takenAt && (
          <span className="text-[10px] text-muted-foreground">
            updated {new Date(value.takenAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="sensor" className="text-xs">
            <Wifi className="h-3 w-3 mr-1.5" /> Live Sensor
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            <FlaskConical className="h-3 w-3 mr-1.5" /> Lab / Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sensor" className="space-y-3 pt-3">
          {!connected ? (
            <div className="rounded-lg bg-muted/40 border border-dashed border-border p-4 text-center space-y-3">
              <WifiOff className="h-6 w-6 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No sensor connected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect to your ESP32 soil probe to stream live pH, NPK, moisture & EC.
                </p>
              </div>
              <Button onClick={connect} disabled={polling} size="sm" className="w-full">
                {polling ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Wifi className="h-3.5 w-3.5 mr-2" />
                )}
                {polling ? "Connecting…" : "Connect sensor"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <span className="flex items-center gap-2 text-xs font-medium text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Live: ESP32 Soil Probe #1
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={refresh} disabled={polling} className="h-7 px-2">
                    {polling ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={disconnect} className="h-7 px-2 text-destructive">
                    <WifiOff className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <SensorGrid s={draft} />

              <label className="flex items-center justify-between text-xs cursor-pointer rounded-lg border border-border bg-muted/20 px-3 py-2">
                <span className="text-muted-foreground">Auto-stream every 4s</span>
                <input
                  type="checkbox"
                  checked={autoStream}
                  onChange={(e) => setAutoStream(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="pH" suffix="" value={draft.ph} onChange={(v) => setField("ph", v)} step="0.1" />
            <Field label="Moisture" suffix="%" value={draft.moisture} onChange={(v) => setField("moisture", v)} />
            <Field label="Nitrogen" suffix="ppm" value={draft.nitrogen} onChange={(v) => setField("nitrogen", v)} />
            <Field label="Phosphorus" suffix="ppm" value={draft.phosphorus} onChange={(v) => setField("phosphorus", v)} />
            <Field label="Potassium" suffix="ppm" value={draft.potassium} onChange={(v) => setField("potassium", v)} />
            <Field label="EC (salinity)" suffix="dS/m" value={draft.ec} onChange={(v) => setField("ec", v)} step="0.1" />
            <Field label="Organic matter" suffix="%" value={draft.organicMatter} onChange={(v) => setField("organicMatter", v)} step="0.1" />
            <Field label="Soil temp" suffix="°C" value={draft.temperature} onChange={(v) => setField("temperature", v)} step="0.1" />
          </div>
          <div className="flex gap-2">
            <Button onClick={applyManual} size="sm" className="flex-1">
              <Check className="h-3.5 w-3.5 mr-1.5" /> Apply to twin
            </Button>
            <Button onClick={clear} size="sm" variant="outline">
              Clear
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function Field({
  label,
  suffix,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  suffix: string;
  value: number | undefined;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <Input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm pr-12"
          placeholder="—"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function SensorGrid({ s }: { s: SoilAnalysis }) {
  const items: { label: string; value: string; tone?: "ok" | "warn" | "bad" }[] = [
    { label: "pH", value: s.ph?.toString() ?? "—", tone: s.ph && (s.ph < 5.5 || s.ph > 7.5) ? "warn" : "ok" },
    { label: "Moisture", value: `${s.moisture ?? "—"}%`, tone: s.moisture && s.moisture < 30 ? "bad" : "ok" },
    { label: "N", value: `${s.nitrogen ?? "—"} ppm` },
    { label: "P", value: `${s.phosphorus ?? "—"} ppm` },
    { label: "K", value: `${s.potassium ?? "—"} ppm` },
    { label: "EC", value: `${s.ec ?? "—"} dS/m`, tone: s.ec && s.ec > 2 ? "warn" : "ok" },
    { label: "OM", value: `${s.organicMatter ?? "—"}%` },
    { label: "Temp", value: `${s.temperature ?? "—"}°C` },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {items.map((it) => (
        <div
          key={it.label}
          className={`rounded-md border px-2 py-1.5 text-center ${
            it.tone === "bad"
              ? "border-destructive/40 bg-destructive/10"
              : it.tone === "warn"
                ? "border-chart-orange/40 bg-chart-orange/10"
                : "border-border bg-muted/30"
          }`}
        >
          <div className="text-[9px] uppercase text-muted-foreground">{it.label}</div>
          <div className="text-xs font-mono font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
