export type Language = "en" | "hi" | "kn";

export interface Translations {
  // Common
  appName: string;
  tagline: string;
  adminPortal: string;
  farmerPortal: string;
  choosePortal: string;
  back: string;
  language: string;
  runPipeline: string;
  autoMode: string;
  runs: string;
  cropType: string;
  soilType: string;

  // Crop types
  rice: string;
  wheat: string;
  corn: string;
  sugarcane: string;
  cotton: string;
  tomato: string;
  soybean: string;

  // Soil types
  clay: string;
  sandy: string;
  loamy: string;
  silt: string;
  peat: string;

  // Sensor labels
  soilMoisture: string;
  temperature: string;
  humidity: string;
  rainfall: string;
  sunlight: string;
  windSpeed: string;
  liveSensorData: string;

  // Farmer portal
  welcome: string;
  fieldStatus: string;
  irrigationStatus: string;
  irrigationOn: string;
  irrigationOff: string;
  waterNeeded: string;
  duration: string;
  liters: string;
  minutes: string;
  recommendation: string;
  weatherToday: string;
  yourCrop: string;
  yourSoil: string;
  tapToRefresh: string;
  waterForecast: string;
  nextDays: string;
  soilCondition: string;
  dry: string;
  optimal: string;
  wet: string;
  saturated: string;
  confidence: string;
  tipsTitle: string;
  tip1: string;
  tip2: string;
  tip3: string;
  tip4: string;
  selectCrop: string;
  selectSoil: string;
  settings: string;
  saveSettings: string;
  settingsSaved: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  today: string;
  adminDashDesc: string;
  farmerPortalDesc: string;
  teamCredit: string;
  pipelineDesc: string;

  // ML stages
  stage1Title: string;
  stage1Desc: string;
  stage2Title: string;
  stage2Desc: string;
  stage3Title: string;
  stage3Desc: string;
  featureImportance: string;
  treeVotes: string;
  decisionPath: string;
  rSquared: string;
  slope: string;
  avgForecast: string;
  trend: string;
  increasing: string;
  decreasing: string;
  stable: string;
}

const en: Translations = {
  appName: "Smart Irrigation 4.0",
  tagline: "AI-Powered ML Pipeline",
  adminPortal: "Admin Dashboard",
  farmerPortal: "Farmer Portal",
  choosePortal: "Choose your portal",
  back: "Back",
  language: "Language",
  runPipeline: "Run Pipeline",
  autoMode: "Auto",
  runs: "Runs",
  cropType: "Crop Type",
  soilType: "Soil Type",
  rice: "Rice", wheat: "Wheat", corn: "Corn", sugarcane: "Sugarcane", cotton: "Cotton", tomato: "Tomato", soybean: "Soybean",
  clay: "Clay", sandy: "Sandy", loamy: "Loamy", silt: "Silt", peat: "Peat",
  soilMoisture: "Soil Moisture", temperature: "Temperature", humidity: "Humidity",
  rainfall: "Rainfall", sunlight: "Sunlight", windSpeed: "Wind Speed", liveSensorData: "Live Sensor Data",
  welcome: "Welcome, Farmer!",
  fieldStatus: "Field Status",
  irrigationStatus: "Irrigation Status",
  irrigationOn: "Irrigation ON",
  irrigationOff: "Irrigation OFF",
  waterNeeded: "Water Needed",
  duration: "Duration",
  liters: "Liters",
  minutes: "Minutes",
  recommendation: "Recommendation",
  weatherToday: "Weather Today",
  yourCrop: "Your Crop",
  yourSoil: "Your Soil",
  tapToRefresh: "Tap to check again",
  waterForecast: "Water Forecast",
  nextDays: "Next 7 Days",
  soilCondition: "Soil Condition",
  dry: "Dry", optimal: "Optimal", wet: "Wet", saturated: "Saturated",
  confidence: "Confidence",
  tipsTitle: "Farming Tips",
  tip1: "Water early morning or late evening for best absorption",
  tip2: "Check soil moisture before manual watering",
  tip3: "Mulching helps retain soil moisture",
  tip4: "Rotate crops seasonally for better soil health",
  selectCrop: "Select your crop",
  selectSoil: "Select your soil type",
  settings: "Settings",
  saveSettings: "Save Settings",
  settingsSaved: "Settings saved!",
  goodMorning: "Good Morning",
  goodAfternoon: "Good Afternoon",
  goodEvening: "Good Evening",
  today: "Today",
  adminDashDesc: "Full ML pipeline visualization, sensor data, and analytics",
  farmerPortalDesc: "Simple irrigation status, tips, and recommendations",
  teamCredit: "Team 65 | Dayananda Sagar University",
  pipelineDesc: "Random Forest → Decision Tree → Linear Regression",
  stage1Title: "Stage 1: Random Forest",
  stage1Desc: "100 Decision Trees → Majority Vote Classification",
  stage2Title: "Stage 2: Decision Tree",
  stage2Desc: "Automated Irrigation Decision Engine",
  stage3Title: "Stage 3: Linear Regression",
  stage3Desc: "7-Day Water Usage Forecast",
  featureImportance: "Feature Importance",
  treeVotes: "Tree Votes Distribution",
  decisionPath: "Decision Path",
  rSquared: "R² Score", slope: "Slope", avgForecast: "Avg Forecast",
  trend: "Trend", increasing: "Increasing", decreasing: "Decreasing", stable: "Stable",
};

