import { useMemo, useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
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
  sunAngle: number; // 0-360
}

const GRID = 16;
const SIZE = 10;

function Terrain({
  heightmap,
  soilColor,
  health,
  vegetationDensity,
  scenario,
  irrigationLevel,
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
      // Heatmap color (low=blue, mid=green, high=red)
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

  const cropPositions = useMemo(() => {
    const arr: { x: number; y: number; z: number; scale: number }[] = [];
    const count = Math.floor(60 + vegetationDensity * 220);
    for (let i = 0; i < count; i++) {
      const gx = Math.floor(Math.random() * GRID);
      const gz = Math.floor(Math.random() * GRID);
      const idx = gz * GRID + gx;
      const h = (heightmap[idx] ?? 0) * settings.exaggeration;
      const x = (gx / (GRID - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.4;
      const z = (gz / (GRID - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.4;
      arr.push({ x, y: h, z, scale: 0.6 + Math.random() * 0.5 });
    }
    return arr;
  }, [heightmap, vegetationDensity, settings.exaggeration]);

  const cropColor = useMemo(() => {
    const h = Math.max(0, Math.min(100, health));
    if (h < 35) return new THREE.Color("#8a6a2c");
    if (h < 65) return new THREE.Color("#c2b13a");
    return new THREE.Color("#3fa34d");
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
              : "#a8c8a0",
      18,
      40,
    );
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {settings.heatmap ? (
          <meshStandardMaterial vertexColors roughness={0.9} wireframe={settings.wireframe} />
        ) : (
          <meshStandardMaterial
            color={soilColor || "#8b6f47"}
            roughness={0.95}
            wireframe={settings.wireframe}
          />
        )}
      </mesh>

      {settings.showCrops &&
        cropPositions.map((p, i) => (
          <mesh key={i} position={[p.x, p.y + 0.25 * p.scale, p.z]} castShadow>
            <coneGeometry args={[0.08 * p.scale, 0.5 * p.scale, 6]} />
            <meshStandardMaterial color={cropColor} roughness={0.7} />
          </mesh>
        ))}

      {settings.showRain &&
        scenario === "heavy_rain" &&
        Array.from({ length: 80 }).map((_, i) => <RainDrop key={i} />)}

      {settings.showSprinklers && irrigationLevel > 30 && (
        <>
          <Sprinkler position={[-2, 0, -2]} intensity={irrigationLevel / 100} />
          <Sprinkler position={[2, 0, 2]} intensity={irrigationLevel / 100} />
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
      speed: 0.15 + Math.random() * 0.1,
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
      <cylinderGeometry args={[0.01, 0.01, 0.2, 4]} />
      <meshBasicMaterial color="#7ec8e3" transparent opacity={0.7} />
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
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.8, 8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <group ref={groupRef} position={[0, 0.85, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.6 * intensity, 0, Math.sin(a) * 0.6 * intensity]}
            >
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshBasicMaterial color="#5fc3ff" transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function SunLight({ angle, scenario }: { angle: number; scenario: Props["scenario"] }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * 12;
  const z = Math.sin(rad) * 12;
  return (
    <directionalLight
      position={[x, 12, z]}
      intensity={scenario === "heavy_rain" || scenario === "frost" ? 0.6 : 1.1}
      castShadow
    />
  );
}

// Captures screenshot of the canvas
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

// Reset view by remounting OrbitControls via key
function ControlsResettable({ resetKey, autoRotate }: { resetKey: number; autoRotate: boolean }) {
  return (
    <OrbitControls
      key={resetKey}
      enablePan={true}
      minDistance={4}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.05}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
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
    sunAngle: 45,
  });

  const skyColor =
    props.scenario === "drought"
      ? "#e8c98a"
      : props.scenario === "frost"
        ? "#cfe4f0"
        : props.scenario === "heatwave"
          ? "#f4b685"
          : props.scenario === "heavy_rain"
            ? "#5d6e7b"
            : "#cfe6c4";

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
      className={`relative w-full ${fullscreen ? "h-screen" : "h-[460px]"} rounded-xl overflow-hidden border border-border bg-card`}
    >
      <Canvas shadows camera={{ position: [9, 7, 9], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
        <color attach="background" args={[skyColor]} />
        <ambientLight intensity={props.scenario === "heavy_rain" ? 0.4 : 0.6} />
        <SunLight angle={settings.sunAngle} scenario={props.scenario} />
        <Terrain {...props} settings={settings} />
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
      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
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
        <div className="absolute top-2 left-2 w-60 max-w-[80%] bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-3 text-xs shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mountain className="h-3 w-3" /> Terrain exaggeration
              </span>
              <span className="font-medium">{settings.exaggeration.toFixed(1)}x</span>
            </div>
            <Slider
              value={[settings.exaggeration]}
              min={0.2}
              max={5}
              step={0.1}
              onValueChange={(v) => update("exaggeration", v[0])}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Sun className="h-3 w-3" /> Sun angle
              </span>
              <span className="font-medium">{settings.sunAngle}°</span>
            </div>
            <Slider
              value={[settings.sunAngle]}
              min={0}
              max={360}
              step={5}
              onValueChange={(v) => update("sunAngle", v[0])}
            />
          </div>

          <div className="pt-1 border-t border-border space-y-2">
            <ToggleRow
              icon={<Layers className="h-3 w-3" />}
              label="Crop markers"
              checked={settings.showCrops}
              onChange={(v) => update("showCrops", v)}
            />
            <ToggleRow
              label="Rain effect"
              checked={settings.showRain}
              onChange={(v) => update("showRain", v)}
            />
            <ToggleRow
              label="Sprinklers"
              checked={settings.showSprinklers}
              onChange={(v) => update("showSprinklers", v)}
            />
            <ToggleRow
              icon={<Grid3x3 className="h-3 w-3" />}
              label="Reference grid"
              checked={settings.showGrid}
              onChange={(v) => update("showGrid", v)}
            />
            <ToggleRow
              label="Wireframe"
              checked={settings.wireframe}
              onChange={(v) => update("wireframe", v)}
            />
            <ToggleRow
              label="Elevation heatmap"
              checked={settings.heatmap}
              onChange={(v) => update("heatmap", v)}
            />
          </div>
        </div>
      )}

      {/* Bottom-left hint */}
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-card/70 backdrop-blur-sm rounded px-2 py-1 border border-border">
        Drag to rotate · Scroll to zoom · Right-drag to pan
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
