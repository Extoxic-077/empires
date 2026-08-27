import type { BuildingDefinition } from "@shared";
import { BUILD_AREA_MAX, BUILD_AREA_MIN, GRID_HALF_EXTENT, TILE_SIZE, getBuildingDef } from "@shared";

export const GRID_N = GRID_HALF_EXTENT * 2;

export interface FootprintSource {
  x: number;
  y: number;
  rot: number;
}

export function tileToWorldCenter(i: number): number {
  return (i - GRID_N / 2 + 0.5) * TILE_SIZE;
}

export function worldToTile(v: number): number {
  return Math.floor(v / TILE_SIZE + GRID_N / 2);
}

export function footprintSize(def: Pick<BuildingDefinition, "width" | "depth">, rot: number): { w: number; d: number } {
  return rot % 2 === 1 ? { w: def.depth, d: def.width } : { w: def.width, d: def.depth };
}

export function buildingCenterWorld(b: FootprintSource, def: Pick<BuildingDefinition, "width" | "depth">): [number, number] {
  const { w, d } = footprintSize(def, b.rot);
  return [(b.x + w / 2 - GRID_N / 2) * TILE_SIZE, (b.y + d / 2 - GRID_N / 2) * TILE_SIZE];
}

export function originForCenteredCursor(cursorI: number, cursorJ: number, w: number, d: number): { x: number; y: number } {
  return { x: cursorI - ((w - 1) >> 1), y: cursorJ - ((d - 1) >> 1) };
}

export function footprintTiles(x: number, y: number, w: number, d: number): Array<[number, number]> {
  const tiles: Array<[number, number]> = [];
  for (let i = x; i < x + w; i++) {
    for (let j = y; j < y + d; j++) tiles.push([i, j]);
  }
  return tiles;
}

export function tileKey(i: number, j: number): string {
  return `${i}:${j}`;
}

export interface OccupancyBuildings {
  defId: string;
  x: number;
  y: number;
  rot: number;
}

export function buildOccupancy(buildings: OccupancyBuildings[]): Set<string> {
  const occ = new Set<string>();
  for (const b of buildings) {
    const def = getBuildingDef(b.defId);
    const { w, d } = footprintSize(def, b.rot);
    for (const [i, j] of footprintTiles(b.x, b.y, w, d)) occ.add(tileKey(i, j));
  }
  return occ;
}

export type PlacementFailReason = "bounds" | "occupied" | "unknown";

export interface PlacementResult {
  ok: boolean;
  reason?: PlacementFailReason;
}

export function checkPlacement(
  occupancy: Set<string>,
  def: Pick<BuildingDefinition, "width" | "depth">,
  x: number,
  y: number,
  rot: number,
): PlacementResult {
  const { w, d } = footprintSize(def, rot);
  for (const [i, j] of footprintTiles(x, y, w, d)) {
    if (i < BUILD_AREA_MIN || i > BUILD_AREA_MAX || j < BUILD_AREA_MIN || j > BUILD_AREA_MAX) {
      return { ok: false, reason: "bounds" };
    }
    if (occupancy.has(tileKey(i, j))) return { ok: false, reason: "occupied" };
  }
  return { ok: true };
}
