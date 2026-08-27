import type {
  BuildingDefinition,
  BuildingInstanceDTO,
  ResourceAmounts,
  ResourceKey,
  UnitDefinition,
} from "@shared";
import { RESOURCE_KEYS } from "@shared";

export interface BuildingLike {
  defId: string;
  level: number;
  status: string;
}

export interface UnitLike {
  unitId: string;
}

export function levelDef(def: BuildingDefinition, level: number) {
  const idx = Math.min(Math.max(level, 1), def.levels.length) - 1;
  return def.levels[idx];
}

export function nextLevelDef(def: BuildingDefinition, level: number) {
  if (level >= def.levels.length) return null;
  return def.levels[level];
}

export function productionAt(def: BuildingDefinition, level: number): Partial<ResourceAmounts> {
  return levelDef(def, level).production ?? {};
}

export function storageAt(def: BuildingDefinition, level: number): Partial<ResourceAmounts> {
  return levelDef(def, level).storage ?? {};
}

export function popCapacityAt(def: BuildingDefinition, level: number): number {
  return levelDef(def, level).popCapacity ?? 0;
}

export function accrue(ratePerMin: number, dtMs: number): number {
  if (ratePerMin <= 0 || dtMs <= 0) return 0;
  return (ratePerMin * dtMs) / 60000;
}

export function clampGain(current: number, cap: number, gain: number): number {
  if (gain <= 0) return 0;
  const room = cap - current;
  if (room <= 0) return 0;
  return Math.min(gain, room);
}

export function storageCaps(buildings: BuildingLike[], resolve: (id: string) => BuildingDefinition): ResourceAmounts {
  const caps: ResourceAmounts = { gold: 0, wood: 0, stone: 0, food: 0 };
  for (const b of buildings) {
    if (b.status !== "ready") continue;
    const st = storageAt(resolve(b.defId), b.level);
    for (const k of RESOURCE_KEYS) caps[k] += st[k] ?? 0;
  }
  return caps;
}

export function popCapacity(buildings: BuildingLike[], resolve: (id: string) => BuildingDefinition): number {
  let cap = 0;
  for (const b of buildings) {
    if (b.status !== "ready") continue;
    cap += popCapacityAt(resolve(b.defId), b.level);
  }
  return cap;
}

export function popUsed(units: UnitLike[], resolve: (id: string) => UnitDefinition): number {
  let used = 0;
  for (const u of units) used += resolve(u.unitId).cost.pop ?? 0;
  return used;
}

export function incomePerMinute(
  buildings: BuildingLike[],
  resolve: (id: string) => BuildingDefinition,
): ResourceAmounts {
  const inc: ResourceAmounts = { gold: 0, wood: 0, stone: 0, food: 0 };
  for (const b of buildings) {
    if (b.status !== "ready") continue;
    const prod = productionAt(resolve(b.defId), b.level);
    for (const k of RESOURCE_KEYS) inc[k] += prod[k] ?? 0;
  }
  return inc;
}

export function addClamped(
  amounts: ResourceAmounts,
  gains: Partial<ResourceAmounts>,
  caps: ResourceAmounts,
): ResourceAmounts {
  const out: ResourceAmounts = { ...amounts };
  for (const k of RESOURCE_KEYS) {
    const g = gains[k] ?? 0;
    if (g <= 0) continue;
    out[k] = Math.min(out[k] + g, caps[k]);
  }
  return out;
}
