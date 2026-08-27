import type { ResourceAmounts, ResourceCost, ResourceKey } from "./types.js";

export const RESOURCE_KEYS: readonly ResourceKey[] = ["gold", "wood", "stone", "food"];

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  gold: "Gold",
  wood: "Wood",
  stone: "Stone",
  food: "Food",
};

export const RESOURCE_COLORS: Record<ResourceKey, string> = {
  gold: "#ffc93c",
  wood: "#a97142",
  stone: "#9aa5b1",
  food: "#7ed957",
};

export const TILE_SIZE = 2;

export const GRID_HALF_EXTENT = 21;

export const BUILD_AREA_MIN = 10;
export const BUILD_AREA_MAX = 33;

export const STARTING_RESOURCES: ResourceAmounts = {
  gold: 650,
  wood: 550,
  stone: 320,
  food: 420,
};

export const OFFLINE_CATCHUP_CAP_MS = 8 * 60 * 60 * 1000;

export const ECONOMY_TICK_MS = 1000;

export const DEMOLISH_REFUND_RATIO_DEFAULT = 0.25;

export function emptyCost(): Required<ResourceCost> {
  return { gold: 0, wood: 0, stone: 0, food: 0 };
}

export function costEntries(cost: ResourceCost): Array<[ResourceKey, number]> {
  return RESOURCE_KEYS.filter((k) => (cost[k] ?? 0) > 0).map((k) => [k, cost[k] as number]);
}
