import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { geoCone, geoSphere, mat } from "../../lib/threeCache";
import type { AgentCtrl } from "../engine/Simulation";

const BODY_GEO = new THREE.SphereGeometry(0.55, 10, 8);
const HEAD_GEO = new THREE.SphereGeometry(0.3, 9, 7);
const WING_GEO = new THREE.PlaneGeometry(1.5, 0.75, 3, 2);

export function DrakeRig({ ctrl, colors }: { ctrl: AgentCtrl; colors: { primary: string; secondary: string; accent: string } }) {
  const group = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * 20);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.visible = ctrl.visible;
    if (!ctrl.visible) return;
    t.current += dt;
    g.position.set(ctrl.x, 1.7 + Math.sin(t.current * 1.6) * 0.35, ctrl.z);
    let d = ctrl.facing - g.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.rotation.y += d * 0.15;
    const flap = Math.sin(t.current * 6);
    if (wingL.current) wingL.current.rotation.z = flap * 0.55 + 0.15;
    if (wingR.current) wingR.current.rotation.z = -flap * 0.55 - 0.15;
  });

  return (
    <group ref={group} scale={1.4}>
      <mesh geometry={BODY_GEO} material={mat(colors.primary)} scale={[1, 0.85, 1.45]} castShadow />
      <mesh geometry={HEAD_GEO} material={mat(colors.primary)} position={[0, 0.32, 0.62]} castShadow />
      <mesh geometry={geoCone(0.09, 0.26, 5)} material={mat(colors.accent)} position={[0, 0.34, 0.94]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geoSphere(0.05, 6)} material={mat("#ffe08a", { emissive: "#ff9500", emissiveIntensity: 2 })} position={[0.13, 0.42, 0.78]} />
      <mesh geometry={geoSphere(0.05, 6)} material={mat("#ffe08a", { emissive: "#ff9500", emissiveIntensity: 2 })} position={[-0.13, 0.42, 0.78]} />
      {[0, 1].map((i) => (
        <mesh key={i} geometry={geoCone(0.04, 0.18, 4)} material={mat(colors.secondary)} position={[0.12 - i * 0.24, 0.56, 0.55]} />
      ))}
      <mesh ref={wingL} geometry={WING_GEO} material={mat(colors.secondary, { rough: 0.85 })} position={[0.72, 0.25, 0]} rotation={[0, 0, 0.2]} scale={[1, 1, 1]}>
        <meshStandardMaterial color={colors.secondary} roughness={0.85} side={THREE.DoubleSide} transparent opacity={0.92} />
      </mesh>
      <mesh ref={wingR} geometry={WING_GEO} material={mat(colors.secondary)} position={[-0.72, 0.25, 0]} rotation={[0, Math.PI, 0]} scale={[1, 1, 1]}>
        <meshStandardMaterial color={colors.secondary} roughness={0.85} side={THREE.DoubleSide} transparent opacity={0.92} />
      </mesh>
      <mesh geometry={geoCone(0.16, 1.0, 6)} material={mat(colors.secondary)} position={[0, 0.12, -0.95]} rotation={[-Math.PI / 2 - 0.35, 0, 0]} castShadow />
    </group>
  );
}
