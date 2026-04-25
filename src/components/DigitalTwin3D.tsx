import { useMemo, useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Sky, Cloud, Clouds, ContactShadows, Environment } from "@react-three/drei";
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

interface Props {
  heightmap: number[]; // 256 (16x16)
  vegetationDensity: number;
  soilColor: string;
  health: number; // 0-100, drives crop color
  scenario: "normal" | "drought" | "heatwave" | "heavy_rain" | "frost";
  irrigationLevel: number; // 0-100
  soilMoisture?: number; // 0-100, from sensor — darkens soil, hint of wetness
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
  sunAngle: number; // 0-360
  sunHeight: number; // 0.05-1
}

const GRID = 16;
const SIZE = 10;

function darkenHex(hex: string, amount: number): string {
  // amount 0..1, 1 = full black
  try {
    const c = new THREE.Color(hex);
    c.lerp(new THREE.Color("#1a1410"), Math.max(0, Math.min(0.6, amount)));
    return `#${c.getHexString()}`;
  } catch {
    return hex;
  }
}

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

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID - 1, GRID - 1);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const h = heightmap[i] ?? 0;
      pos.setZ(i, h * settings.exaggeration);
      const t = Math.max(0, Math.min(1, h));
      const r = t;
      const g = 1 - Math.abs(t - 0.5) * 2;
      const b = 1 - t;
      colors.push(r, g, b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [heightmap, settings.exaggeration]);

  // Wet soil = darker, slightly bluer
  const effectiveSoilColor = useMemo(() => {
    const wet = (soilMoisture ?? 50) / 100;
    return darkenHex(soilColor || "#8b6f47", wet * 0.5);
  }, [soilColor, soilMoisture]);

  // Crop instances — multi-part bushes for richer look
  const cropPositions = useMemo(() => {
    const arr: { x: number; y: number; z: number; scale: number; jitter: number }[] = [];
    const count = Math.floor(80 + vegetationDensity * 280);
    for (let i = 0; i < count; i++) {
      const gx = Math.floor(Math.random() * GRID);
      const gz = Math.floor(Math.random() * GRID);
      const idx = gz * GRID + gx;
      const h = (heightmap[idx] ?? 0) * settings.exaggeration;
      const x = (gx / (GRID - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.5;
      const z = (gz / (GRID - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.5;
      arr.push({ x, y: h, z, scale: 0.55 + Math.random() * 0.55, jitter: Math.random() });
    }
    return arr;
  }, [heightmap, vegetationDensity, settings.exaggeration]);

  const cropColors = useMemo(() => {
    const h = Math.max(0, Math.min(100, health));
    let base: THREE.Color;
    let tip: THREE.Color;
    if (h < 35) {
      base = new THREE.Color("#7a5a22");
      tip = new THREE.Color("#a08344");
    } else if (h < 65) {
      base = new THREE.Color("#9a8a2a");
      tip = new THREE.Color("#d6c64a");
    } else {
      base = new THREE.Color("#2d7a3a");
      tip = new THREE.Color("#5cc46a");
    }
    return { base, tip };
  }, [health]);

  useFrame((state) => {
    state.scene.fog = new THREE.Fog(
      scenario === "drought"
        ? "#d9b27a"
        : scenario === "frost"
          ? "#b8d8e8"
          : scenario === "heatwave"
            ? "#e8a87c"
            : scenario === "heavy_rain"
              ? "#6a7886"
              : "#bcd9b0",
      22,
      55,
    );
  });

  return (
    <group>
      {/* Terrain */}
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {settings.heatmap ? (
          <meshStandardMaterial vertexColors roughness={0.85} metalness={0.05} wireframe={settings.wireframe} />
        ) : (
          <meshStandardMaterial
            color={effectiveSoilColor}
            roughness={0.92 - ((soilMoisture ?? 50) / 100) * 0.4}
            metalness={0.02}
            wireframe={settings.wireframe}
          />
        )}
      </mesh>

      {/* Subtle water sheen overlay when very wet */}
      {(soilMoisture ?? 0) > 70 && !settings.wireframe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[SIZE * 0.98, SIZE * 0.98]} />
          <meshStandardMaterial
            color="#3a6e8a"
            transparent
            opacity={0.18}
            roughness={0.15}
            metalness={0.6}
          />
        </mesh>
      )}

      {/* Crops — two-layer bush for depth */}
      {settings.showCrops &&
        cropPositions.map((p, i) => (
          <group key={i} position={[p.x, p.y, p.z]}>
            <mesh position={[0, 0.18 * p.scale, 0]} castShadow>
              <coneGeometry args={[0.09 * p.scale, 0.36 * p.scale, 6]} />
              <meshStandardMaterial color={cropColors.base} roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.42 * p.scale, 0]} castShadow>
              <sphereGeometry args={[0.13 * p.scale, 8, 6]} />
              <meshStandardMaterial color={cropColors.tip} roughness={0.6} />
            </mesh>
          </group>
        ))}

      {/* Rain */}
      {settings.showRain &&
        scenario === "heavy_rain" &&
        Array.from({ length: 110 }).map((_, i) => <RainDrop key={i} />)}

      {/* Frost speckles */}
      {scenario === "frost" &&
        Array.from({ length: 40 }).map((_, i) => <FrostFleck key={i} />)}

      {/* Sprinklers */}
      {settings.showSprinklers && irrigationLevel > 30 && (
        <>
          <Sprinkler position={[-2.2, 0, -2.2]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[2.2, 0, 2.2]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[-2.2, 0, 2.2]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[2.2, 0, -2.2]} intensity={irrigationLevel / 100} />
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
      y: 6 + Math.random() * 4,
      speed: 0.18 + Math.random() * 0.12,
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
      <cylinderGeometry args={[0.012, 0.012, 0.25, 4]} />
      <meshBasicMaterial color="#a8d8ee" transparent opacity={0.75} />
    </mesh>
  );
}

function FrostFleck() {
  const pos = useMemo(
    () => [
      (Math.random() - 0.5) * SIZE * 0.95,
      0.02,
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

function Sprinkler({ position, intensity }: { position: [number, number, number]; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 2;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.8, 8]} />
        <meshStandardMaterial color="#999" metalness={0.4} roughness={0.5} />
      </mesh>
      <group ref={groupRef} position={[0, 0.85, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.7 * intensity, 0, Math.sin(a) * 0.7 * intensity]}
            >
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshBasicMaterial color="#7fd0ff" transparent opacity={0.85} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function SunRig({ angle, height, scenario }: { angle: number; height: number; scenario: Props["scenario"] }) {
  const rad = (angle * Math.PI) / 180;
  const r = 14;
  const x = Math.cos(rad) * r;
  const z = Math.sin(rad) * r;
  const y = 4 + height * 16;
  const dim = scenario === "heavy_rain" || scenario === "frost" ? 0.55 : 1.2;
  const sunColor = scenario === "heatwave" ? "#ffb070" : scenario === "frost" ? "#dfeaf2" : "#fff4d6";
  return (
    <>
      <directionalLight
        position={[x, y, z]}
        intensity={dim}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color={sunColor}
      />
      {/* Visible sun disc */}
      <mesh position={[x * 0.7, y * 0.7, z * 0.7]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial color={sunColor} />
      </mesh>
    </>
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
      enablePan={true}
      minDistance={4}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.05}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
      enableDamping
      dampingFactor={0.08}
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
    exaggeration: 1.8,
    showCrops: true,
    showRain: true,
    showSprinklers: true,
    showGrid: false,
    wireframe: false,
    heatmap: false,
    autoRotate: false,
    showClouds: true,
    showSky: true,
    sunAngle: 45,
    sunHeight: 0.55,
  });

  // Sky params per scenario
  const skyParams = useMemo(() => {
    switch (props.scenario) {
      case "drought":
        return { turbidity: 9, rayleigh: 1.5, mieCoefficient: 0.02, mieDirectionalG: 0.85, inclination: 0.48 };
      case "heatwave":
        return { turbidity: 12, rayleigh: 2, mieCoefficient: 0.025, mieDirectionalG: 0.9, inclination: 0.5 };
      case "heavy_rain":
        return { turbidity: 18, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.7, inclination: 0.45 };
      case "frost":
        return { turbidity: 6, rayleigh: 1, mieCoefficient: 0.01, mieDirectionalG: 0.7, inclination: 0.4 };
      default:
        return { turbidity: 5, rayleigh: 1.2, mieCoefficient: 0.005, mieDirectionalG: 0.8, inclination: 0.5 };
    }
  }, [props.scenario]);

  const sunPos = useMemo<[number, number, number]>(() => {
    const rad = (settings.sunAngle * Math.PI) / 180;
    return [Math.cos(rad) * 100, 20 + settings.sunHeight * 80, Math.sin(rad) * 100];
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
      className={`relative w-full ${fullscreen ? "h-screen" : "h-[480px]"} rounded-xl overflow-hidden border border-border bg-card shadow-elegant`}
    >
      <Canvas
        shadows
        camera={{ position: [10, 8, 10], fov: 42 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        dpr={[1, 2]}
      >
        {settings.showSky ? (
          <Sky
            distance={450000}
            sunPosition={sunPos}
            inclination={skyParams.inclination}
            azimuth={0.25}
            turbidity={skyParams.turbidity}
            rayleigh={skyParams.rayleigh}
            mieCoefficient={skyParams.mieCoefficient}
            mieDirectionalG={skyParams.mieDirectionalG}
          />
        ) : (
          <color attach="background" args={["#1a1f1a"]} />
        )}

        <Environment preset={props.scenario === "heavy_rain" ? "city" : props.scenario === "frost" ? "dawn" : "park"} />

        <ambientLight intensity={props.scenario === "heavy_rain" ? 0.4 : 0.55} />
        <SunRig angle={settings.sunAngle} height={settings.sunHeight} scenario={props.scenario} />

        {settings.showClouds && (
          <Clouds material={THREE.MeshBasicMaterial} limit={20}>
            <Cloud
              segments={30}
              bounds={[12, 2, 12]}
              volume={6}
              color={props.scenario === "heavy_rain" ? "#5a6470" : "#ffffff"}
              opacity={props.scenario === "heavy_rain" ? 0.85 : 0.55}
              position={[0, 9, 0]}
              speed={0.2}
            />
            <Cloud
              segments={20}
              bounds={[8, 1.5, 8]}
              volume={4}
              color={props.scenario === "heavy_rain" ? "#454e58" : "#f4f4f4"}
              opacity={props.scenario === "heavy_rain" ? 0.75 : 0.4}
              position={[6, 11, -4]}
              speed={0.15}
            />
          </Clouds>
        )}

        <Terrain {...props} settings={settings} />

        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.45}
          scale={SIZE * 1.3}
          blur={2}
          far={6}
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
            fadeDistance={25}
            position={[0, 0.01, 0]}
            infiniteGrid={false}
          />
        )}

        <ControlsResettable resetKey={resetKey} autoRotate={settings.autoRotate} />
        <SceneCapture ref={captureRef} />
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
