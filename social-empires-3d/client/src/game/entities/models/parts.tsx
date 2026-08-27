import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { geoCyl, geoSphere, mat } from "../../../lib/threeCache";
import { registerChimney, unregisterChimney } from "../../effects/chimneys";

export interface ModelCtxValue {
  owner: string;
  rot: number;
  cx: number;
  cz: number;
}

export const ModelCtx = createContext<ModelCtxValue>({ owner: "", rot: 0, cx: 0, cz: 0 });

export function Chimney({ lx, lz, h }: { lx: number; lz: number; h: number }) {
  const ctx = useContext(ModelCtx);
  useEffect(() => {
    const c = Math.cos(ctx.rot);
    const s = Math.sin(ctx.rot);
    const wx = ctx.cx + lx * c + lz * s;
    const wz = ctx.cz - lx * s + lz * c;
    registerChimney(`${ctx.owner}:${lx}:${lz}`, [wx, h, wz]);
    return () => unregisterChimney(`${ctx.owner}:${lx}:${lz}`);
  }, [ctx.owner, ctx.rot, ctx.cx, ctx.cz, lx, lz, h]);
  return null;
}

const FLAG_SEG_X = 7;
const FLAG_SEG_Z = 4;

export function ClothFlag({
  w,
  h,
  color,
  speed = 5,
  amp = 0.16,
}: {
  w: number;
  h: number;
  color: string;
  speed?: number;
  amp?: number;
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, FLAG_SEG_X, FLAG_SEG_Z);
    g.translate(w / 2, 0, 0);
    return g;
  }, [w, h]);
  const base = useMemo(() => {
    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    return Float32Array.from(pos);
  }, [geo]);
  const tRef = useRef(0);

  useFrame((_, dt) => {
    tRef.current += dt * speed;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const bx = base[i];
      const by = base[i + 1];
      const k = bx / w;
      arr[i + 2] = Math.sin(bx * 2.4 + tRef.current) * amp * k + Math.sin(by * 3 + tRef.current * 0.7) * amp * 0.25 * k;
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh geometry={geo} castShadow={false}>
      <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function FlagPole({ height = 2.6, color = "#c1440e", x = 0, z = 0 }: { height?: number; color?: string; x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geoCyl(0.05, 0.07, height, 6)} material={mat("#6b4f2a")} position={[0, height / 2, 0]} castShadow />
      <group position={[0.02, height - 0.35, 0]}>
        <ClothFlag w={1.15} h={0.65} color={color} />
      </group>
      <mesh geometry={geoSphere(0.09, 8)} material={mat("#ffd166", { metal: 0.6, rough: 0.35 })} position={[0, height + 0.05, 0]} />
    </group>
  );
}

export function Spinner({
  speed = 1,
  axis = "z",
  children,
}: {
  speed?: number;
  axis?: "x" | "y" | "z";
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation[axis] += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

export function Bobber({ amp = 0.12, speed = 2.2, lift = 0, children }: { amp?: number; speed?: number; lift?: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 10);
  useFrame((_, dt) => {
    t.current += dt * speed;
    if (ref.current) ref.current.position.y = lift + Math.sin(t.current) * amp;
  });
  return <group ref={ref}>{children}</group>;
}

export function Pulsor({ min = 0.85, max = 1.15, speed = 2.4, children }: { min?: number; max?: number; speed?: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 6);
  useFrame((_, dt) => {
    t.current += dt * speed;
    const k = (Math.sin(t.current) + 1) / 2;
    const s = min + (max - min) * k;
    ref.current?.scale.setScalar(s);
  });
  return <group ref={ref}>{children}</group>;
}

export function OrbitRing({
  radius = 0.9,
  speed = 1.2,
  y = 3.4,
  count = 3,
  color = "#8be0ff",
  size = 0.14,
}: {
  radius?: number;
  speed?: number;
  y?: number;
  count?: number;
  color?: string;
  size?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    items.push(
      <mesh
        key={i}
        position={[Math.cos(a) * radius, y + Math.sin(a * 2) * 0.12, Math.sin(a) * radius]}
        material={mat(color, { emissive: color, emissiveIntensity: 1.4, rough: 0.3 })}
        castShadow
      >
        <octahedronGeometry args={[size, 0]} />
      </mesh>,
    );
  }
  return <group ref={ref}>{items}</group>;
}
