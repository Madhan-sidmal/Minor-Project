import { useMemo, useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Sky,
  Cloud,
  Clouds,
  ContactShadows,
  Environment,
  Instances,
  Instance,
  SoftShadows,
} from "@react-three/drei";
import { EffectComposer, Bloom, SSAO, Vignette, BrightnessContrast, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Maximize2,
  Minimize2,
  Camera as CameraIcon,
  RotateCcw,
  Pause,
  Play,
  Eye,
  EyeOff,
  Sun,
  Layers,
  Mountain,
  Grid3x3,
} from "lucide-react";

export interface FieldScale {
  widthM: number;        // X dimension of the real field (m)
  lengthM: number;       // Z dimension of the real field (m)
  cameraHeightM: number; // capturing camera height above ground (m)
  cameraFovDeg: number;  // capturing camera horizontal FOV (deg)
  tiltDeg: number;       // tilt below horizontal (deg, 0=level, 90=nadir)
}

interface Props {
  heightmap: number[]; // 256 (16x16) — input low-res, we upsample
  vegetationDensity: number;
  soilColor: string;
  health: number; // 0-100, drives crop color
  scenario: "normal" | "drought" | "heatwave" | "heavy_rain" | "frost";
  irrigationLevel: number; // 0-100
  soilMoisture?: number; // 0-100
  scale?: FieldScale;     // real-world calibration
}

interface ViewerSettings {
  exaggeration: number;
  showCrops: boolean;
  showRain: boolean;
  showSprinklers: boolean;
  showGrid: boolean;
  wireframe: boolean;
  heatmap: boolean;
  autoRotate: boolean;
  showClouds: boolean;
  showSky: boolean;
  sunAngle: number;
  sunHeight: number;
}

// Max scene span (world units). Real-world meters are scaled to fit inside this.
const SCENE_SPAN = 14;
// High-res displacement geometry (was 16 — that's why it looked cartoony / blocky)
const SUB = 220;
// Source heightmap is 16x16
const SRC = 16;

// Convert real field dimensions (m) into scene-unit X/Z extents that fit inside SCENE_SPAN
function sceneExtent(widthM: number, lengthM: number) {
  const longest = Math.max(widthM, lengthM, 1);
  const unitPerM = SCENE_SPAN / longest;
  return {
    sizeX: widthM * unitPerM,
    sizeZ: lengthM * unitPerM,
    unitPerM,
  };
}

/* ----------------- procedural noise (deterministic) ----------------- */
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 5) {
  let amp = 0.5;
  let freq = 1.0;
  let sum = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x * freq, y * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

/* ----------------- bilinear sample of source heightmap ----------------- */
function sampleHeight(hm: number[], u: number, v: number) {
  const x = u * (SRC - 1);
  const y = v * (SRC - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(SRC - 1, x0 + 1);
  const y1 = Math.min(SRC - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const a = hm[y0 * SRC + x0] ?? 0;
  const b = hm[y0 * SRC + x1] ?? 0;
  const c = hm[y1 * SRC + x0] ?? 0;
  const d = hm[y1 * SRC + x1] ?? 0;
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

/* ----------------- canvas-based soil albedo + normal textures ----------------- */
function makeSoilTextures(baseHex: string, wet: number) {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // base
  const base = new THREE.Color(baseHex);
  base.lerp(new THREE.Color("#1f1812"), Math.min(0.55, wet * 0.55));
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  // grain speckles
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 38;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n * 0.9));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n * 0.8));
  }
  ctx.putImageData(img, 0, 0);
  // tilled rows (subtle stripes giving plowed-field look)
  ctx.globalAlpha = 0.18;
  for (let y = 0; y < size; y += 14) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, y, size, 1);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, y + 2, size, 1);
  }
  ctx.globalAlpha = 1;
  // dark patches (clods / wet spots)
  for (let i = 0; i < 380; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 8 + Math.random() * 32;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${0.18 + Math.random() * 0.18})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const albedo = new THREE.CanvasTexture(c);
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(6, 6);
  albedo.anisotropy = 8;
  albedo.colorSpace = THREE.SRGBColorSpace;

  // normal map from grayscale of grain
  const nc = document.createElement("canvas");
  nc.width = nc.height = size;
  const nctx = nc.getContext("2d")!;
  const gimg = nctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (Math.sin(x * 0.4) + Math.cos(y * 0.35) + Math.random() * 1.6) * 0.25 + 0.5;
      const idx = (y * size + x) * 4;
      const nx = (Math.random() - 0.5) * 0.6 + 0.5;
      const ny = (Math.random() - 0.5) * 0.6 + 0.5;
      gimg.data[idx] = nx * 255;
      gimg.data[idx + 1] = ny * 255;
      gimg.data[idx + 2] = 255 * v;
      gimg.data[idx + 3] = 255;
    }
  }
  nctx.putImageData(gimg, 0, 0);
  const normal = new THREE.CanvasTexture(nc);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(6, 6);
  normal.anisotropy = 8;

  return { albedo, normal };
}

