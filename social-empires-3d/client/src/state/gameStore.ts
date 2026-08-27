import { create } from "zustand";
import type {
  BuildingInstanceDTO,
  QuestKind,
  ResourceAmounts,
  ResourceCost,
  ResourceKey,
  SaveFileV1,
  TrainingSlotDTO,
  UnitDefinition,
} from "@shared";
import {
  BUILD_AREA_MAX,
  BUILD_AREA_MIN,
  OFFLINE_CATCHUP_CAP_MS,
  PLAYER_LEVELS,
  QUEST_CHAIN,
  RESOURCE_KEYS,
  STARTING_RESOURCES,
  getBuildingDef,
  getLevelFromXp,
  getUnitDef,
} from "@shared";
import { toast } from "../lib/events";
import { canAfford } from "../lib/format";
import {
  addClamped,
  levelDef,
  nextLevelDef,
  popCapacity,
  popUsed,
  storageCaps,
} from "../game/economy/economy";

export interface TrainingSlot extends TrainingSlotDTO {}

export interface BuildingInstance extends BuildingInstanceDTO {
  queue: TrainingSlot[];
}

export interface UnitInstance {
  uid: string;
  unitId: string;
  trainedAt: number;
}

export interface QuestState {
  progress: number;
  claimed: boolean;
}

let uidCounter = 0;

