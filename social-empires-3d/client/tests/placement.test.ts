import { describe, expect, it } from "vitest";
import {
  buildOccupancy,
  checkPlacement,
  footprintSize,
  originForCenteredCursor,
  tileToWorldCenter,
  worldToTile,
} from "../src/game/buildings/placement";
import { getBuildingDef } from "@shared";

describe("placement rules", () => {
  const th = getBuildingDef("townhall");

  it("swaps footprint when rotated 90 degrees", () => {
    expect(footprintSize(th, 0)).toEqual({ w: 4, d: 4 });
    const barracks = getBuildingDef("barracks");
    expect(footprintSize(barracks, 0)).toEqual({ w: 3, d: 3 });
    const farm = getBuildingDef("farm");
    expect(footprintSize(farm, 1)).toEqual({ w: 2, d: 2 });
  });

  it("rejects out-of-bounds placements", () => {
    const occ = new Set<string>();
    expect(checkPlacement(occ, th, 0, 0, 0).reason).toBe("bounds");
    expect(checkPlacement(occ, th, 40, 40, 0).ok).toBe(false);
  });

  it("rejects overlapping buildings", () => {
    const occ = buildOccupancy([
      { defId: "townhall", x: 20, y: 20, rot: 0 },
    ]);
    const mine = getBuildingDef("goldmine");
    expect(checkPlacement(occ, mine, 22, 22, 0).reason).toBe("occupied");
    expect(checkPlacement(occ, mine, 25, 22, 0).ok).toBe(true);
  });

  it("allows walls adjacent to each other", () => {
    const occ = buildOccupancy([
      { defId: "wall", x: 12, y: 12, rot: 0 },
      { defId: "wall", x: 13, y: 12, rot: 0 },
    ]);
    const wall = getBuildingDef("wall");
    expect(checkPlacement(occ, wall, 14, 12, 0).ok).toBe(true);
  });

  it("converts between tiles and world consistently", () => {
    const i = 21;
    const w = tileToWorldCenter(i);
    expect(w).toBeCloseTo(1);
    expect(worldToTile(w)).toBe(i);
    expect(tileToWorldCenter(0)).toBeCloseTo(-41);
  });

  it("centers cursor-origin math on odd footprints", () => {
    const o = originForCenteredCursor(20, 20, 3, 3);
    expect(o).toEqual({ x: 19, y: 19 });
    const o2 = originForCenteredCursor(20, 20, 4, 4);
    expect(o2).toEqual({ x: 19, y: 19 });
  });
});
