import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TILE_SIZE, getBuildingDef } from "@shared";
import { buildingCenterWorld } from "../buildings/placement";
import { GhostContext } from "../../lib/prims";
import { useGame, type BuildingInstance } from "../../state/gameStore";
import { useUI } from "../../state/uiStore";
import { rig } from "../systems/CameraRig";
import { BUILDING_MODEL_REGISTRY } from "./models/registry";
import { ModelCtx } from "./models/parts";
import { useShallow } from "zustand/react/shallow";

function ProgressSprite({ progress, yOffset }: { progress: number; yOffset: number }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 48;
    return c;
  }, []);
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);
  const drawnRef = useRef(-1);

  useFrame(() => {
    const pct = Math.floor(progress * 100);
    if (drawnRef.current === pct) return;
    drawnRef.current = pct;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 160, 48);
    ctx.fillStyle = "rgba(20,26,38,0.82)";
    roundRect(ctx, 4, 6, 152, 36, 10);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    roundRect(ctx, 10, 22, 140 * Math.min(1, Math.max(0, progress)), 12, 6);
    ctx.fill();
    ctx.fillStyle = "#fff7e0";
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, 80, 19);
    texture.needsUpdate = true;
  });

  return (
    <sprite position={[0, yOffset, 0]} scale={[2.4, 0.72, 1]}>
      <spriteMaterial map={texture} depthTest={false} transparent />
    </sprite>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function Scaffold({ w, d, progress }: { w: number; d: number; progress: number }) {
  const shellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffd166",
        transparent: true,
        opacity: 0.16,
        roughness: 0.8,
      }),
    [],
  );
  const matRef = useRef(shellMat);
  useFrame((state) => {
    matRef.current.opacity = 0.13 + Math.sin(state.clock.elapsedTime * 2.4) * 0.05;
  });
  const ph = 2.2 + Math.min(w, d) * 0.18;
  const corners: Array<[number, number]> = [
    [-(w / 2) * 0.88, -(d / 2) * 0.88],
    [(w / 2) * 0.88, -(d / 2) * 0.88],
    [-(w / 2) * 0.88, (d / 2) * 0.88],
    [(w / 2) * 0.88, (d / 2) * 0.88],
  ];
  return (
    <group>
      <mesh material={shellMat}>
        <boxGeometry args={[w * 0.92, ph, d * 0.92]} />
      </mesh>
      {corners.map(([x, z], i) => (
        <mesh key={`p${i}`} position={[x, ph / 2, z]}>
          <cylinderGeometry args={[0.06, 0.08, ph, 5]} />
          <meshStandardMaterial color="#8a5a33" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, ph - 0.05, 0]}>
        <boxGeometry args={[w * 0.94, 0.1, 0.1]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.9} />
      </mesh>
      <mesh position={[0, ph - 0.05, 0]}>
        <boxGeometry args={[0.1, 0.1, d * 0.94]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.9} />
      </mesh>
      <ProgressSprite progress={progress} yOffset={ph + 1.0} />
    </group>
  );
}

function SelectionRing({ radius }: { radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 3.2) * 0.25;
    ref.current.rotation.z += 0.004;
  });
  return (
    <mesh ref={ref} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.98, radius * 1.08, 40]} />
      <meshBasicMaterial color="#ffd166" transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}

export function BuildingView({ inst }: { inst: BuildingInstance }) {
  const def = getBuildingDef(inst.defId);
  const select = useUI((s) => s.select);
  const selectedId = useUI((s) => s.selectedId);
  const openTrain = useUI((s) => s.openTrain);

  const [cx, cz] = buildingCenterWorld(inst, def);
  const wPx = def.width * TILE_SIZE;
  const dPx = def.depth * TILE_SIZE;

  const now = Date.now();
  const busy = inst.status !== "ready";
  const progress =
    busy && inst.durationMs > 0
      ? THREE.MathUtils.clamp((now - inst.startedAt) / inst.durationMs, 0, 1)
      : 1;

  const displayLevel = inst.status === "construction" ? 0 : Math.max(1, inst.level);
  const Model = BUILDING_MODEL_REGISTRY[inst.defId];
  const isSelected = selectedId === inst.id;

  const onDown = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (rig.wasDrag()) return;
    if (useUI.getState().mode === "placing") return;
    select(inst.id);
    if (!def.trainsUnitIds || def.trainsUnitIds.length === 0) openTrain(null);
  };

  return (
    <group
      position={[cx, 0, cz]}
      rotation={[0, (inst.rot * Math.PI) / 2, 0]}
      onPointerDown={onDown}
    >
      <ModelCtx.Provider value={{ owner: inst.id, rot: inst.rot, cx, cz }}>
        {inst.status !== "construction" && Model && displayLevel > 0 && (
          <Model level={displayLevel} />
        )}
        {inst.status === "construction" && (
          <>
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[wPx * 0.96, dPx * 0.96]} />
              <meshStandardMaterial color="#b39a6a" roughness={0.97} />
            </mesh>
            <B_StoneBase />
          </>
        )}
        {busy && <Scaffold w={wPx} d={dPx} progress={progress} />}
        {isSelected && !busy && <SelectionRing radius={Math.max(wPx, dPx) * 0.62} />}
      </ModelCtx.Provider>
    </group>
  );
}

function B_StoneBase() {
  return (
    <mesh position={[0, 0.14, 0]}>
      <boxGeometry args={[1.6, 0.28, 1.6]} />
      <meshStandardMaterial color="#a7b0ba" roughness={0.95} />
    </mesh>
  );
}

export function GhostBuilding() {
  const placementState = useGhostPlacement();
  const t = useRef(0);
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    t.current += dt;
    if (group.current) group.current.position.y = 0.12 + Math.sin(t.current * 3) * 0.06;
  });
  if (!placementState) return null;
  const Model = BUILDING_MODEL_REGISTRY[placementState.defId];
  if (!Model) return null;
  return (
    <group ref={group} position={[placementState.centerWorld[0], 0.12, placementState.centerWorld[1]]}>
      <group rotation={[0, (placementState.rot * Math.PI) / 2, 0]}>
        <GhostContext.Provider value={{ valid: placementState.valid }}>
          <Model level={1} />
        </GhostContext.Provider>
      </group>
    </group>
  );
}

import { usePlacementState } from "../buildings/usePlacement";
function useGhostPlacement() {
  return usePlacementState();
}

export function BuildingsLayer() {
  const buildings = useGame(useShallow((s) => s.buildings));
  return (
    <group>
      {buildings.map((b) => (
        <BuildingView key={b.id} inst={b} />
      ))}
    </group>
  );
}
