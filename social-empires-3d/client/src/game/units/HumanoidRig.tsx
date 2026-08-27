import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mat, geoCyl, geoSphere } from "../../lib/threeCache";
import { terrainHeightAt } from "../world/terrainMath";
import type { AgentCtrl } from "../engine/Simulation";

export interface RigSpec {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  scale: number;
  weapon: "none" | "sword" | "spear" | "bow" | "staff" | "axe" | "club";
  hat: "none" | "cap" | "helm" | "hood" | "horns" | "halo";
  shield?: boolean;
}

const VILLAGER_PALETTES: Array<{ tunic: string; hair: string }> = [
  { tunic: "#b0654a", hair: "#4a3020" },
  { tunic: "#5f7f9e", hair: "#2e2018" },
  { tunic: "#7d9c62", hair: "#6b4a2a" },
  { tunic: "#a58a4f", hair: "#3c2a1a" },
  { tunic: "#8a6a9e", hair: "#553b22" },
];

const LEG_GEO = new THREE.BoxGeometry(0.11, 0.34, 0.12);
const ARM_GEO = new THREE.BoxGeometry(0.09, 0.36, 0.1);
const BODY_GEO = new THREE.BoxGeometry(0.3, 0.42, 0.2);
const SWORD_GEO = new THREE.BoxGeometry(0.07, 0.72, 0.14);
const SPEAR_TIP_GEO = new THREE.ConeGeometry(0.055, 0.18, 6);
const BOW_GEO = new THREE.TorusGeometry(0.32, 0.028, 6, 14, Math.PI);
const AXE_HEAD_GEO = new THREE.BoxGeometry(0.26, 0.2, 0.05);
const CAP_GEO = new THREE.ConeGeometry(0.16, 0.16, 7);
const HOOD_GEO = new THREE.ConeGeometry(0.19, 0.34, 7);
const HORN_GEO = new THREE.ConeGeometry(0.05, 0.22, 5);

export function villagerSpec(index: number): RigSpec {
  const p = VILLAGER_PALETTES[index % VILLAGER_PALETTES.length];
  return {
    primary: p.tunic,
    secondary: "#7a5c3a",
    accent: "#e8d9b8",
    skin: "#eec39a",
    scale: 0.92,
    weapon: "none",
    hat: index % 3 === 0 ? "cap" : "none",
  };
}

export function specForUnit(unitId: string): RigSpec {
  switch (unitId) {
    case "knight":
      return { primary: "#b03a3a", secondary: "#dfe4ea", accent: "#ffd166", skin: "#eec39a", scale: 1.05, weapon: "sword", hat: "helm", shield: true };
    case "archer":
      return { primary: "#3f7d4e", secondary: "#8a5a33", accent: "#f2e8cf", skin: "#e8b98c", scale: 0.98, weapon: "bow", hat: "cap" };
    case "mage":
      return { primary: "#5b4b8a", secondary: "#2e294e", accent: "#8be0ff", skin: "#eec39a", scale: 0.96, weapon: "staff", hat: "hood" };
    case "cleric":
      return { primary: "#f0ead6", secondary: "#d9b64e", accent: "#fff3b0", skin: "#f0cba4", scale: 0.97, weapon: "staff", hat: "halo" };
    case "goblin":
      return { primary: "#6a994e", secondary: "#386641", accent: "#dd7f2e", skin: "#8fbf6a", scale: 0.82, weapon: "sword", hat: "none" };
    case "orc":
      return { primary: "#588157", secondary: "#344e41", accent: "#a44a3f", skin: "#7ba05b", scale: 1.12, weapon: "axe", hat: "none" };
    case "giant":
      return { primary: "#8d99ae", secondary: "#5c677d", accent: "#edc4b3", skin: "#cfae9a", scale: 1.6, weapon: "club", hat: "none" };
    case "warboss":
      return { primary: "#4a5d23", secondary: "#2c3313", accent: "#ff5400", skin: "#6f9450", scale: 1.75, weapon: "axe", hat: "horns" };
    case "raider":
      return { primary: "#6b705c", secondary: "#3a4032", accent: "#b5651d", skin: "#7ba05b", scale: 1.0, weapon: "sword", hat: "none" };
    case "stinger":
      return { primary: "#7a8450", secondary: "#49543c", accent: "#c1121f", skin: "#8fbf6a", scale: 0.85, weapon: "spear", hat: "cap" };
    default:
      return { primary: "#888", secondary: "#666", accent: "#ccc", skin: "#eec39a", scale: 1, weapon: "none", hat: "none" };
  }
}

