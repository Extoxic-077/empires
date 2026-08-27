import { describe, expect, it } from "vitest";
import {
  addClamped,
  accrue,
  clampGain,
  incomePerMinute,
  popCapacity,
  popUsed,
  storageCaps,
} from "../src/game/economy/economy";
import { BUILDING_DEFINITIONS, UNIT_DEFINITIONS, getBuildingDef } from "@shared";

const resolveB = (id: string) => {
  const def = BUILDING_DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error(id);
  return def;
};

describe("economy kernels", () => {
  it("accrues production linearly over time", () => {
    expect(accrue(60, 60000)).toBeCloseTo(60);
    expect(accrue(10, 30000)).toBeCloseTo(5);
    expect(accrue(0, 100000)).toBe(0);
    expect(accrue(12, -5)).toBe(0);
  });

  it("clamps gains to storage headroom", () => {
    expect(clampGain(900, 1000, 500)).toBe(100);
    expect(clampGain(1000, 1000, 50)).toBe(0);
    expect(clampGain(100, 1000, -20)).toBe(0);
  });

  it("sums storage caps across ready buildings", () => {
    const caps = storageCaps(
      [
        { defId: "townhall", level: 1, status: "ready" },
        { defId: "storehouse", level: 1, status: "ready" },
        { defId: "storehouse", level: 2, status: "construction" },
      ],
      resolveB,
    );
    const th = getBuildingDef("townhall");
    expect(caps.gold).toBe(1600 + 900);
    expect(th.levels[0].storage?.gold).toBe(1600);
  });

  it("aggregates income and population correctly", () => {
    const income = incomePerMinute(
      [
        { defId: "goldmine", level: 2, status: "ready" },
        { defId: "lumbermill", level: 1, status: "ready" },
        { defId: "farm", level: 3, status: "upgrade" },
      ],
      resolveB,
    );
    expect(income.gold).toBe(15);
    expect(income.wood).toBe(10);
    expect(income.food).toBe(0);

    expect(popCapacity([{ defId: "townhall", level: 2, status: "ready" }], resolveB)).toBe(14);
    expect(popCapacity([{ defId: "townhall", level: 2, status: "construction" }], resolveB)).toBe(0);

    const knight = UNIT_DEFINITIONS.find((u) => u.id === "knight")!;
    const spearman = UNIT_DEFINITIONS.find((u) => u.id === "spearman")!;
    expect(popUsed([{ unitId: "knight" }, { unitId: "spearman" }, { unitId: "spearman" }], (id) => UNIT_DEFINITIONS.find((u) => u.id === id)!))
      .toBe(knight.cost.pop! + spearman.cost.pop! * 2);
  });

  it("addClamped respects per-resource caps", () => {
    const out = addClamped({ gold: 1500, wood: 0, stone: 0, food: 0 }, { gold: 500, wood: 200 }, { gold: 1600, wood: 1000, stone: 0, food: 0 });
    expect(out.gold).toBe(1600);
    expect(out.wood).toBe(200);
  });
});
