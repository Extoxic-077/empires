import { createContext, useContext, type ReactNode } from "react";
import type { MeshProps as ThreeMeshProps } from "@react-three/fiber";
import { geoBox, geoCone, geoCyl, geoPlane, geoSphere, ghostMat, mat } from "./threeCache";

export interface GhostState {
  valid: boolean;
}

export const GhostContext = createContext<GhostState | null>(null);

interface PrimBase {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  c: string;
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  noShadow?: boolean;
  children?: ReactNode;
}

function resolveMaterial(c: string, p: PrimBase) {
  const ghost = useContext(GhostContext);
  if (ghost) return ghostMat(ghost.valid);
  return mat(c, {
    rough: p.rough,
    metal: p.metal,
    emissive: p.emissive,
    emissiveIntensity: p.emissiveIntensity,
  });
}

export interface BoxProps extends PrimBase {
  w: number;
  h: number;
  d: number;
}

export function B(p: BoxProps) {
  const material = resolveMaterial(p.c, p);
  return (
    <mesh
      geometry={geoBox(p.w, p.h, p.d)}
      material={material}
      position={[p.x ?? 0, p.y ?? 0, p.z ?? 0]}
      rotation={[p.rx ?? 0, p.ry ?? 0, p.rz ?? 0]}
      castShadow={!p.noShadow}
      receiveShadow={!p.noShadow}
    >
      {p.children}
    </mesh>
  );
}

export interface CylProps extends PrimBase {
  rt: number;
  rb: number;
  h: number;
  seg?: number;
}

export function C(p: CylProps) {
  const material = resolveMaterial(p.c, p);
  return (
    <mesh
      geometry={geoCyl(p.rt, p.rb, p.h, p.seg)}
      material={material}
      position={[p.x ?? 0, p.y ?? 0, p.z ?? 0]}
      rotation={[p.rx ?? 0, p.ry ?? 0, p.rz ?? 0]}
      castShadow={!p.noShadow}
      receiveShadow={!p.noShadow}
    >
      {p.children}
    </mesh>
  );
}

export interface ConeProps extends PrimBase {
  r: number;
  h: number;
  seg?: number;
}

export function K(p: ConeProps) {
  const material = resolveMaterial(p.c, p);
  return (
    <mesh
      geometry={geoCone(p.r, p.h, p.seg)}
      material={material}
      position={[p.x ?? 0, p.y ?? 0, p.z ?? 0]}
      rotation={[p.rx ?? 0, p.ry ?? 0, p.rz ?? 0]}
      castShadow={!p.noShadow}
      receiveShadow={!p.noShadow}
    >
      {p.children}
    </mesh>
  );
}

export interface SphereProps extends PrimBase {
  r: number;
  seg?: number;
}

export function S(p: SphereProps) {
  const material = resolveMaterial(p.c, p);
  return (
    <mesh
      geometry={geoSphere(p.r, p.seg)}
      material={material}
      position={[p.x ?? 0, p.y ?? 0, p.z ?? 0]}
      rotation={[p.rx ?? 0, p.ry ?? 0, p.rz ?? 0]}
      castShadow={!p.noShadow}
      receiveShadow={!p.noShadow}
    >
      {p.children}
    </mesh>
  );
}

export interface PlanePrimProps extends PrimBase {
  w: number;
  h: number;
}

export function P(p: PlanePrimProps) {
  const material = resolveMaterial(p.c, p);
  return (
    <mesh
      geometry={geoPlane(p.w, p.h)}
      material={material}
      position={[p.x ?? 0, p.y ?? 0, p.z ?? 0]}
      rotation={[p.rx ?? -Math.PI / 2, p.ry ?? 0, p.rz ?? 0]}
      castShadow={false}
      receiveShadow={!p.noShadow}
    >
      {p.children}
    </mesh>
  );
}

export type { ThreeMeshProps };