function Weapon({ kind }: { kind: RigSpec["weapon"] }) {
  switch (kind) {
    case "sword":
      return (
        <mesh geometry={SWORD_GEO} material={mat("#cfd6dd", { metal: 0.7, rough: 0.3 })} position={[0, 0.42, 0]} castShadow />
      );
    case "spear":
      return (
        <group>
          <mesh geometry={geoCyl(0.03, 0.03, 1.35, 5)} material={mat("#8a5a33")} position={[0, 0.35, 0]} />
          <mesh geometry={SPEAR_TIP_GEO} material={mat("#cfd6dd", { metal: 0.7, rough: 0.3 })} position={[0, 1.1, 0]} />
        </group>
      );
    case "bow":
      return (
        <mesh geometry={BOW_GEO} material={mat("#8a5a33")} position={[0, 0.28, 0]} rotation={[0, Math.PI / 2, 0]} />
      );
    case "staff":
      return (
        <group>
          <mesh geometry={geoCyl(0.035, 0.045, 1.3, 5)} material={mat("#6b4423")} position={[0, 0.32, 0]} />
          <mesh geometry={geoSphere(0.09, 8)} material={mat("#8be0ff", { emissive: "#59c8ff", emissiveIntensity: 1.8, rough: 0.2 })} position={[0, 1.02, 0]} />
        </group>
      );
    case "axe":
      return (
        <group>
          <mesh geometry={geoCyl(0.035, 0.04, 0.85, 5)} material={mat("#6b4423")} position={[0, 0.3, 0]} />
          <mesh geometry={AXE_HEAD_GEO} material={mat("#b9c2c9", { metal: 0.6, rough: 0.4 })} position={[0.12, 0.68, 0]} />
        </group>
      );
    case "club":
      return (
        <group>
          <mesh geometry={geoCyl(0.06, 0.07, 1.0, 6)} material={mat("#6b4423")} position={[0, 0.38, 0]} />
          <mesh geometry={geoSphere(0.17, 7)} material={mat("#7d6a49")} position={[0, 0.92, 0]} castShadow />
        </group>
      );
    default:
      return null;
  }
}

function Hat({ kind, accent }: { kind: RigSpec["hat"]; accent: string }) {
  switch (kind) {
    case "cap":
      return <mesh geometry={CAP_GEO} material={mat(accent)} position={[0, 0.24, 0]} />;
    case "helm":
      return (
        <group>
          <mesh geometry={geoSphere(0.155, 10)} material={mat("#dfe4ea", { metal: 0.65, rough: 0.3 })} position={[0, 0.06, 0]} scale={[1, 0.9, 1]} />
          <mesh geometry={new THREE.BoxGeometry(0.05, 0.12, 0.05)} material={mat("#b03a3a")} position={[0, 0.2, 0]} />
        </group>
      );
    case "hood":
      return (
        <mesh geometry={HOOD_GEO} material={mat("#2e294e")} position={[0, 0.18, -0.02]} />
      );
    case "horns":
      return (
        <group>
          <mesh geometry={HORN_GEO} material={mat("#e8dcc0")} position={[0.13, 0.16, 0]} rotation={[0, 0, -0.7]} />
          <mesh geometry={HORN_GEO} material={mat("#e8dcc0")} position={[-0.13, 0.16, 0]} rotation={[0, 0, 0.7]} />
        </group>
      );
    case "halo":
      return (
        <mesh geometry={new THREE.TorusGeometry(0.11, 0.02, 6, 14)} material={mat("#ffe08a", { emissive: "#ffd166", emissiveIntensity: 1.6 })} position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]} />
      );
    default:
      return null;
  }
}

export function HumanoidRig({
  ctrl,
  spec,
  tool = false,
}: {
  ctrl: AgentCtrl;
  spec: RigSpec;
  tool?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = ctrl.visible;
    if (!ctrl.visible) return;
    g.position.set(ctrl.x, terrainHeightAt(ctrl.x, ctrl.z), ctrl.z);
    let d = ctrl.facing - g.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.rotation.y += d * 0.18;

    const walking = ctrl.activity === "walk";
    const working = ctrl.activity === "work";
    const swing = Math.sin(ctrl.phase) * (walking ? 0.62 : 0.08);
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.8;
    if (armR.current) {
      if (working || (tool && ctrl.activity === "work")) {
        armR.current.rotation.x = -1.15 + Math.sin(ctrl.phase * 1.7) * 0.55;
      } else {
        armR.current.rotation.x = swing * 0.8;
      }
    }
    if (body.current) {
      body.current.position.y = walking ? Math.abs(Math.sin(ctrl.phase)) * 0.045 : 0;
    }
  });

  const s = spec.scale;

  return (
    <group ref={group} scale={s}>
      <mesh ref={legL} geometry={LEG_GEO} material={mat(spec.secondary)} position={[-0.075, 0.17, 0]} castShadow />
      <mesh ref={legR} geometry={LEG_GEO} material={mat(spec.secondary)} position={[0.075, 0.17, 0]} castShadow />
      <group ref={body}>
        <mesh geometry={BODY_GEO} material={mat(spec.primary)} position={[0, 0.56, 0]} castShadow />
        <mesh geometry={geoSphere(0.135, 10)} material={mat(spec.skin)} position={[0, 0.92, 0]} castShadow />
        <Hat kind={spec.hat} accent={spec.accent} />
        <group ref={armL} position={[-0.19, 0.74, 0]}>
          <mesh geometry={ARM_GEO} material={mat(spec.primary)} position={[0, -0.16, 0]} castShadow />
        </group>
        <group ref={armR} position={[0.19, 0.74, 0]}>
          <mesh geometry={ARM_GEO} material={mat(spec.primary)} position={[0, -0.16, 0]} castShadow />
          <group position={[0, -0.32, 0.06]} rotation={[0.5, 0, 0]}>
            <Weapon kind={spec.weapon} />
          </group>
        </group>
        {spec.shield && (
          <mesh geometry={geoCyl(0.14, 0.14, 0.04, 12)} material={mat(spec.accent, { metal: 0.3, rough: 0.6 })} position={[-0.24, 0.55, 0.04]} rotation={[0, 0, Math.PI / 2]} castShadow />
        )}
      </group>
    </group>
  );
}
