import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface Props {
  heightmap: number[]; // 256 (16x16)
  vegetationDensity: number;
  soilColor: string;
  health: number; // 0-100, drives crop color
  scenario: "normal" | "drought" | "heatwave" | "heavy_rain" | "frost";
  irrigationLevel: number; // 0-100
}

const GRID = 16;
const SIZE = 10;

function Terrain({ heightmap, soilColor, health, vegetationDensity, scenario, irrigationLevel }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID - 1, GRID - 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const h = heightmap[i] ?? 0;
      pos.setZ(i, h * 1.8);
    }
    geo.computeVertexNormals();
    return geo;
  }, [heightmap]);

  // Crop instances
  const cropPositions = useMemo(() => {
    const arr: { x: number; y: number; z: number; scale: number }[] = [];
    const count = Math.floor(60 + vegetationDensity * 220);
    for (let i = 0; i < count; i++) {
      const gx = Math.floor(Math.random() * GRID);
      const gz = Math.floor(Math.random() * GRID);
      const idx = gz * GRID + gx;
      const h = (heightmap[idx] ?? 0) * 1.8;
      const x = (gx / (GRID - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.4;
      const z = (gz / (GRID - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.4;
      arr.push({ x, y: h, z, scale: 0.6 + Math.random() * 0.5 });
    }
    return arr;
  }, [heightmap, vegetationDensity]);

  const cropColor = useMemo(() => {
    const h = Math.max(0, Math.min(100, health));
    // brown -> yellow -> green
    if (h < 35) return new THREE.Color("#8a6a2c");
    if (h < 65) return new THREE.Color("#c2b13a");
    return new THREE.Color("#3fa34d");
  }, [health]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = 0;
    }
    state.scene.fog = new THREE.Fog(
      scenario === "drought" ? "#d9b27a" : scenario === "frost" ? "#b8d8e8" : scenario === "heatwave" ? "#e8a87c" : scenario === "heavy_rain" ? "#6a7886" : "#a8c8a0",
      18,
      40,
    );
  });

  return (
    <group>
      {/* Terrain */}
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color={soilColor || "#8b6f47"} roughness={0.95} />
      </mesh>

      {/* Crops */}
      {cropPositions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + 0.25 * p.scale, p.z]} castShadow>
          <coneGeometry args={[0.08 * p.scale, 0.5 * p.scale, 6]} />
          <meshStandardMaterial color={cropColor} roughness={0.7} />
        </mesh>
      ))}

      {/* Water particles for rain scenario */}
      {scenario === "heavy_rain" &&
        Array.from({ length: 80 }).map((_, i) => (
          <RainDrop key={i} />
        ))}

      {/* Irrigation sprinklers visualization */}
      {irrigationLevel > 30 && (
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
  const start = useMemo(() => ({
    x: (Math.random() - 0.5) * SIZE,
    z: (Math.random() - 0.5) * SIZE,
    y: 6 + Math.random() * 4,
    speed: 0.15 + Math.random() * 0.1,
  }), []);
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
            <mesh key={i} position={[Math.cos(a) * 0.6 * intensity, 0, Math.sin(a) * 0.6 * intensity]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshBasicMaterial color="#5fc3ff" transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export const DigitalTwin3D = (props: Props) => {
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

  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas shadows camera={{ position: [9, 7, 9], fov: 45 }}>
        <color attach="background" args={[skyColor]} />
        <ambientLight intensity={props.scenario === "heavy_rain" ? 0.4 : 0.6} />
        <directionalLight
          position={[10, 12, 6]}
          intensity={props.scenario === "heavy_rain" || props.scenario === "frost" ? 0.6 : 1.1}
          castShadow
        />
        <Terrain {...props} />
        <OrbitControls enablePan={false} minDistance={6} maxDistance={20} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
};
