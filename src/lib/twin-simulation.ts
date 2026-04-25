// Local crop-growth + scenario simulator that runs alongside AI narrative

export interface ExperimentParams {
  crop: string;
  irrigationLevel: number; // 0-100 (% of optimum)
  fertilizerLevel: number; // 0-100
  plantingDensity: number; // 0-100
  scenario: "normal" | "drought" | "heatwave" | "heavy_rain" | "frost";
  daysAhead: number; // 30-120
}

export interface SoilAnalysis {
  ph?: number;            // 4.0 - 9.0
  nitrogen?: number;      // ppm 0-200
  phosphorus?: number;    // ppm 0-100
  potassium?: number;     // ppm 0-300
  moisture?: number;      // % 0-100
  ec?: number;            // dS/m 0-5 (salinity)
  organicMatter?: number; // % 0-10
  temperature?: number;   // °C soil temp
  source?: "manual" | "sensor" | "lab";
  takenAt?: string;       // ISO timestamp
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
  soilScore?: number; // 0-100 derived from soil analysis
}

const CROP_OPTIMA: Record<string, { water: number; temp: number; growthRate: number; phMin: number; phMax: number }> = {
  Rice:      { water: 90, temp: 28, growthRate: 1.0,  phMin: 5.5, phMax: 7.0 },
  Wheat:     { water: 50, temp: 20, growthRate: 0.85, phMin: 6.0, phMax: 7.5 },
  Corn:      { water: 65, temp: 25, growthRate: 1.05, phMin: 5.8, phMax: 7.2 },
  Sugarcane: { water: 85, temp: 27, growthRate: 1.1,  phMin: 6.0, phMax: 7.5 },
  Cotton:    { water: 55, temp: 28, growthRate: 0.9,  phMin: 5.8, phMax: 8.0 },
  Tomato:    { water: 60, temp: 22, growthRate: 0.95, phMin: 6.0, phMax: 6.8 },
  Soybean:   { water: 45, temp: 24, growthRate: 0.9,  phMin: 6.0, phMax: 7.0 },
};

const SCENARIO_MOD: Record<ExperimentParams["scenario"], { waterMul: number; tempDelta: number; stressDaily: number }> = {
  normal:     { waterMul: 1,   tempDelta: 0,   stressDaily: 0 },
  drought:    { waterMul: 0.4, tempDelta: 5,   stressDaily: 0.012 },
  heatwave:   { waterMul: 0.85, tempDelta: 10, stressDaily: 0.018 },
  heavy_rain: { waterMul: 1.6, tempDelta: -3,  stressDaily: 0.008 },
  frost:      { waterMul: 0.9, tempDelta: -12, stressDaily: 0.025 },
};

// Compute a 0-100 soil quality score from analysis (returns 70 if no data)
export function scoreSoil(soil?: SoilAnalysis, crop?: string): number {
  if (!soil) return 70;
  const opt = CROP_OPTIMA[crop || "Rice"] || CROP_OPTIMA.Rice;
  let score = 100;
  if (soil.ph !== undefined) {
    if (soil.ph < opt.phMin) score -= (opt.phMin - soil.ph) * 12;
    else if (soil.ph > opt.phMax) score -= (soil.ph - opt.phMax) * 12;
  }
  if (soil.nitrogen !== undefined) {
    if (soil.nitrogen < 40) score -= (40 - soil.nitrogen) * 0.4;
    else if (soil.nitrogen > 160) score -= (soil.nitrogen - 160) * 0.2;
  }
  if (soil.phosphorus !== undefined && soil.phosphorus < 20) score -= (20 - soil.phosphorus) * 0.6;
  if (soil.potassium !== undefined && soil.potassium < 80) score -= (80 - soil.potassium) * 0.2;
  if (soil.ec !== undefined && soil.ec > 2) score -= (soil.ec - 2) * 12;
  if (soil.organicMatter !== undefined && soil.organicMatter < 2) score -= (2 - soil.organicMatter) * 8;
  return Math.max(10, Math.min(100, Math.round(score)));
}

export function simulate(land: LandData, params: ExperimentParams, soil?: SoilAnalysis): SimulationOutput {
  const opt = CROP_OPTIMA[params.crop] || CROP_OPTIMA.Rice;
  const sc = SCENARIO_MOD[params.scenario];
  const soilScore = scoreSoil(soil, params.crop);
  const soilMul = 0.7 + (soilScore / 100) * 0.5; // 0.7 - 1.2

  let health = land.healthScore;
  let biomass = 5;
  let waterStress = 0;
  let totalWater = 0;

  const curve: SimulationOutput["growthCurve"] = [];
  const days = Math.max(7, Math.min(180, params.daysAhead));

  const densityFactor = params.plantingDensity > 80 ? 1 - (params.plantingDensity - 80) * 0.01 : 1;
  const fertFactor = 0.6 + (params.fertilizerLevel / 100) * 0.55;
  const overFertPenalty = params.fertilizerLevel > 90 ? 0.92 : 1;

  // Sensor moisture reduces effective irrigation need
  const sensorMoisture = soil?.moisture ?? 50;
  const moistureBuffer = (sensorMoisture - 50) / 100; // -0.5 .. +0.5

  for (let d = 1; d <= days; d++) {
    const waterDelivered = opt.water * (params.irrigationLevel / 100) * sc.waterMul + moistureBuffer * 10;
    totalWater += Math.max(0, waterDelivered) * 0.5;

    const waterRatio = Math.max(0, waterDelivered) / opt.water;
    const dailyStress = Math.abs(1 - waterRatio) * 0.4 + sc.stressDaily;
    waterStress = Math.min(1, waterStress * 0.85 + dailyStress);

    const growth = opt.growthRate * fertFactor * densityFactor * overFertPenalty * soilMul * (1 - waterStress) * 0.6;
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
  if (soil?.ph !== undefined && (soil.ph < opt.phMin - 0.3 || soil.ph > opt.phMax + 0.3))
    risks.push(`Soil pH ${soil.ph} is outside ideal range (${opt.phMin}-${opt.phMax}) for ${params.crop}`);
  if (soil?.ec !== undefined && soil.ec > 2.5) risks.push(`High salinity (EC ${soil.ec} dS/m) — leach with fresh water`);
  if (soil?.nitrogen !== undefined && soil.nitrogen < 30) risks.push("Nitrogen deficiency — apply urea or compost");
  if (soil?.phosphorus !== undefined && soil.phosphorus < 15) risks.push("Low phosphorus — apply DAP or rock phosphate");
  if (soil?.potassium !== undefined && soil.potassium < 60) risks.push("Low potassium — apply MOP");
  if (risks.length === 0) risks.push("No major risks detected");

  return {
    growthCurve: curve,
    finalHealth: +health.toFixed(1),
    finalBiomass: +biomass.toFixed(2),
    totalWaterLiters: +totalWater.toFixed(0),
    yieldChangePct: +yieldChange.toFixed(1),
    risks,
    soilScore,
  };
}
