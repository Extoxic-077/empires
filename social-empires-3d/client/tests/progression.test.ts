import { describe, expect, it } from "vitest";
import {
  BUILDING_DEFS_BY_ID,
  PLAYER_LEVELS,
  getLevelFromXp,
  getXpProgress,
  QUEST_CHAIN,
} from "@shared";

describe("progression", () => {
  it("has strictly increasing xp thresholds", () => {
    for (let i = 1; i < PLAYER_LEVELS.length; i++) {
      expect(PLAYER_LEVELS[i].xpRequired).toBeGreaterThan(PLAYER_LEVELS[i - 1].xpRequired);
    }
  });

  it("maps xp to the correct level band", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(PLAYER_LEVELS[4].xpRequired)).toBe(5);
    expect(getLevelFromXp(PLAYER_LEVELS[4].xpRequired - 1)).toBe(4);
  });

  it("computes progress within a level", () => {
    const p = getXpProgress(PLAYER_LEVELS[2].xpRequired + 10);
    expect(p.level).toBe(3);
    expect(p.into).toBe(10);
    expect(p.needed).toBeGreaterThan(0);
  });

  it("quest chain targets existing content", () => {
    for (const q of QUEST_CHAIN) {
      if ((q.kind === "place" || q.kind === "upgrade") && q.target !== "*") {
        const def = BUILDING_DEFS_BY_ID.get(q.target);
        expect(def, `quest ${q.id} references missing building`).toBeDefined();
      }
      if (q.kind === "train" && q.target !== "*") {
        expect(BUILDING_DEFS_BY_ID.get("barracks")?.trainsUnitIds).toContain(q.target);
      }
      expect(q.count).toBeGreaterThan(0);
    }
  });
});