/* ----------------- crop blade billboard texture ----------------- */
function makeBladeTexture(tipHex: string, baseHex: string) {
  const w = 64;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  // draw a few pointed blades
  for (let i = 0; i < 5; i++) {
    const x = 8 + i * 12 + (Math.random() - 0.5) * 4;
    const sway = (Math.random() - 0.5) * 6;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, tipHex);
    grad.addColorStop(0.6, baseHex);
    grad.addColorStop(1, baseHex);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 2, h);
    ctx.quadraticCurveTo(x + sway, h / 2, x, 0);
    ctx.quadraticCurveTo(x + sway + 1, h / 2, x + 2, h);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ----------------- Terrain ----------------- */
function Terrain({
  heightmap,
  soilColor,
  health,
  vegetationDensity,
  scenario,
  irrigationLevel,
  soilMoisture,
  settings,
}: Props & { settings: ViewerSettings }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wet = (soilMoisture ?? 50) / 100;

  const { albedo, normal } = useMemo(
    () => makeSoilTextures(soilColor || "#8b6f47", wet),
    [soilColor, wet],
  );

  // High-res geometry with bilinear-sampled heightmap + fractal detail
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SUB, SUB);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + SIZE / 2) / SIZE;
      const v = (pos.getY(i) + SIZE / 2) / SIZE;
      const macro = sampleHeight(heightmap, u, v); // 0..~1
      // micro detail: rolling field + tilled rows
      const micro =
        fbm(u * 6, v * 6, 4) * 0.18 +
        Math.sin(v * 60) * 0.012 + // furrow rows
        (vnoise(u * 30, v * 30) - 0.5) * 0.04;
      const z = macro * settings.exaggeration + micro * settings.exaggeration;
      pos.setZ(i, z);
      const t = Math.max(0, Math.min(1, macro));
      colors.push(t, 1 - Math.abs(t - 0.5) * 2, 1 - t);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [heightmap, settings.exaggeration]);

  // crop instances — billboards across high-res surface
  const cropData = useMemo(() => {
    const arr: { x: number; y: number; z: number; rot: number; scale: number }[] = [];
    const count = Math.floor(220 + vegetationDensity * 1400);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const x = (u - 0.5) * SIZE * 0.96;
      const z = (v - 0.5) * SIZE * 0.96;
      const macro = sampleHeight(heightmap, u, v);
      const micro = fbm(u * 6, v * 6, 4) * 0.18 + Math.sin(v * 60) * 0.012;
      const y = (macro + micro) * settings.exaggeration;
      arr.push({
        x,
        y,
        z,
        rot: Math.random() * Math.PI,
        scale: 0.35 + Math.random() * 0.55,
      });
    }
    return arr;
  }, [heightmap, vegetationDensity, settings.exaggeration]);

  const cropTex = useMemo(() => {
    const h = Math.max(0, Math.min(100, health));
    let baseHex: string, tipHex: string;
    if (h < 35) {
      baseHex = "#6b521e";
      tipHex = "#a08344";
    } else if (h < 65) {
      baseHex = "#7a7028";
      tipHex = "#c5b540";
    } else {
      baseHex = "#1f5a2a";
      tipHex = "#69c674";
    }
    return makeBladeTexture(tipHex, baseHex);
  }, [health]);

  useFrame((state) => {
    state.scene.fog = new THREE.Fog(
      scenario === "drought"
        ? "#d9b27a"
        : scenario === "frost"
          ? "#cfe1ec"
          : scenario === "heatwave"
            ? "#e8a87c"
            : scenario === "heavy_rain"
              ? "#5a6470"
              : "#bcd0b8",
      28,
      90,
    );
  });

  return (
    <group>
      {/* Surrounding ground plane so field doesn't look like a floating slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[SIZE * 8, SIZE * 8]} />
        <meshStandardMaterial color="#3d4a32" roughness={0.95} />
      </mesh>

      {/* Hero terrain */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        castShadow
      >
        {settings.heatmap ? (
          <meshStandardMaterial
            vertexColors
            roughness={0.85}
            metalness={0.02}
            wireframe={settings.wireframe}
          />
        ) : (
          <meshStandardMaterial
            map={albedo}
            normalMap={normal}
            normalScale={new THREE.Vector2(1.4, 1.4)}
            roughness={0.92 - wet * 0.45}
            metalness={0.02}
            wireframe={settings.wireframe}
            envMapIntensity={0.55}
          />
        )}
      </mesh>

      {/* Wet sheen */}
      {wet > 0.7 && !settings.wireframe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <planeGeometry args={[SIZE * 0.98, SIZE * 0.98]} />
          <meshPhysicalMaterial
            color="#2c4e63"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.0}
            transmission={0.3}
            clearcoat={0.6}
            clearcoatRoughness={0.1}
          />
        </mesh>
      )}

      {/* Crop billboards — dual cross-plane for volume */}
      {settings.showCrops && (
        <group>
          {cropData.map((p, i) => (
            <group key={i} position={[p.x, p.y, p.z]} rotation={[0, p.rot, 0]} scale={p.scale}>
              <mesh castShadow>
                <planeGeometry args={[0.5, 0.55]} />
                <meshStandardMaterial
                  map={cropTex}
                  transparent
                  alphaTest={0.35}
                  side={THREE.DoubleSide}
                  roughness={0.85}
                />
              </mesh>
              <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
                <planeGeometry args={[0.5, 0.55]} />
                <meshStandardMaterial
                  map={cropTex}
                  transparent
                  alphaTest={0.35}
                  side={THREE.DoubleSide}
                  roughness={0.85}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Rain */}
      {settings.showRain &&
        scenario === "heavy_rain" &&
        Array.from({ length: 220 }).map((_, i) => <RainDrop key={i} />)}

      {/* Frost speckles */}
      {scenario === "frost" &&
        Array.from({ length: 60 }).map((_, i) => <FrostFleck key={i} />)}

      {/* Sprinklers */}
      {settings.showSprinklers && irrigationLevel > 30 && (
        <>
          <Sprinkler position={[-3, 0, -3]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[3, 0, 3]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[-3, 0, 3]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[3, 0, -3]} intensity={irrigationLevel / 100} />
        </>
      )}
    </group>
  );
}

function RainDrop() {
  const ref = useRef<THREE.Mesh>(null);
  const start = useMemo(
    () => ({
      x: (Math.random() - 0.5) * SIZE,
      z: (Math.random() - 0.5) * SIZE,
      y: 8 + Math.random() * 6,
      speed: 0.22 + Math.random() * 0.18,
    }),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y -= start.speed;
    if (ref.current.position.y < 0) ref.current.position.y = start.y;
  });
  return (
    <mesh ref={ref} position={[start.x, start.y, start.z]}>
      <cylinderGeometry args={[0.008, 0.008, 0.32, 4]} />
      <meshBasicMaterial color="#bfe2f0" transparent opacity={0.7} />
    </mesh>
  );
}

function FrostFleck() {
  const pos = useMemo(
    () =>
      [
        (Math.random() - 0.5) * SIZE * 0.95,
        0.025,
        (Math.random() - 0.5) * SIZE * 0.95,
      ] as [number, number, number],
    [],
  );
  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.18 + Math.random() * 0.15, 8]} />
      <meshBasicMaterial color="#e8f2f8" transparent opacity={0.55} />
    </mesh>
  );
}

