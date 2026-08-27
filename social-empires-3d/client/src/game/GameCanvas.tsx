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
    const target = new THREE.Object3D();
    targetRef.current = target;
    scene.add(target);
    return () => scene.remove(target);
  }, [scene]);
  useFrame(() => {
    const light = dirRef.current;
    const target = targetRef.current;
    if (!light || !target) return;
    const tx = Math.round(rig.curTargetX() / 6) * 6;
    const tz = Math.round(rig.curTargetZ() / 6) * 6;
    target.position.set(tx, 0, tz);
    light.position.set(tx + 42, 58, tz + 26);
    light.target = target;
  });
  return <>
    <hemisphereLight args={["#cfe5ff", "#6f5b3c", 0.9]} />
    <directionalLight ref={dirRef} color="#fff2da" intensity={2.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={10} shadow-camera-far={180} shadow-camera-left={-56} shadow-camera-right={56} shadow-camera-top={56} shadow-camera-bottom={-56} shadow-bias={-0.00045} shadow-normalBias={0.03} />
    <ambientLight intensity={0.22} />
  </>;
}

function SystemsDriver() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    sim.attachStoreListener();
    return () => sim.dispose();
  }, []);
  useEffect(() => {
    const onPlace = (event: Event) => {
      const detail = (event as CustomEvent<{ x?: number; z?: number }>).detail;
      if (!detail || !Number.isFinite(detail.x) || !Number.isFinite(detail.z)) return;
      attemptPlaceAt(detail.x, detail.z);
    };
    window.addEventListener("ae-place-at", onPlace);
    return () => window.removeEventListener("ae-place-at", onPlace);
  }, []);
  useFrame((_, dt) => {
    rig.update(dt, camera as THREE.PerspectiveCamera);
    sim.update(Math.min(dt, 0.05), performance.now());
  });
  return null;
}

function World() {
  return <>
    <SkyDome />
    <Water />
    <Terrain />
    <Scatter />
    <GridOverlay />
    <BuildingsLayer />
    <GhostBuilding />
    <VillagersLayer />
    <GarrisonLayer />
    <AmbientEffects />
    <Lights />
    <SystemsDriver />
  </>;
}

export function GameCanvas() {
  return (
    <Canvas shadows="soft" dpr={[1, 1.75]} camera={{ fov: 50, near: 1, far: 260, position: [8, 8, 8] }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl, scene }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.06;
      gl.setClearColor("#7fb7e8");
      scene.fog = new THREE.Fog("#b8d4df", 85, 210);
    }}>
      <World />
    </Canvas>
  );
}
