import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { useUI } from "../../state/uiStore";
import { rig } from "../systems/CameraRig";
import { WATER_LEVEL, terrainHeightAt } from "./terrainMath";
import { worldToTile } from "../buildings/placement";

const SIZE = 190;
const SEG = 118;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const GRASS_A = new THREE.Color("#79b356");
const GRASS_B = new THREE.Color("#57984e");
const ROCK = new THREE.Color("#8d9298");
const SAND = new THREE.Color("#dcc98d");
const DIRT = new THREE.Color("#b39a6a");
const UNDER = new THREE.Color("#b7a76f");

function buildTerrain(): { geo: THREE.BufferGeometry; mat: THREE.MeshStandardMaterial } {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeightAt(x, z));
  }
  geo.computeVertexNormals();

  const colors = new Float32Array(pos.count * 3);
  const normals = geo.attributes.normal as THREE.BufferAttribute;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const patch = (Math.sin(x * 0.21 + z * 0.17) + Math.cos(x * 0.13 - z * 0.23)) * 0.25 + 0.5;
    c.copy(GRASS_A).lerp(GRASS_B, Math.min(1, Math.max(0, patch)));
    const ny = normals.getY(i);
    if (ny < 0.78 && y > WATER_LEVEL) c.lerp(ROCK, smoothstep(0.78, 0.55, ny));
    const sandT = smoothstep(WATER_LEVEL + 1.15, WATER_LEVEL + 0.05, y);
    if (sandT > 0) c.lerp(SAND, sandT);
    if (y < WATER_LEVEL) c.lerp(UNDER, 0.65);
    const d = Math.hypot(x, z);
    const plaza = 1 - smoothstep(18, 24, d);
    if (plaza > 0 && y > WATER_LEVEL + 0.4) c.lerp(DIRT, plaza * 0.72);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.96,
    metalness: 0,
  });
  return { geo, mat };
}

export function Terrain() {
  const built = useMemo(buildTerrain, []);

  const placingDefId = useUI((s) => s.placingDefId);
  const setHoveredTile = useUI((s) => s.setHoveredTile);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!placingDefId) {
      setHoveredTile(null);
      return;
    }
    setHoveredTile({ x: worldToTile(e.point.x), y: worldToTile(e.point.z) });
  };

  const onOut = () => setHoveredTile(null);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (rig.wasDrag()) return;
    if (!placingDefId) return;
    window.dispatchEvent(
      new CustomEvent("ae-place-at", { detail: { x: e.point.x, z: e.point.z } }),
    );
  };

  return (
    <mesh
      geometry={built.geo}
      material={built.mat}
      receiveShadow
      onPointerMove={onMove}
      onPointerOut={onOut}
      onClick={onClick}
    />
  );
}
