import { fbm } from "../../lib/rng";

export const TERRAIN_SEED = 20260826;
export const ISLAND_RADIUS = 58;
export const SHORE_FALLOFF = 13;
export const WATER_LEVEL = -0.42;
export const FLAT_CENTER_RADIUS = 22;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function islandMask(x: number, z: number): number {
  const d = Math.hypot(x, z);
  return smoothstep(ISLAND_RADIUS, ISLAND_RADIUS - SHORE_FALLOFF, d);
}

export function terrainHeightAt(x: number, z: number): number {
  const mask = islandMask(x, z);
  if (mask <= 0.001) return WATER_LEVEL - 1.6;
  const d = Math.hypot(x, z);
  const flat = smoothstep(FLAT_CENTER_RADIUS, FLAT_CENTER_RADIUS + 14, d);
  const n = fbm(x * 0.055 + 31.7, z * 0.055 - 12.3, TERRAIN_SEED, 3);
  return -2.6 * (1 - mask) + (n - 0.5) * 1.5 * mask * flat;
}
