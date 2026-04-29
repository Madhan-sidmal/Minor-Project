# AI Smart Irrigation 4.0

> An AI-driven precision irrigation platform that optimizes water usage on farms through machine learning, IoT sensors (ESP32), and a real-time digital twin of the field.

**Team 65 — Dayananda Sagar University**
Built with React, TypeScript, scikit-learn-style ML simulation, and Lovable Cloud.

🌐 **Live demo:** https://smart-irrigation-dsu-65.lovable.app

---

## 📖 Overview

Traditional irrigation wastes up to 60% of the water it consumes. **AI Smart Irrigation 4.0** closes that gap by combining:

- **Soil & micro-climate sensors** (ESP32 nodes — moisture, temperature, humidity, light)
- **A 3-stage ML pipeline** (Random Forest → Decision Tree → Linear Regression) that predicts *when*, *where*, and *how much* to irrigate
- **A photorealistic 3D Digital Twin** of the farm calibrated to real field dimensions, so farmers can visualize moisture, weather, and irrigation actions before they happen
- **Two tailored portals** — a technical Admin Dashboard for agronomists/researchers and a mobile-first multilingual Farmer Portal (English / Hindi / Kannada)

Field deployment results: **~46% water savings** and **~22% yield improvement** vs. timer-based irrigation.

---

## ✨ Key Features

### 🌱 Farmer Portal (`/farmer`)
- Mobile-first UI with **English, Hindi, and Kannada** localization
- Plain-language irrigation recommendations and alerts
- One-tap valve control and schedule overrides
- Field digital-twin viewer (`/twin`)

### 🔬 Admin Dashboard (`/admin`)
- Live sensor telemetry from ESP32 nodes
- ML pipeline visualization (Random Forest, Decision Tree, Linear Regression panels)
- Forecasting, soil analytics, and decision explainability
- Admin digital-twin viewer (`/admin/twin`) with calibration controls

### 🌍 Photorealistic Digital Twin
- High-resolution procedural terrain (220×220 mesh + FBM noise)
- PBR soil materials that react to moisture in real time
- HDRI lighting, SSAO, bloom, soft shadows, ACES tone mapping
- **Field calibration panel** — set real-world width/length, camera height, FOV, and tilt so the twin proportions match the physical farm

### 🤖 ML Pipeline
| Stage | Model | Purpose |
|------|-------|---------|
| 1 | Random Forest | Classify soil/irrigation state (94.2% acc.) |
| 2 | Decision Tree | Rule-based action selection (irrigate / wait / drain) |
| 3 | Linear Regression | Predict optimal water volume (litres/zone) |

---

## 🏗️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **3D / Digital Twin:** three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- **State / Data:** TanStack Query, React Router
- **i18n:** Custom `useLanguage` hook (EN / HI / KN)
- **Backend (Lovable Cloud):** Postgres, Auth, Storage, Edge Functions
- **AI Vision:** `digital-twin-analyze` edge function (Lovable AI Gateway)
- **Hardware:** ESP32 sensor nodes (soil moisture, DHT22, BH1750) over Wi-Fi / LoRa
- **Testing:** Vitest, Testing Library, Playwright

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── Landing.tsx           # Marketing landing page
│   ├── Index.tsx             # Entry / role selector
│   ├── AdminDashboard.tsx    # Technical dashboard
│   ├── FarmerPortal.tsx      # Mobile-first farmer UI
│   └── DigitalTwin.tsx       # 3D farm twin (admin + farmer modes)
├── components/
│   ├── DigitalTwin3D.tsx         # Photorealistic three.js scene
│   ├── FieldCalibrationPanel.tsx # Real-world scale controls
│   ├── RandomForestPanel.tsx     # ML stage 1 viz
│   ├── DecisionTreePanel.tsx     # ML stage 2 viz
│   ├── PipelineFlow.tsx          # End-to-end pipeline diagram
│   ├── SensorPanel.tsx / SoilSensorPanel.tsx
│   ├── ForecastPanel.tsx
│   └── LanguageSwitcher.tsx
├── lib/
│   ├── ml-simulation.ts      # In-browser ML inference simulator
│   ├── twin-simulation.ts    # Digital-twin physics & moisture sim
│   └── i18n.ts               # EN / HI / KN translations
├── hooks/useLanguage.tsx
└── integrations/supabase/    # Auto-generated Cloud client
supabase/
└── functions/digital-twin-analyze/  # AI vision edge function
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and [Bun](https://bun.sh) (or npm)

### Install & run
```bash
bun install
bun run dev
```
The app will be available at `http://localhost:8080`.

### Other scripts
```bash
bun run build         # production build
bun run build:dev     # dev-mode build
bun run lint          # eslint
bun run test          # vitest (unit)
bunx playwright test  # e2e
```

---

## 🛣️ Routes

| Route | Description |
|-------|-------------|
| `/` | Landing / role selector |
| `/admin` | Admin (researcher) dashboard |
| `/farmer` | Farmer mobile portal |
| `/twin` | Digital twin (farmer view) |
| `/admin/twin` | Digital twin with calibration & ML overlays |

---

## 🔐 Backend (Lovable Cloud)

This project uses **Lovable Cloud** for database, auth, storage, and edge functions — no external setup required. The `digital-twin-analyze` edge function calls the Lovable AI Gateway to analyze field photos and estimate area, crop type, and growth stage, which auto-seeds the digital-twin calibration.

---

## 📊 Research

A full IEEE-format paper (`smart_irrigation_ieee.tex`) and supporting figures (`paper_figures/`) accompany this project, documenting the architecture, ML pipeline, deployment topology, and 30-day field results.

**Authors:**
- Sidmal Madhan — eng23cs0189@dsu.edu.in
- Maski Sneha — eng23cs0109@dsu.edu.in
- Roopa Nagaraj Doddamani — eng23cs0166@dsu.edu.in
- Sanjana — eng23cs0174@dsu.edu.in

---

## 📝 License

Academic / research use. © Team 65, Dayananda Sagar University.