function uid(): string {
  uidCounter += 1;
  return `e${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

export interface GameState {
  savedAt: number;
  playerName: string;
  xp: number;
  resources: ResourceAmounts;
  buildings: BuildingInstance[];
  units: UnitInstance[];
  quests: Record<string, QuestState>;
  counters: { placed: number; upgraded: number; trained: number; collected: number };

  hydrate: (save: SaveFileV1) => void;
  serialize: () => SaveFileV1;
  resetGame: () => void;

  placeBuilding: (defId: string, x: number, y: number, rot: number) => string | null;
  startUpgrade: (id: string) => void;
  demolish: (id: string) => void;

  enqueueTraining: (buildingId: string, unitId: string) => void;
  cancelTraining: (buildingId: string, slotUid: string) => void;

  finalizeAll: (now: number) => { gainedTotal: number };
  tickEconomy: (now: number) => number;
  claimQuest: (questId: string) => void;

  addResources: (gains: Partial<ResourceAmounts>) => void;
  questProgress: (kind: QuestKind, target: string, count: number) => void;
  addXpInternal: (amount: number) => void;
  completeConstruction: (id: string, now: number) => void;
  finalizeTraining: (buildingId: string, slotUid: string, now: number) => void;
}

const SAVE_VERSION = 1;
void SAVE_VERSION;

function freshQuests(): Record<string, QuestState> {
  const q: Record<string, QuestState> = {};
  for (const def of QUEST_CHAIN) q[def.id] = { progress: 0, claimed: false };
  return q;
}

function defaultCounters(): GameState["counters"] {
  return { placed: 0, upgraded: 0, trained: 0, collected: 0 };
}

function makeInitialBuildings(now: number): BuildingInstance[] {
  const def = getBuildingDef("townhall");
  const center = Math.floor((BUILD_AREA_MIN + BUILD_AREA_MAX) / 2);
  const x = center - Math.floor(def.width / 2);
  const y = center - Math.floor(def.depth / 2);
  return [
    {
      id: uid(),
      defId: def.id,
      x,
      y,
      rot: 0,
      level: 1,
      status: "ready",
      startedAt: now,
      durationMs: 0,
      lastTickAt: now,
      queue: [],
    },
  ];
}

function freshState(now: number): GameState {
  return {
    savedAt: now,
    playerName: "Emperor",
    xp: 0,
    resources: { ...STARTING_RESOURCES },
    buildings: makeInitialBuildings(now),
    units: [],
    quests: freshQuests(),
    counters: defaultCounters(),
  } as unknown as GameState;
}

function resolveB(id: string) {
  return getBuildingDef(id);
}

function resolveU(id: string): UnitDefinition {
  return getUnitDef(id);
}

function spend(resources: ResourceAmounts, cost: ResourceCost): ResourceAmounts {
  const out = { ...resources };
  for (const k of RESOURCE_KEYS) {
    const c = cost[k] ?? 0;
    if (c > 0) out[k] = out[k] - c;
  }
  return out;
}

function refundInto(list: Partial<ResourceAmounts>, cost: ResourceCost, ratio: number): void {
  for (const k of RESOURCE_KEYS) {
    const c = cost[k] ?? 0;
    if (c > 0) list[k] = (list[k] ?? 0) + Math.floor(c * ratio);
  }
}

export function missingFor(res: ResourceAmounts, cost: ResourceCost): Array<[ResourceKey, number]> {
  const out: Array<[ResourceKey, number]> = [];
  for (const k of RESOURCE_KEYS) {
    const need = (cost[k] ?? 0) - res[k];
    if (need > 0) out.push([k, Math.ceil(need)]);
  }
  return out;
}

export const useGame = create<GameState>()((set, get) => ({
  ...freshState(Date.now()),

  hydrate: (save) => {
    set((s) => ({
      savedAt: save.savedAt ?? Date.now(),
      playerName: save.playerName || s.playerName,
      xp: typeof save.xp === "number" ? save.xp : s.xp,
      resources: { ...s.resources, ...(save.resources ?? {}) },
      buildings:
        Array.isArray(save.buildings) && save.buildings.length > 0 ? save.buildings : s.buildings,
      units: Array.isArray(save.units) ? save.units : [],
      quests: { ...freshQuests(), ...(save.quests ?? {}) },
      counters: { ...defaultCounters(), ...(save.counters ?? {}) },
    }));
  },

  serialize: () => {
    const s = get();
    return {
      version: 1,
      savedAt: Date.now(),
      playerName: s.playerName,
      xp: s.xp,
      resources: s.resources,
      buildings: s.buildings,
      units: s.units,
      quests: s.quests,
      counters: s.counters,
    };
  },

  resetGame: () => {
    set({ ...freshState(Date.now()) } as GameState);
  },

  finalizeAll: (now) => {
    for (const b of get().buildings) {
      get().completeConstruction(b.id, now);
      for (let i = 0; i < 80; i++) {
        const cur = get().buildings.find((x) => x.id === b.id);
        if (!cur || cur.queue.length === 0) break;
        const head = cur.queue[0];
        if (head.startedAt === null) {
          const targetId = cur.id;
          useGame.setState((st) => ({
            buildings: st.buildings.map((x) =>
              x.id !== targetId
                ? x
                : { ...x, queue: x.queue.map((q, qi) => (qi === 0 ? { ...q, startedAt: now } : q)) },
            ),
          }));
          continue;
        }
        if (now >= head.startedAt + head.durationMs) {
          get().finalizeTraining(cur.id, head.uid, now);
          continue;
        }
        break;
      }
    }
    const gainedTotal = get().tickEconomy(now);
    return { gainedTotal };
  },

  placeBuilding: (defId, x, y, rot) => {
    const s = get();
    const def = getBuildingDef(defId);
    if (!canAfford(s.resources, def.levels[0].cost)) {
      toast(`Not enough resources for ${def.name}`, "error");
      return null;
    }
    const id = uid();
    const now = Date.now();
    const building: BuildingInstance = {
      id,
      defId,
      x,
      y,
      rot,
      level: 0,
      status: "construction",
      startedAt: now,
      durationMs: def.levels[0].buildTimeSec * 1000,
      lastTickAt: now,
      queue: [],
    };
    set({
      resources: spend(s.resources, def.levels[0].cost),
      buildings: [...s.buildings, building],
      counters: { ...s.counters, placed: s.counters.placed + 1 },
    });
    get().questProgress("place", defId, 1);
    return id;
  },

  startUpgrade: (id) => {
    const s = get();
    const b = s.buildings.find((x) => x.id === id);
    if (!b) return;
    if (b.status !== "ready") {
      toast("Building is busy", "error");
      return;
    }
    const def = getBuildingDef(b.defId);
    const nxt = nextLevelDef(def, b.level);
    if (!nxt) {
      toast(`${def.name} is already at maximum level`, "info");
      return;
    }
    if (!canAfford(s.resources, nxt.cost)) {
      toast(`Not enough resources to upgrade ${def.name}`, "error");
      return;
    }
    const now = Date.now();
    set({
      resources: spend(s.resources, nxt.cost),
      buildings: s.buildings.map((x) =>
        x.id === id
          ? { ...x, status: "upgrade", startedAt: now, durationMs: nxt.buildTimeSec * 1000 }
          : x,
      ),
      counters: { ...s.counters, upgraded: s.counters.upgraded + 1 },
    });
  },

  demolish: (id) => {
    const s = get();
    const b = s.buildings.find((x) => x.id === id);
    if (!b) return;
    const def = getBuildingDef(b.defId);
    if (def.category === "core") {
      toast("The Imperial Keep cannot be demolished", "error");
      return;
    }
    const refund: Partial<ResourceAmounts> = {};
    if (b.level > 0) refundInto(refund, levelDef(def, b.level).cost, def.demolishRefundRatio);
    for (const slot of b.queue) {
      const ud = getUnitDef(slot.unitId);
      refundInto(refund, ud.cost, slot.startedAt === null ? 1 : 0.5);
    }
    const caps = storageCaps(s.buildings.filter((x) => x.id !== id), resolveB);
    set({
      buildings: s.buildings.filter((x) => x.id !== id),
      resources: addClamped(s.resources, refund, caps),
    });
    toast(`${def.name} dismantled`, "info");
  },

  enqueueTraining: (buildingId, unitId) => {
    const s = get();
    const b = s.buildings.find((x) => x.id === buildingId);
    if (!b || b.status !== "ready") return;
    const def = getBuildingDef(b.defId);
    if (!def.trainsUnitIds?.includes(unitId)) return;
    const ud = getUnitDef(unitId);
    const lvl = getLevelFromXp(s.xp);
    if (lvl < ud.unlockLevel) {
      toast(`${ud.name} unlocks at empire level ${ud.unlockLevel}`, "error");
      return;
    }
    const popFree = popCapacity(s.buildings, resolveB) - popUsed(s.units, resolveU);
    if ((ud.cost.pop ?? 0) > popFree) {
      toast("Not enough population — upgrade your Keep", "error");
      return;
    }
    if (!canAfford(s.resources, ud.cost)) {
      toast(`Not enough resources for ${ud.name}`, "error");
      return;
    }
    const now = Date.now();
    const activeExists = b.queue.some((q) => q.startedAt !== null);
    const slot: TrainingSlot = {
      uid: uid(),
      unitId,
      startedAt: activeExists ? null : now,
      durationMs: ud.trainTimeSec * 1000,
    };
    set({
      resources: spend(s.resources, ud.cost),
      buildings: s.buildings.map((x) =>
        x.id === buildingId ? { ...x, queue: [...x.queue, slot] } : x,
      ),
    });
  },

  cancelTraining: (buildingId, slotUid) => {
    const s = get();
    const b = s.buildings.find((x) => x.id === buildingId);
    if (!b) return;
    const slot = b.queue.find((q) => q.uid === slotUid);
    if (!slot) return;
    const refund: Partial<ResourceAmounts> = {};
    refundInto(refund, getUnitDef(slot.unitId).cost, slot.startedAt === null ? 1 : 0.5);
    const caps = storageCaps(s.buildings, resolveB);
    set({
      resources: addClamped(s.resources, refund, caps),
      buildings: s.buildings.map((x) => {
        if (x.id !== buildingId) return x;
        const idx = x.queue.findIndex((q) => q.uid === slotUid);
        const queue = x.queue.filter((_, i) => i !== idx);
        if (idx === 0 && queue.length > 0) queue[0] = { ...queue[0], startedAt: Date.now() };
        return { ...x, queue };
      }),
    });
  },

  tickEconomy: (now) => {
    const s = get();
    const caps = storageCaps(s.buildings, resolveB);
    let gained = 0;
    let changed = false;
    const res = { ...s.resources };
    const buildings = s.buildings.map((b) => {
      if (b.status !== "ready") return b;
      const def = getBuildingDef(b.defId);
      const prod = levelDef(def, b.level).production;
      if (!prod) return b;
      const dt = Math.min(Math.max(now - b.lastTickAt, 0), OFFLINE_CATCHUP_CAP_MS);
      if (dt < 250) return b;
      let buildingGained = 0;
      for (const k of RESOURCE_KEYS) {
        const rate = prod[k] ?? 0;
        if (rate <= 0) continue;
        const g = Math.min((rate * dt) / 60000, Math.max(0, caps[k] - res[k]));
        if (g <= 0) continue;
        res[k] += g;
        gained += g;
        buildingGained += g;
      }
      if (buildingGained > 0) {
        changed = true;
        return { ...b, lastTickAt: now };
      }
      return b;
    });
    if (!changed) return 0;
    set({ resources: res, buildings });
    return gained;
  },

  claimQuest: (questId) => {
    const s = get();
    const st = s.quests[questId];
    const def = QUEST_CHAIN.find((q) => q.id === questId);
    if (!st || !def || st.claimed || st.progress < def.count) return;
    const caps = storageCaps(s.buildings, resolveB);
    const resGains: Partial<ResourceAmounts> = {};
    for (const k of RESOURCE_KEYS) {
      const v = def.rewards[k] ?? 0;
      if (v > 0) resGains[k] = v;
    }
    set({
      quests: { ...s.quests, [questId]: { ...st, claimed: true } },
      resources: addClamped(s.resources, resGains, caps),
    });
    if (def.rewards.xp) get().addXpInternal(def.rewards.xp);
    toast(`Quest complete: ${def.title}`, "success");
  },

  addResources: (gains) => {
    const s = get();
    const caps = storageCaps(s.buildings, resolveB);
    set({ resources: addClamped(s.resources, gains, caps) });
  },

  questProgress: (kind, target, count) => {
    const s = get();
    let updated: Record<string, QuestState> | null = null;
    for (const def of QUEST_CHAIN) {
      if (def.kind !== kind) continue;
      if (def.target !== "*" && def.target !== target) continue;
      const st: QuestState | undefined = updated ? updated[def.id] : s.quests[def.id];
      if (!st || st.claimed || st.progress >= def.count) continue;
      const next = Math.min(def.count, st.progress + count);
      const entry: QuestState = { ...st, progress: next };
      updated = { ...(updated ?? s.quests), [def.id]: entry };
      if (next >= def.count) toast(`Objective met: ${def.title}`, "success");
    }
    if (updated) set({ quests: updated });
  },

  addXpInternal: (amount) => {
    const s = get();
    if (amount <= 0) return;
    const before = getLevelFromXp(s.xp);
    const xp = s.xp + amount;
    const after = getLevelFromXp(xp);
    set({ xp });
    if (after > before) {
      for (let lvl = before + 1; lvl <= after; lvl++) {
        const info = PLAYER_LEVELS[Math.min(lvl, PLAYER_LEVELS.length) - 1];
        const gains: Partial<ResourceAmounts> = {};
        for (const k of RESOURCE_KEYS) {
          const v = info.reward[k] ?? 0;
          if (v > 0) gains[k] = v;
        }
        if (Object.keys(gains).length > 0) get().addResources(gains);
        toast(`Empire level ${lvl} — ${info.title}!`, "success");
      }
    }
    const lvlNow = getLevelFromXp(get().xp);
    get().questProgress("level", String(lvlNow), 1);
  },

  completeConstruction: (id, now) => {
    const s = get();
    const b = s.buildings.find((x) => x.id === id);
    if (!b) return;
    if (b.status !== "construction" && b.status !== "upgrade") return;
    if (now < b.startedAt + b.durationMs) return;
    const def = getBuildingDef(b.defId);
    const wasUpgrade = b.status === "upgrade";
    const newLevel = wasUpgrade ? b.level + 1 : 1;
    const reached = levelDef(def, newLevel);
    set({
      buildings: s.buildings.map((x) =>
        x.id === id ? { ...x, level: newLevel, status: "ready", lastTickAt: now } : x,
      ),
    });
    get().addXpInternal(reached.xpReward);
    if (wasUpgrade) get().questProgress("upgrade", b.defId, 1);
    toast(
      wasUpgrade ? `${def.name} upgraded to level ${newLevel}` : `${def.name} construction complete`,
      "success",
    );
  },

  finalizeTraining: (buildingId, slotUid, now) => {
    const s = get();
    const b = s.buildings.find((x) => x.id === buildingId);
    if (!b) return;
    const slot = b.queue.find((q) => q.uid === slotUid);
    if (!slot) return;
    const def = getUnitDef(slot.unitId);
    const unit: UnitInstance = { uid: uid(), unitId: slot.unitId, trainedAt: now };
    const queue = b.queue.filter((q) => q.uid !== slotUid);
    if (queue.length > 0) queue[0] = { ...queue[0], startedAt: now };
    set({
      units: [...s.units, unit],
      buildings: s.buildings.map((x) => (x.id === buildingId ? { ...x, queue } : x)),
      counters: { ...s.counters, trained: s.counters.trained + 1 },
    });
    get().addXpInternal(def.xpReward);
    get().questProgress("train", slot.unitId, 1);
    toast(`${def.name} ready for duty`, "success");
  },
}));
