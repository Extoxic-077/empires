export type ResourceKey = "gold" | "wood" | "stone" | "food";

export type ResourceAmounts = Record<ResourceKey, number>;

export type ResourceCost = Partial<ResourceAmounts>;

export type CostWithPop = ResourceCost & { pop?: number };

export type BuildingCategory = "core" | "resource" | "military" | "defense" | "special";

export interface BuildingLevelDef {
  cost: ResourceCost;
  buildTimeSec: number;
  production?: Partial<ResourceAmounts>;
  storage?: Partial<ResourceAmounts>;
  popCapacity?: number;
  xpReward: number;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  category: BuildingCategory;
  width: number;
  depth: number;
  unlockLevel: number;
  levels: BuildingLevelDef[];
  demolishRefundRatio: number;
  trainsUnitIds?: string[];
}

export interface UnitStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  attackIntervalSec: number;
}

export type UnitRole = "melee" | "ranged" | "support" | "boss";
export type UnitFaction = "kingdom" | "horde";

export interface UnitDefinition {
  id: string;
  name: string;
  description: string;
  faction: UnitFaction;
  role: UnitRole;
  stats: UnitStats;
  cost: CostWithPop;
  trainTimeSec: number;
  unlockLevel: number;
  abilities: string[];
  xpReward: number;
  scale: number;
  colors: { primary: string; secondary: string; accent: string };
}

export interface LevelDef {
  xpRequired: number;
  title: string;
  reward: ResourceCost;
}

export type QuestKind = "place" | "upgrade" | "train" | "collect" | "level";

export interface QuestRewards extends ResourceCost {
  xp?: number;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  kind: QuestKind;
  target: string;
  count: number;
  rewards: QuestRewards;
}

export interface BuildingInstanceDTO {
  id: string;
  defId: string;
  x: number;
  y: number;
  rot: number;
  level: number;
  status: "construction" | "ready" | "upgrade";
  startedAt: number;
  durationMs: number;
  lastTickAt: number;
  queue: TrainingSlotDTO[];
}

export interface TrainingSlotDTO {
  uid: string;
  unitId: string;
  startedAt: number | null;
  durationMs: number;
}

export interface UnitInstanceDTO {
  uid: string;
  unitId: string;
  trainedAt: number;
}

export interface SaveFileV1 {
  version: 1;
  savedAt: number;
  playerName: string;
  xp: number;
  resources: ResourceAmounts;
  buildings: BuildingInstanceDTO[];
  units: UnitInstanceDTO[];
  quests: Record<string, { progress: number; claimed: boolean }>;
  counters: { placed: number; upgraded: number; trained: number; collected: number };
}
