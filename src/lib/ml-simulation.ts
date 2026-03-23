// Simulated ML Pipeline for Smart Irrigation System

export interface SensorData {
  soilMoisture: number;    // 0-100%
  temperature: number;     // °C
  humidity: number;        // 0-100%
  rainfall: number;        // mm
  sunlight: number;        // hours
  windSpeed: number;       // km/h
  cropType: string;
  soilType: string;
}

export interface RandomForestResult {
  classification: "dry" | "optimal" | "wet" | "saturated";
  confidence: number;
  treeVotes: { classification: string; count: number }[];
  featureImportance: { feature: string; importance: number }[];
}

export interface DecisionTreeResult {
  shouldIrrigate: boolean;
  waterAmount: number;     // liters
  duration: number;        // minutes
  reason: string;
  path: string[];
}

export interface LinearRegressionResult {
  forecast: { day: number; predictedUsage: number; confidence: number }[];
  slope: number;
  intercept: number;
  rSquared: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface PipelineResult {
  sensorData: SensorData;
  randomForest: RandomForestResult;
  decisionTree: DecisionTreeResult;
  linearRegression: LinearRegressionResult;
  timestamp: Date;
}

const CROP_TYPES = ["Rice", "Wheat", "Corn", "Sugarcane", "Cotton", "Tomato", "Soybean"];
const SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peat"];

const CROP_WATER_NEEDS: Record<string, number> = {
  Rice: 85, Wheat: 45, Corn: 60, Sugarcane: 80, Cotton: 50, Tomato: 55, Soybean: 40,
};

export function generateSensorData(cropType?: string, soilType?: string): SensorData {
  return {
    soilMoisture: Math.random() * 100,
    temperature: 15 + Math.random() * 30,
    humidity: 20 + Math.random() * 70,
    rainfall: Math.random() > 0.6 ? Math.random() * 25 : 0,
    sunlight: 2 + Math.random() * 12,
    windSpeed: Math.random() * 40,
    cropType: cropType || CROP_TYPES[Math.floor(Math.random() * CROP_TYPES.length)],
    soilType: soilType || SOIL_TYPES[Math.floor(Math.random() * SOIL_TYPES.length)],
  };
}

export function runRandomForest(data: SensorData): RandomForestResult {
  const { soilMoisture, temperature, humidity, rainfall } = data;

  // Simulate 100 decision trees voting
  let dryVotes = 0, optimalVotes = 0, wetVotes = 0, saturatedVotes = 0;
  const totalTrees = 100;

  for (let i = 0; i < totalTrees; i++) {
    const noise = (Math.random() - 0.5) * 15;
    const effectiveMoisture = soilMoisture + noise;

    if (effectiveMoisture < 25) dryVotes++;
    else if (effectiveMoisture < 55) optimalVotes++;
    else if (effectiveMoisture < 80) wetVotes++;
    else saturatedVotes++;
  }

  const votes = [
    { classification: "dry", count: dryVotes },
    { classification: "optimal", count: optimalVotes },
    { classification: "wet", count: wetVotes },
    { classification: "saturated", count: saturatedVotes },
  ];

  const winner = votes.reduce((a, b) => (a.count > b.count ? a : b));

  const featureImportance = [
    { feature: "Soil Moisture", importance: 0.35 + Math.random() * 0.1 },
    { feature: "Temperature", importance: 0.15 + Math.random() * 0.08 },
    { feature: "Humidity", importance: 0.12 + Math.random() * 0.06 },
    { feature: "Rainfall", importance: 0.18 + Math.random() * 0.08 },
    { feature: "Crop Type", importance: 0.1 + Math.random() * 0.05 },
    { feature: "Soil Type", importance: 0.05 + Math.random() * 0.04 },
  ].sort((a, b) => b.importance - a.importance);

  // Normalize
  const total = featureImportance.reduce((s, f) => s + f.importance, 0);
  featureImportance.forEach((f) => (f.importance = +(f.importance / total).toFixed(3)));

  return {
    classification: winner.classification as RandomForestResult["classification"],
    confidence: +(winner.count / totalTrees).toFixed(2),
    treeVotes: votes,
    featureImportance,
  };
}

export function runDecisionTree(data: SensorData, rfResult: RandomForestResult): DecisionTreeResult {
  const path: string[] = [];
  const cropNeed = CROP_WATER_NEEDS[data.cropType] || 50;

  path.push(`RF Classification: ${rfResult.classification} (${(rfResult.confidence * 100).toFixed(0)}%)`);

  if (rfResult.classification === "saturated") {
    path.push("Soil saturated → No irrigation needed");
    return { shouldIrrigate: false, waterAmount: 0, duration: 0, reason: "Soil is saturated. Risk of waterlogging.", path };
  }

  if (rfResult.classification === "wet" && data.rainfall > 5) {
    path.push("Soil wet + Recent rainfall → Skip irrigation");
    return { shouldIrrigate: false, waterAmount: 0, duration: 0, reason: "Sufficient moisture from recent rainfall.", path };
  }

  if (rfResult.classification === "dry") {
    const amount = cropNeed * (1 + (data.temperature - 25) * 0.02);
    const duration = amount / 2;
    path.push("Soil dry → Irrigation required");
    path.push(`Crop need (${data.cropType}): ${cropNeed}L base`);
    path.push(`Temp adjustment: ${data.temperature.toFixed(1)}°C`);
    return {
      shouldIrrigate: true,
      waterAmount: +amount.toFixed(1),
      duration: +duration.toFixed(0),
      reason: `Dry soil detected. ${data.cropType} requires immediate irrigation.`,
      path,
    };
  }

  // Optimal or wet without rain
  if (data.temperature > 35) {
    const amount = cropNeed * 0.5;
    path.push("High temperature → Light irrigation");
    return { shouldIrrigate: true, waterAmount: +amount.toFixed(1), duration: +(amount / 2).toFixed(0), reason: "Preventive irrigation due to high temperature.", path };
  }

  path.push("Conditions optimal → No irrigation needed");
  return { shouldIrrigate: false, waterAmount: 0, duration: 0, reason: "Soil moisture is at optimal levels.", path };
}

export function runLinearRegression(historicalUsage: number[]): LinearRegressionResult {
  const n = historicalUsage.length;
  const xs = historicalUsage.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = historicalUsage.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (historicalUsage[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  // R²
  const ssRes = historicalUsage.reduce((s, y, i) => s + (y - (slope * i + intercept)) ** 2, 0);
  const ssTot = historicalUsage.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const rSquared = ssTot !== 0 ? +(1 - ssRes / ssTot).toFixed(3) : 0;

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const day = n + i;
    const predicted = slope * day + intercept + (Math.random() - 0.5) * 10;
    return {
      day: i + 1,
      predictedUsage: +Math.max(0, predicted).toFixed(1),
      confidence: +(0.95 - i * 0.03).toFixed(2),
    };
  });

  const trend = slope > 1 ? "increasing" : slope < -1 ? "decreasing" : "stable";

  return { forecast, slope: +slope.toFixed(3), intercept: +intercept.toFixed(3), rSquared, trend };
}

export function generateHistoricalUsage(days: number = 30): number[] {
  const base = 40 + Math.random() * 30;
  return Array.from({ length: days }, (_, i) => {
    const seasonal = Math.sin((i / 30) * Math.PI * 2) * 15;
    const trend = i * 0.3;
    const noise = (Math.random() - 0.5) * 20;
    return +Math.max(0, base + seasonal + trend + noise).toFixed(1);
  });
}

export function runFullPipeline(cropType?: string, soilType?: string): PipelineResult {
  const sensorData = generateSensorData(cropType, soilType);
  const randomForest = runRandomForest(sensorData);
  const decisionTree = runDecisionTree(sensorData, randomForest);
  const historicalUsage = generateHistoricalUsage();
  const linearRegression = runLinearRegression(historicalUsage);

  return { sensorData, randomForest, decisionTree, linearRegression, timestamp: new Date() };
}