function Sprinkler({
  position,
  intensity,
}: {
  position: [number, number, number];
  intensity: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 2;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 12]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.08, 12, 10]} />
        <meshStandardMaterial color="#666" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={groupRef} position={[0, 0.95, 0]}>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.85 * intensity, -0.05, Math.sin(a) * 0.85 * intensity]}
            >
              <sphereGeometry args={[0.035, 6, 6]} />
              <meshStandardMaterial
                color="#9ddcff"
                transparent
                opacity={0.85}
                emissive="#3aa0d8"
                emissiveIntensity={0.3}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function SunRig({
  angle,
  height,
  scenario,
}: {
  angle: number;
  height: number;
  scenario: Props["scenario"];
}) {
  const rad = (angle * Math.PI) / 180;
  const r = 18;
  const x = Math.cos(rad) * r;
  const z = Math.sin(rad) * r;
  const y = 5 + height * 20;
  const dim = scenario === "heavy_rain" || scenario === "frost" ? 1.2 : 2.6;
  const sunColor =
    scenario === "heatwave" ? "#ffb070" : scenario === "frost" ? "#dfeaf2" : "#fff2cc";
  return (
    <directionalLight
      position={[x, y, z]}
      intensity={dim}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-14}
      shadow-camera-right={14}
      shadow-camera-top={14}
      shadow-camera-bottom={-14}
      shadow-bias={-0.0003}
      color={sunColor}
    />
  );
}

