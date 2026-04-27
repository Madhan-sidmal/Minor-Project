import { useState, useEffect } from "react";
import { Ruler, Camera as CameraIcon, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FieldCalibration {
  widthM: number;       // real field width (X) in meters
  lengthM: number;      // real field length (Z) in meters
  cameraHeightM: number; // camera height above ground when photo was taken
  cameraFovDeg: number;  // horizontal FOV of capturing camera (deg)
  tiltDeg: number;       // camera tilt below horizontal (0 = level, 90 = nadir)
}

export const DEFAULT_CALIBRATION: FieldCalibration = {
  widthM: 50,
  lengthM: 50,
  cameraHeightM: 1.6,
  cameraFovDeg: 70,
  tiltDeg: 25,
};

interface Props {
  value: FieldCalibration;
  onChange: (c: FieldCalibration) => void;
  areaEstimateSqm?: number;
}

export const FieldCalibrationPanel = ({ value, onChange, areaEstimateSqm }: Props) => {
  const [local, setLocal] = useState<FieldCalibration>(value);

  useEffect(() => setLocal(value), [value]);

  const update = <K extends keyof FieldCalibration>(k: K, v: FieldCalibration[K]) => {
    const next = { ...local, [k]: v };
    setLocal(next);
    onChange(next);
  };

  const computedArea = Math.round(local.widthM * local.lengthM);
  const aspect = (local.widthM / local.lengthM).toFixed(2);

  const applyEstimate = () => {
    if (!areaEstimateSqm) return;
    const side = Math.round(Math.sqrt(areaEstimateSqm));
    update("widthM", side);
    setTimeout(() => update("lengthM", side), 0);
  };

  const reset = () => {
    setLocal(DEFAULT_CALIBRATION);
    onChange(DEFAULT_CALIBRATION);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" /> Farm scale calibration
        </h3>
        <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Match the digital twin to your real farm proportions. Measurements come from a tape, GPS,
        or land-records document — accuracy improves yield and water estimates.
      </p>

      {/* Real field dimensions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <NumField
          label="Field width (m)"
          value={local.widthM}
          min={2}
          max={2000}
          step={1}
          onChange={(v) => update("widthM", v)}
        />
        <NumField
          label="Field length (m)"
          value={local.lengthM}
          min={2}
          max={2000}
          step={1}
          onChange={(v) => update("lengthM", v)}
        />
      </div>

      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 -mt-2">
        <span>Area: <span className="font-mono text-foreground">{computedArea.toLocaleString()} m²</span></span>
        <span>= <span className="font-mono text-foreground">{(computedArea / 10000).toFixed(3)} ha</span></span>
        <span>= <span className="font-mono text-foreground">{(computedArea / 4046.86).toFixed(3)} acres</span></span>
        <span>Aspect: <span className="font-mono text-foreground">{aspect}</span></span>
        {areaEstimateSqm && (
          <button
            type="button"
            onClick={applyEstimate}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Use AI estimate ({areaEstimateSqm} m²)
          </button>
        )}
      </div>

      {/* Camera capture parameters */}
      <div className="pt-3 border-t border-border space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CameraIcon className="h-3.5 w-3.5" /> Capture geometry (used to project the photo onto the terrain)
        </div>

        <SliderField
          label="Camera height above ground"
          value={local.cameraHeightM}
          display={`${local.cameraHeightM.toFixed(1)} m`}
          min={0.5}
          max={120}
          step={0.1}
          onChange={(v) => update("cameraHeightM", v)}
          hint="≈1.6m for hand-held, 3–10m for tractor/pole, 30–120m for drone"
        />

        <SliderField
          label="Camera horizontal FOV"
          value={local.cameraFovDeg}
          display={`${local.cameraFovDeg}°`}
          min={20}
          max={120}
          step={1}
          onChange={(v) => update("cameraFovDeg", v)}
          hint="Phone main lens ≈ 70°, ultrawide ≈ 100°, drone ≈ 84°"
        />

        <SliderField
          label="Camera tilt below horizon"
          value={local.tiltDeg}
          display={`${local.tiltDeg}°`}
          min={0}
          max={90}
          step={1}
          onChange={(v) => update("tiltDeg", v)}
          hint="0° = level, 25° = typical farmer photo, 90° = top-down drone"
        />
      </div>
    </div>
  );
};

function NumField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="mt-1 font-mono"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono font-medium">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