const hi: Translations = {
  appName: "स्मार्ट सिंचाई 4.0",
  tagline: "AI-संचालित ML पाइपलाइन",
  adminPortal: "एडमिन डैशबोर्ड",
  farmerPortal: "किसान पोर्टल",
  choosePortal: "अपना पोर्टल चुनें",
  back: "वापस",
  language: "भाषा",
  runPipeline: "पाइपलाइन चलाएं",
  autoMode: "ऑटो",
  runs: "रन",
  cropType: "फसल प्रकार",
  soilType: "मिट्टी प्रकार",
  rice: "चावल", wheat: "गेहूं", corn: "मक्का", sugarcane: "गन्ना", cotton: "कपास", tomato: "टमाटर", soybean: "सोयाबीन",
  clay: "चिकनी मिट्टी", sandy: "रेतीली", loamy: "दोमट", silt: "गाद", peat: "पीट",
  soilMoisture: "मिट्टी की नमी", temperature: "तापमान", humidity: "आर्द्रता",
  rainfall: "वर्षा", sunlight: "धूप", windSpeed: "हवा की गति", liveSensorData: "लाइव सेंसर डेटा",
  welcome: "स्वागत है, किसान!",
  fieldStatus: "खेत की स्थिति",
  irrigationStatus: "सिंचाई की स्थिति",
  irrigationOn: "सिंचाई चालू",
  irrigationOff: "सिंचाई बंद",
  waterNeeded: "पानी की जरूरत",
  duration: "अवधि",
  liters: "लीटर",
  minutes: "मिनट",
  recommendation: "सिफारिश",
  weatherToday: "आज का मौसम",
  yourCrop: "आपकी फसल",
  yourSoil: "आपकी मिट्टी",
  tapToRefresh: "दोबारा जांचने के लिए टैप करें",
  waterForecast: "पानी का पूर्वानुमान",
  nextDays: "अगले 7 दिन",
  soilCondition: "मिट्टी की स्थिति",
  dry: "सूखी", optimal: "उचित", wet: "गीली", saturated: "संतृप्त",
  confidence: "विश्वसनीयता",
  tipsTitle: "खेती के टिप्स",
  tip1: "सुबह जल्दी या शाम को पानी दें",
  tip2: "मैन्युअल पानी देने से पहले नमी जांचें",
  tip3: "मल्चिंग से नमी बनी रहती है",
  tip4: "मौसमी फसल चक्र अपनाएं",
  selectCrop: "अपनी फसल चुनें",
  selectSoil: "अपनी मिट्टी चुनें",
  settings: "सेटिंग्स",
  saveSettings: "सेटिंग्स सहेजें",
  settingsSaved: "सेटिंग्स सहेज ली गईं!",
  goodMorning: "शुभ प्रभात",
  goodAfternoon: "शुभ दोपहर",
  goodEvening: "शुभ संध्या",
  today: "आज",
  adminDashDesc: "पूर्ण ML पाइपलाइन, सेंसर डेटा और एनालिटिक्स",
  farmerPortalDesc: "सरल सिंचाई स्थिति, टिप्स और सिफारिशें",
  teamCredit: "टीम 65 | दयानंद सागर विश्वविद्यालय",
  pipelineDesc: "Random Forest → Decision Tree → Linear Regression",
  stage1Title: "चरण 1: Random Forest",
  stage1Desc: "100 निर्णय वृक्ष → बहुमत मतदान वर्गीकरण",
  stage2Title: "चरण 2: Decision Tree",
  stage2Desc: "स्वचालित सिंचाई निर्णय इंजन",
  stage3Title: "चरण 3: Linear Regression",
  stage3Desc: "7-दिन पानी उपयोग पूर्वानुमान",
  featureImportance: "फीचर महत्व",
  treeVotes: "वृक्ष मतदान वितरण",
  decisionPath: "निर्णय पथ",
  rSquared: "R² स्कोर", slope: "ढलान", avgForecast: "औसत पूर्वानुमान",
  trend: "रुझान", increasing: "बढ़ रहा है", decreasing: "घट रहा है", stable: "स्थिर",
};