const SceneCapture = forwardRef<{ snapshot: () => void }, {}>((_, ref) => {
  const { gl, scene, camera } = useThree();
  useImperativeHandle(ref, () => ({
    snapshot: () => {
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `digital-twin-${Date.now()}.png`;
      a.click();
    },
  }));
  return null;
});
SceneCapture.displayName = "SceneCapture";

function ControlsResettable({ resetKey, autoRotate }: { resetKey: number; autoRotate: boolean }) {
  return (
    <OrbitControls
      key={resetKey}
      enablePan
      minDistance={5}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2.05}
      autoRotate={autoRotate}
      autoRotateSpeed={0.4}
      enableDamping
      dampingFactor={0.08}
      target={[0, 0.5, 0]}
    />
  );
}

export const DigitalTwin3D = (props: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<{ snapshot: () => void }>(null);
  const [resetKey, setResetKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const [settings, setSettings] = useState<ViewerSettings>({
    exaggeration: 1.6,
    showCrops: true,
    showRain: true,
    showSprinklers: true,
    showGrid: false,
    wireframe: false,
    heatmap: false,
    autoRotate: false,
    showClouds: true,
    showSky: true,
    sunAngle: 55,
    sunHeight: 0.55,
  });

  const skyParams = useMemo(() => {
    switch (props.scenario) {
      case "drought":
        return { turbidity: 9, rayleigh: 1.5, mieCoefficient: 0.02, mieDirectionalG: 0.85 };
      case "heatwave":
        return { turbidity: 12, rayleigh: 2, mieCoefficient: 0.025, mieDirectionalG: 0.9 };
      case "heavy_rain":
        return { turbidity: 18, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.7 };
      case "frost":
        return { turbidity: 6, rayleigh: 1, mieCoefficient: 0.01, mieDirectionalG: 0.7 };
      default:
        return { turbidity: 4, rayleigh: 1.4, mieCoefficient: 0.005, mieDirectionalG: 0.85 };
    }
  }, [props.scenario]);

  const sunPos = useMemo<[number, number, number]>(() => {
    const rad = (settings.sunAngle * Math.PI) / 180;
    return [Math.cos(rad) * 100, 25 + settings.sunHeight * 80, Math.sin(rad) * 100];
  }, [settings.sunAngle, settings.sunHeight]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
    else await document.exitFullscreen();
  };

  const update = <K extends keyof ViewerSettings>(k: K, v: ViewerSettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${fullscreen ? "h-screen" : "h-[520px]"} rounded-xl overflow-hidden border border-border bg-card shadow-elegant`}
    >
      <Canvas
        shadows
        camera={{ position: [12, 8, 12], fov: 38 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
      >
        <SoftShadows size={28} samples={16} focus={0.6} />

        {settings.showSky ? (
          <Sky
            distance={450000}
            sunPosition={sunPos}
            turbidity={skyParams.turbidity}
            rayleigh={skyParams.rayleigh}
            mieCoefficient={skyParams.mieCoefficient}
            mieDirectionalG={skyParams.mieDirectionalG}
          />
        ) : (
          <color attach="background" args={["#1a1f1a"]} />
        )}

        <Environment
          preset={
            props.scenario === "heavy_rain"
              ? "city"
              : props.scenario === "frost"
                ? "dawn"
                : props.scenario === "heatwave"
                  ? "sunset"
                  : "park"
          }
          background={false}
        />

        <hemisphereLight args={["#cfe7ff", "#3a3220", 0.55]} />
        <SunRig angle={settings.sunAngle} height={settings.sunHeight} scenario={props.scenario} />

        {settings.showClouds && (
          <Clouds material={THREE.MeshBasicMaterial} limit={30}>
            <Cloud
              segments={40}
              bounds={[16, 2.5, 16]}
              volume={8}
              color={props.scenario === "heavy_rain" ? "#4a525c" : "#ffffff"}
              opacity={props.scenario === "heavy_rain" ? 0.95 : 0.6}
              position={[0, 14, 0]}
              speed={0.15}
            />
            <Cloud
              segments={28}
              bounds={[10, 2, 10]}
              volume={5}
              color={props.scenario === "heavy_rain" ? "#3a424c" : "#f4f4f4"}
              opacity={props.scenario === "heavy_rain" ? 0.85 : 0.45}
              position={[8, 16, -6]}
              speed={0.1}
            />
          </Clouds>
        )}

        <Terrain {...props} settings={settings} />

        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.55}
          scale={SIZE * 1.4}
          blur={2.4}
          far={8}
          color="#000000"
        />

        {settings.showGrid && (
          <Grid
            args={[SIZE * 1.5, SIZE * 1.5]}
            cellSize={0.5}
            cellThickness={0.6}
            cellColor="#6b7c6b"
            sectionSize={2}
            sectionThickness={1.2}
            sectionColor="#3fa34d"
            fadeDistance={28}
            position={[0, 0.015, 0]}
            infiniteGrid={false}
          />
        )}

        <ControlsResettable resetKey={resetKey} autoRotate={settings.autoRotate} />
        <SceneCapture ref={captureRef} />

        <EffectComposer multisampling={4}>
          <SSAO
            blendFunction={BlendFunction.MULTIPLY}
            samples={16}
            radius={0.08}
            intensity={18}
            luminanceInfluence={0.6}
            worldDistanceThreshold={1}
            worldDistanceFalloff={1}
            worldProximityThreshold={1}
            worldProximityFalloff={1}
          />
          <Bloom intensity={0.35} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
          <BrightnessContrast brightness={0.0} contrast={0.06} />
          <Vignette eskil={false} offset={0.2} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>

      {/* Top-right action bar */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
        <IconBtn title="Toggle controls" onClick={() => setPanelOpen((o) => !o)}>
          {panelOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn title="Reset view" onClick={() => setResetKey((k) => k + 1)}>
          <RotateCcw className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title={settings.autoRotate ? "Pause rotation" : "Auto-rotate"}
          onClick={() => update("autoRotate", !settings.autoRotate)}
        >
          {settings.autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn title="Screenshot" onClick={() => captureRef.current?.snapshot()}>
          <CameraIcon className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Fullscreen" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </IconBtn>
      </div>

      {/* Controls panel */}
      {panelOpen && (
        <div className="absolute top-2 left-2 w-64 max-w-[80%] bg-card/85 backdrop-blur-md border border-border rounded-lg p-3 space-y-3 text-xs shadow-2xl z-10">
          <SliderRow
            label="Terrain exaggeration"
            icon={<Mountain className="h-3 w-3" />}
            value={settings.exaggeration}
            display={`${settings.exaggeration.toFixed(1)}x`}
            min={0.2}
            max={5}
            step={0.1}
            onChange={(v) => update("exaggeration", v)}
          />
          <SliderRow
            label="Sun angle"
            icon={<Sun className="h-3 w-3" />}
            value={settings.sunAngle}
            display={`${settings.sunAngle}°`}
            min={0}
            max={360}
            step={5}
            onChange={(v) => update("sunAngle", v)}
          />
          <SliderRow
            label="Sun height"
            icon={<Sun className="h-3 w-3" />}
            value={settings.sunHeight * 100}
            display={`${Math.round(settings.sunHeight * 100)}%`}
            min={5}
            max={100}
            step={5}
            onChange={(v) => update("sunHeight", v / 100)}
          />

          <div className="pt-1 border-t border-border space-y-2">
            <ToggleRow
              icon={<Layers className="h-3 w-3" />}
              label="Crops"
              checked={settings.showCrops}
              onChange={(v) => update("showCrops", v)}
            />
            <ToggleRow label="Rain" checked={settings.showRain} onChange={(v) => update("showRain", v)} />
            <ToggleRow
              label="Sprinklers"
              checked={settings.showSprinklers}
              onChange={(v) => update("showSprinklers", v)}
            />
            <ToggleRow label="Sky" checked={settings.showSky} onChange={(v) => update("showSky", v)} />
            <ToggleRow label="Clouds" checked={settings.showClouds} onChange={(v) => update("showClouds", v)} />
            <ToggleRow
              icon={<Grid3x3 className="h-3 w-3" />}
              label="Reference grid"
              checked={settings.showGrid}
              onChange={(v) => update("showGrid", v)}
            />
            <ToggleRow label="Wireframe" checked={settings.wireframe} onChange={(v) => update("wireframe", v)} />
            <ToggleRow
              label="Elevation heatmap"
              checked={settings.heatmap}
              onChange={(v) => update("heatmap", v)}
            />
          </div>
        </div>
      )}

      {/* Scenario badge */}
      <div className="absolute bottom-2 right-2 z-10 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1 text-[10px] font-medium capitalize">
        {props.scenario.replace("_", " ")}
        {props.soilMoisture !== undefined && (
          <span className="ml-2 text-muted-foreground">· soil {props.soilMoisture}%</span>
        )}
      </div>

      {/* Hint */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-muted-foreground bg-card/70 backdrop-blur-sm rounded px-2 py-1 border border-border">
        Drag · Scroll · Right-drag to pan
      </div>
    </div>
  );
};

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      title={title}
      onClick={onClick}
      className="h-8 w-8 bg-card/90 backdrop-blur-sm border border-border hover:bg-card"
    >
      {children}
    </Button>
  );
}

function SliderRow({
  icon,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium font-mono">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
