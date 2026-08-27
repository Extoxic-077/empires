import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Terrain } from "./world/Terrain";
import { SkyDome, Water } from "./world/Water";
import { Scatter } from "./world/Scatter";
import { GridOverlay } from "./world/GridOverlay";
import { BuildingsLayer, GhostBuilding } from "./entities/BuildingView";
import { VillagersLayer } from "./units/VillagersLayer";
import { GarrisonLayer } from "./units/GarrisonLayer";
import { AmbientEffects } from "./effects/AmbientEffects";
import { rig } from "./systems/CameraRig";
import { sim } from "./engine/Simulation";
import { attemptPlaceAt } from "./buildings/usePlacement";

function Lights() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    const t = new THREE.Object3D();
    targetRef.current = t;
    scene.add(t);
    return () => {
      scene.remove(t);
    };
  }, [scene]);

  useFrame(() => {
    const dir = dirRef.current;
    if (!dir || !targetRef.current) return;
    const tx = Math.round(rig.curTargetX() / 6) * 6;
    const tz = Math.round(rig.curTargetZ() / 6) * 6;
    targetRef.current.position.set(tx, 0, tz);
    dir.position.set(tx + 42, 58, tz + 26);
    dir.target = targetRef.current;
  });

  return (
    <>
      <hemisphereLight args={["#cfe5ff", "#7a6a4f", 0.85]} />
      <directionalLight
        ref={dirRef}
        color="#fff2da"
        intensity={2.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={180}
        shadow-camera-left={-56}
        shadow-camera-right={56}
        shadow-camera-top={56}
        shadow-camera-bottom={-56}
        shadow-bias={-0.00045}
        shadow-normalBias={0.03}
      />
      <ambientLight intensity={0.22} />
    </>
  );
}

function SystemsDriver() {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    sim.attachStoreListener();
    return () => sim.dispose();
  }, []);

  useEffect(() => {
    const onPlace = (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; z: number }>).detail;
      attemptPlaceAt(detail.x, detail.z);
    };
    window.addEventListener("ae-place-at", onPlace);
    return () => window.removeEventListener("ae-place-at", onPlace);
  }, []);

  useFrame((_, dt) => {
    rig.update(dt, camera as THREE.PerspectiveCamera);
    sim.update(dt, performance.now());
  });

  return null;
}

export function GameCanvas() {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.75]}
      camera={{ fov: 50, near: 1, far: 200, position: [8, 8, 8] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
      }}
    >
      <color attach="background" args={["#4da6ff"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={2} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </Canvas>
  );
}
