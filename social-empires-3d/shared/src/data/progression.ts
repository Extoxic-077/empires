import type { LevelDef } from "../types.js";

const LEVEL_TITLES = [
  "Wanderer",
  "Settler",
  "Hamlet Head",
  "Village Elder",
  "Town Reeve",
  "Squire",
  "Knight Errant",
  "Baron",
  "Viscount",
  "Count",
  "Marquess",
  "Duke",
  "Grand Duke",
  "Prince of Valia",
  "Emperor of the Aether",
];

function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(55 * Math.pow(level - 1, 1.62));
}

export const PLAYER_LEVELS: LevelDef[] = Array.from({ length: 30 }, (_, i) => {
  const level = i + 1;
  const title =
    level <= LEVEL_TITLES.length
      ? LEVEL_TITLES[level - 1]
      : `Ascendant ${level - LEVEL_TITLES.length}`;
  return {
    xpRequired: xpForLevel(level),
    title,
    reward:
      level % 5 === 0
        ? { gold: level * 120, stone: level * 40 }
        : level % 2 === 0
          ? { gold: level * 60 }
          : { wood: level * 45, food: level * 40 },
  };
});

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < PLAYER_LEVELS.length; i++) {
    if (xp >= PLAYER_LEVELS[i].xpRequired) level = i + 1;
    else break;
  }
  return level;
}

export function getXpProgress(xp: number): { level: number; into: number; needed: number } {
  const level = getLevelFromXp(xp);
  const currentFloor = PLAYER_LEVELS[level - 1].xpRequired;
  const nextReq =
    level < PLAYER_LEVELS.length
      ? PLAYER_LEVELS[level].xpRequired
      : currentFloor + Math.round(55 * Math.pow(level, 1.62));
  return { level, into: xp - currentFloor, needed: nextReq - currentFloor };
}
