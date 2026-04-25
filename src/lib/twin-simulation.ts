// Local crop-growth + scenario simulator that runs alongside AI narrative

export interface ExperimentParams {
  crop: string;
  irrigationLevel: number; // 0-100 (% of optimum)
  fertilizerLevel: number; // 0-100
  plantingDensity: number; // 0-100
  scenario: "normal" | "drought" | "heatwave" | "heavy_rain" | "frost";
  daysAhead: number; // 30-120
}

export interface LandData {
  landName?: string;
  dominantTerrain: string;
  vegetationDensity: number;
  soilColor: string;
  soilGuess: string;
  cropGuess?: string;
  healthScore: number;
  areaEstimateSqm?: number;
  heightmap: number[]; // 256 values
  notes: string;
}

export interface SimulationOutput {
  growthCurve: { day: number; health: number; biomass: number; waterStress: number }[];
  finalHealth: number;
  finalBiomass: number;
  totalWaterLiters: number;
  yieldChangePct: number;
  risks: string[];
}

const CROP_OPTIMA: Record<string, { water: number; temp: number; growthRate: number }> = {
  Rice: { water: 90, temp: 28, growthRate: 1.0 },
  Wheat: { water: 50, temp: 20, growthRate: 0.85 },
  Corn: { water: 65, temp: 25, growthRate: 1.05 },
  Sugarcane: { water: 85, temp: 27, growthRate: 1.1 },
  Cotton: { water: 55, temp: 28, growthRate: 0.9 },
  Tomato: { water: 60, temp: 22, growthRate: 0.95 },
  Soybean: { water: 45, temp: 24, growthRate: 0.9 },
};

const SCENARIO_MOD: Record<ExperimentParams["scenario"], { waterMul: number; tempDelta: number; stressDaily: number }> = {
  normal: { waterMul: 1, tempDelta: 0, stressDaily: 0 },
  drought: { waterMul: 0.4, tempDelta: 5, stressDaily: 0.012 },
  heatwave: { waterMul: 0.85, tempDelta: 10, stressDaily: 0.018 },
  heavy_rain: { waterMul: 1.6, tempDelta: -3, stressDaily: 0.008 },
  frost: { waterMul: 0.9, tempDelta: -12, stressDaily: 0.025 },
};

export function simulate(land: LandData, params: ExperimentParams): SimulationOutput {
  const opt = CROP_OPTIMA[params.crop] || CROP_OPTIMA.Rice;
  const sc = SCENARIO_MOD[params.scenario];

  let health = land.healthScore;
  let biomass = 5; // arbitrary units
  let waterStress = 0;
  let totalWater = 0;

  const curve: SimulationOutput["growthCurve"] = [];
  const days = Math.max(7, Math.min(180, params.daysAhead));

  // density penalty when too high
  const densityFactor = params.plantingDensity > 80 ? 1 - (params.plantingDensity - 80) * 0.01 : 1;
  const fertFactor = 0.6 + (params.fertilizerLevel / 100) * 0.55; // 0.6 - 1.15
  const overFertPenalty = params.fertilizerLevel > 90 ? 0.92 : 1;

  for (let d = 1; d <= days; d++) {
    const waterDelivered = opt.water * (params.irrigationLevel / 100) * sc.waterMul;
    totalWater += waterDelivered * 0.5; // L per sqm proxy

    const waterRatio = waterDelivered / opt.water;
    const dailyStress = Math.abs(1 - waterRatio) * 0.4 + sc.stressDaily;
    waterStress = Math.min(1, waterStress * 0.85 + dailyStress);

    const growth = opt.growthRate * fertFactor * densityFactor * overFertPenalty * (1 - waterStress) * 0.6;
    biomass += growth;
    health = Math.max(5, Math.min(100, health + (growth * 1.2 - waterStress * 8)));

    curve.push({
      day: d,
      health: +health.toFixed(1),
      biomass: +biomass.toFixed(2),
      waterStress: +waterStress.toFixed(2),
    });
  }

  const baselineYield = land.healthScore * 0.8;
  const yieldChange = ((health - baselineYield) / baselineYield) * 100;

  const risks: string[] = [];
  if (waterStress > 0.5) risks.push("High water stress");
  if (params.fertilizerLevel > 90) risks.push("Fertilizer burn risk");
  if (params.plantingDensity > 85) risks.push("Overcrowding reduces airflow");
  if (params.irrigationLevel < 30 && params.scenario !== "heavy_rain") risks.push("Insufficient irrigation");
  if (params.scenario === "frost") risks.push("Frost damage to foliage");
  if (params.scenario === "drought") risks.push("Prolonged drought stress");
  if (risks.length === 0) risks.push("No major risks detected");

  return {
    growthCurve: curve,
    finalHealth: +health.toFixed(1),
    finalBiomass: +biomass.toFixed(2),
    totalWaterLiters: +totalWater.toFixed(0),
    yieldChangePct: +yieldChange.toFixed(1),
    risks,
  };
}