const kn: Translations = {
  appName: "ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ 4.0",
  tagline: "AI-ಚಾಲಿತ ML ಪೈಪ್‌ಲೈನ್",
  adminPortal: "ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  farmerPortal: "ರೈತ ಪೋರ್ಟಲ್",
  choosePortal: "ನಿಮ್ಮ ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ",
  back: "ಹಿಂದೆ",
  language: "ಭಾಷೆ",
  runPipeline: "ಪೈಪ್‌ಲೈನ್ ರನ್ ಮಾಡಿ",
  autoMode: "ಆಟೋ",
  runs: "ರನ್‌ಗಳು",
  cropType: "ಬೆಳೆ ಪ್ರಕಾರ",
  soilType: "ಮಣ್ಣಿನ ಪ್ರಕಾರ",
  rice: "ಅಕ್ಕಿ", wheat: "ಗೋಧಿ", corn: "ಜೋಳ", sugarcane: "ಕಬ್ಬು", cotton: "ಹತ್ತಿ", tomato: "ಟೊಮೆಟೊ", soybean: "ಸೋಯಾಬೀನ್",
  clay: "ಜೇಡಿಮಣ್ಣು", sandy: "ಮರಳು", loamy: "ಮೆದು", silt: "ಹೂಳು", peat: "ಪೀಟ್",
  soilMoisture: "ಮಣ್ಣಿನ ತೇವಾಂಶ", temperature: "ತಾಪಮಾನ", humidity: "ಆರ್ದ್ರತೆ",
  rainfall: "ಮಳೆ", sunlight: "ಬಿಸಿಲು", windSpeed: "ಗಾಳಿ ವೇಗ", liveSensorData: "ಲೈವ್ ಸೆನ್ಸರ್ ಡೇಟಾ",
  welcome: "ಸ್ವಾಗತ, ರೈತರೇ!",
  fieldStatus: "ಹೊಲದ ಸ್ಥಿತಿ",
  irrigationStatus: "ನೀರಾವರಿ ಸ್ಥಿತಿ",
  irrigationOn: "ನೀರಾವರಿ ಚಾಲು",
  irrigationOff: "ನೀರಾವರಿ ಬಂದ್",
  waterNeeded: "ಬೇಕಾದ ನೀರು",
  duration: "ಅವಧಿ",
  liters: "ಲೀಟರ್",
  minutes: "ನಿಮಿಷ",
  recommendation: "ಶಿಫಾರಸು",
  weatherToday: "ಇಂದಿನ ಹವಾಮಾನ",
  yourCrop: "ನಿಮ್ಮ ಬೆಳೆ",
  yourSoil: "ನಿಮ್ಮ ಮಣ್ಣು",
  tapToRefresh: "ಮತ್ತೆ ಪರಿಶೀಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
  waterForecast: "ನೀರಿನ ಮುನ್ಸೂಚನೆ",
  nextDays: "ಮುಂದಿನ 7 ದಿನ",
  soilCondition: "ಮಣ್ಣಿನ ಸ್ಥಿತಿ",
  dry: "ಒಣ", optimal: "ಸೂಕ್ತ", wet: "ತೇವ", saturated: "ಸ್ಯಾಚುರೇಟೆಡ್",
  confidence: "ವಿಶ್ವಾಸಾರ್ಹತೆ",
  tipsTitle: "ಕೃಷಿ ಸಲಹೆಗಳು",
  tip1: "ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀರು ಹಾಕಿ",
  tip2: "ನೀರು ಹಾಕುವ ಮುನ್ನ ತೇವಾಂಶ ಪರಿಶೀಲಿಸಿ",
  tip3: "ಮಲ್ಚಿಂಗ್ ತೇವಾಂಶ ಉಳಿಸುತ್ತದೆ",
  tip4: "ಋತುಮಾನಕ್ಕೆ ತಕ್ಕ ಬೆಳೆ ಬದಲಾಯಿಸಿ",
  selectCrop: "ನಿಮ್ಮ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ",
  selectSoil: "ನಿಮ್ಮ ಮಣ್ಣು ಆಯ್ಕೆಮಾಡಿ",
  settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
  saveSettings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
  settingsSaved: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಉಳಿಸಲಾಗಿದೆ!",
  goodMorning: "ಶುಭೋದಯ",
  goodAfternoon: "ಶುಭ ಮಧ್ಯಾಹ್ನ",
  goodEvening: "ಶುಭ ಸಂಜೆ",
  today: "ಇಂದು",
  adminDashDesc: "ಸಂಪೂರ್ಣ ML ಪೈಪ್‌ಲೈನ್, ಸೆನ್ಸರ್ ಡೇಟಾ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",
  farmerPortalDesc: "ಸರಳ ನೀರಾವರಿ ಸ್ಥಿತಿ, ಸಲಹೆಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳು",
  teamCredit: "ತಂಡ 65 | ದಯಾನಂದ ಸಾಗರ ವಿಶ್ವವಿದ್ಯಾಲಯ",
  pipelineDesc: "Random Forest → Decision Tree → Linear Regression",
  stage1Title: "ಹಂತ 1: Random Forest",
  stage1Desc: "100 ನಿರ್ಧಾರ ವೃಕ್ಷಗಳು → ಬಹುಮತ ಮತದಾನ",
  stage2Title: "ಹಂತ 2: Decision Tree",
  stage2Desc: "ಸ್ವಯಂಚಾಲಿತ ನೀರಾವರಿ ನಿರ್ಧಾರ",
  stage3Title: "ಹಂತ 3: Linear Regression",
  stage3Desc: "7-ದಿನ ನೀರಿನ ಬಳಕೆ ಮುನ್ಸೂಚನೆ",
  featureImportance: "ವೈಶಿಷ್ಟ್ಯ ಮಹತ್ವ",
  treeVotes: "ವೃಕ್ಷ ಮತದಾನ ವಿತರಣೆ",
  decisionPath: "ನಿರ್ಧಾರ ಮಾರ್ಗ",
  rSquared: "R² ಸ್ಕೋರ್", slope: "ಇಳಿಜಾರು", avgForecast: "ಸರಾಸರಿ ಮುನ್ಸೂಚನೆ",
  trend: "ಪ್ರವೃತ್ತಿ", increasing: "ಹೆಚ್ಚುತ್ತಿದೆ", decreasing: "ಕಡಿಮೆಯಾಗುತ್ತಿದೆ", stable: "ಸ್ಥಿರ",
};

export const translations: Record<Language, Translations> = { en, hi, kn };

export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
};

export function getGreeting(t: Translations): string {
  const hour = new Date().getHours();
  if (hour < 12) return t.goodMorning;
  if (hour < 17) return t.goodAfternoon;
  return t.goodEvening;
}

export function translateCrop(crop: string, t: Translations): string {
  const map: Record<string, keyof Translations> = {
    Rice: "rice", Wheat: "wheat", Corn: "corn", Sugarcane: "sugarcane",
    Cotton: "cotton", Tomato: "tomato", Soybean: "soybean",
  };
  return (t[map[crop] || "rice"] as string) || crop;
}

export function translateSoil(soil: string, t: Translations): string {
  const map: Record<string, keyof Translations> = {
    Clay: "clay", Sandy: "sandy", Loamy: "loamy", Silt: "silt", Peat: "peat",
  };
  return (t[map[soil] || "loamy"] as string) || soil;
}

export function translateClassification(cls: string, t: Translations): string {
  const map: Record<string, keyof Translations> = {
    dry: "dry", optimal: "optimal", wet: "wet", saturated: "saturated",
  };
  return (t[map[cls] || "optimal"] as string) || cls;
}
