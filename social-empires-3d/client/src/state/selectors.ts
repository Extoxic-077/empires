import type { ResourceAmounts, ResourceKey } from "@shared";
import { BUILDING_DEFS_BY_ID, PLAYER_LEVELS, UNIT_DEFS_BY_ID, RESOURCE_KEYS, getXpProgress } from "@shared";
import { incomePerMinute, popCapacity, popUsed, storageCaps } from "../game/economy/economy";
import { useGame } from "./gameStore";
import { useShallow } from "zustand/react/shallow";

export function useStorageCaps(): ResourceAmounts {
  return useGame(useShallow((s) => storageCaps(s.buildings, (id) => BUILDING_DEFS_BY_ID.get(id)!)));
}

export function useIncomePerMin(): ResourceAmounts {
  return useGame(useShallow((s) => incomePerMinute(s.buildings, (id) => BUILDING_DEFS_BY_ID.get(id)!)));
}

export function usePopInfo(): { cap: number; used: number } {
  return useGame(useShallow((s) => {
    const cap = popCapacity(s.buildings, (id) => BUILDING_DEFS_BY_ID.get(id)!);
    const used = popUsed(s.units, (id) => UNIT_DEFS_BY_ID.get(id)!);
    return { cap, used };
  }));
}

export interface LevelInfo {
  level: number;
  title: string;
  into: number;
  needed: number;
}

export function useLevelInfo(): LevelInfo {
  return useGame(useShallow((s) => {
    const xp = s.xp;
    const p = getXpProgress(xp);
    const idx = Math.min(p.level, PLAYER_LEVELS.length) - 1;
    const entry = PLAYER_LEVELS[idx];
    return { ...p, title: entry ? entry.title : "Ascendant" };
  }));
}