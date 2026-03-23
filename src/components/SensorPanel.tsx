import { SensorData } from "@/lib/ml-simulation";
import { Droplets, Thermometer, Wind, Sun, CloudRain, Leaf } from "lucide-react";

interface SensorPanelProps {
  data: SensorData;
}

function SensorCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: "green" | "blue" | "amber" | "red" | "cyan";
}) {
  const colorMap = {
    green: "text-primary border-primary/20 glow-green",
    blue: "text-chart-blue border-chart-blue/20",
    amber: "text-accent border-accent/20 glow-amber",
    red: "text-destructive border-destructive/20",
    cyan: "text-chart-cyan border-chart-cyan/20",
  };

  return (
    <div className={`rounded-lg border bg-card p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 opacity-70" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono text-2xl font-semibold">{value}<span className="text-sm text-muted-foreground ml-1">{unit}</span></div>
    </div>
  );
}

export function SensorPanel({ data }: SensorPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Sensor Data</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SensorCard icon={Droplets} label="Soil Moisture" value={data.soilMoisture.toFixed(1)} unit="%" color="blue" />
        <SensorCard icon={Thermometer} label="Temperature" value={data.temperature.toFixed(1)} unit="°C" color={data.temperature > 35 ? "red" : "amber"} />
        <SensorCard icon={Droplets} label="Humidity" value={data.humidity.toFixed(1)} unit="%" color="cyan" />
        <SensorCard icon={CloudRain} label="Rainfall" value={data.rainfall.toFixed(1)} unit="mm" color="blue" />
        <SensorCard icon={Sun} label="Sunlight" value={data.sunlight.toFixed(1)} unit="hrs" color="amber" />
        <SensorCard icon={Wind} label="Wind Speed" value={data.windSpeed.toFixed(1)} unit="km/h" color="green" />
      </div>
      <div className="flex gap-3">
        <div className="rounded-lg border border-border bg-card p-3 flex-1">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Crop</span>
          </div>
          <p className="font-medium mt-1">{data.cropType}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 flex-1">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Soil</span>
          </div>
          <p className="font-medium mt-1">{data.soilType}</p>
        </div>
      </div>
    </div>
  );
}
