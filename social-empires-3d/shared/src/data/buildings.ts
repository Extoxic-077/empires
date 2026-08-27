import type { BuildingDefinition } from "../types.js";

export const BUILDING_DEFINITIONS: BuildingDefinition[] = [
  {
    id: "townhall",
    name: "Imperial Keep",
    description:
      "Heart of your empire. Raises storage limits and population cap, and anchors every road in the realm.",
    category: "core",
    width: 4,
    depth: 4,
    unlockLevel: 1,
    demolishRefundRatio: 0,
    levels: [
      {
        cost: { gold: 0, wood: 0 },
        buildTimeSec: 6,
        storage: { gold: 1600, wood: 1600, stone: 1100, food: 1600 },
        popCapacity: 8,
        xpReward: 20,
      },
      {
        cost: { gold: 380, wood: 260, stone: 130 },
        buildTimeSec: 30,
        storage: { gold: 2600, wood: 2600, stone: 1800, food: 2600 },
        popCapacity: 14,
        xpReward: 45,
      },
      {
        cost: { gold: 950, wood: 720, stone: 480 },
        buildTimeSec: 60,
        storage: { gold: 4200, wood: 4200, stone: 3000, food: 4200 },
        popCapacity: 22,
        xpReward: 100,
      },
      {
        cost: { gold: 2300, wood: 1750, stone: 1150 },
        buildTimeSec: 120,
        storage: { gold: 7000, wood: 7000, stone: 5000, food: 7000 },
        popCapacity: 32,
        xpReward: 200,
      },
    ],
  },
  {
    id: "lumbermill",
    name: "Sawmill",
    description: "Seasoned lumberjacks fell the border woods. Produces wood over time.",
    category: "resource",
    width: 2,
    depth: 2,
    unlockLevel: 1,
    demolishRefundRatio: 0.25,
    levels: [
      { cost: { gold: 80, food: 40 }, buildTimeSec: 8, production: { wood: 10 }, xpReward: 12 },
      { cost: { gold: 210, stone: 60 }, buildTimeSec: 18, production: { wood: 16 }, xpReward: 26 },
      { cost: { gold: 540, stone: 190 }, buildTimeSec: 36, production: { wood: 26 }, xpReward: 58 },
      { cost: { gold: 1350, stone: 500 }, buildTimeSec: 72, production: { wood: 42 }, xpReward: 120 },
    ],
  },
  {
    id: "goldmine",
    name: "Gold Mine",
    description: "Deep seams of royal gold. Miners haul up coin around the clock.",
    category: "resource",
    width: 2,
    depth: 2,
    unlockLevel: 1,
    demolishRefundRatio: 0.25,
    levels: [
      { cost: { wood: 100, food: 50 }, buildTimeSec: 8, production: { gold: 9 }, xpReward: 12 },
      { cost: { wood: 240, stone: 80 }, buildTimeSec: 18, production: { gold: 15 }, xpReward: 26 },
      { cost: { wood: 620, stone: 230 }, buildTimeSec: 36, production: { gold: 24 }, xpReward: 58 },
      { cost: { wood: 1550, stone: 570 }, buildTimeSec: 72, production: { gold: 38 }, xpReward: 120 },
    ],
  },
  {
    id: "farm",
    name: "Homestead Farm",
    description: "Golden fields tended by windmill. Feeds workers and armies alike.",
    category: "resource",
    width: 2,
    depth: 2,
    unlockLevel: 1,
    demolishRefundRatio: 0.25,
    levels: [
      { cost: { gold: 70, wood: 60 }, buildTimeSec: 8, production: { food: 8 }, xpReward: 12 },
      { cost: { gold: 180, wood: 150 }, buildTimeSec: 18, production: { food: 14 }, xpReward: 26 },
      { cost: { gold: 480, wood: 400 }, buildTimeSec: 36, production: { food: 23 }, xpReward: 58 },
      { cost: { gold: 1200, wood: 1000 }, buildTimeSec: 72, production: { food: 37 }, xpReward: 120 },
    ],
  },
  {
    id: "quarry",
    name: "Stone Quarry",
    description: "Cuts pale granite from the ridge. Walls and towers are hungry for it.",
    category: "resource",
    width: 2,
    depth: 2,
    unlockLevel: 3,
    demolishRefundRatio: 0.25,
    levels: [
      { cost: { gold: 150, wood: 120 }, buildTimeSec: 10, production: { stone: 7 }, xpReward: 16 },
      { cost: { gold: 380, wood: 300 }, buildTimeSec: 22, production: { stone: 12 }, xpReward: 32 },
      { cost: { gold: 950, wood: 780 }, buildTimeSec: 44, production: { stone: 19 }, xpReward: 66 },
      { cost: { gold: 2400, wood: 1950 }, buildTimeSec: 88, production: { stone: 30 }, xpReward: 135 },
    ],
  },
  {
    id: "storehouse",
    name: "Storehouse",
    description: "Reinforced vaults that expand how much of each resource your empire can hoard.",
    category: "special",
    width: 2,
    depth: 2,
    unlockLevel: 2,
    demolishRefundRatio: 0.25,
    levels: [
      {
        cost: { gold: 220, wood: 160, stone: 90 },
        buildTimeSec: 14,
        storage: { gold: 900, wood: 900, stone: 700, food: 900 },
        xpReward: 20,
      },
      {
        cost: { gold: 600, wood: 430, stone: 260 },
        buildTimeSec: 30,
        storage: { gold: 2000, wood: 2000, stone: 1500, food: 2000 },
        xpReward: 45,
      },
      {
        cost: { gold: 1500, wood: 1100, stone: 700 },
        buildTimeSec: 60,
        storage: { gold: 4200, wood: 4200, stone: 3200, food: 4200 },
        xpReward: 95,
      },
    ],
  },
  {
    id: "barracks",
    name: "Warrior Barracks",
    description:
      "Drills spearmen and knights — and quietly hires brutish mercenaries for the right coin.",
    category: "military",
    width: 3,
    depth: 3,
    unlockLevel: 3,
    demolishRefundRatio: 0.25,
    trainsUnitIds: ["spearman", "knight", "goblin", "orc", "giant"],
    levels: [
      { cost: { gold: 190, wood: 150 }, buildTimeSec: 16, popCapacity: 2, xpReward: 30 },
      { cost: { gold: 520, wood: 420, stone: 120 }, buildTimeSec: 34, popCapacity: 3, xpReward: 62 },
      { cost: { gold: 1250, wood: 1000, stone: 350 }, buildTimeSec: 68, popCapacity: 4, xpReward: 130 },
    ],
  },
  {
    id: "archery",
    name: "Archery Range",
    description: "Longbows stacked in racks, targets down the lawn. Trains archers.",
    category: "military",
    width: 2,
    depth: 2,
    unlockLevel: 4,
    demolishRefundRatio: 0.25,
    trainsUnitIds: ["archer"],
    levels: [
      { cost: { gold: 240, wood: 210 }, buildTimeSec: 18, popCapacity: 1, xpReward: 34 },
      { cost: { gold: 640, wood: 560, stone: 140 }, buildTimeSec: 38, popCapacity: 2, xpReward: 70 },
      { cost: { gold: 1500, wood: 1320, stone: 380 }, buildTimeSec: 76, popCapacity: 3, xpReward: 145 },
    ],
  },
  {
    id: "wizardtower",
    name: "Arcane Spire",
    description:
      "Crackling with ley-light. Trains battle mages, clerics — one day, a dragon sleeps here.",
    category: "military",
    width: 2,
    depth: 2,
    unlockLevel: 6,
    demolishRefundRatio: 0.25,
    trainsUnitIds: ["mage", "cleric", "drake"],
    levels: [
      { cost: { gold: 800, wood: 300, stone: 450 }, buildTimeSec: 30, popCapacity: 1, xpReward: 70 },
      {
        cost: { gold: 1800, wood: 650, stone: 950 },
        buildTimeSec: 60,
        popCapacity: 2,
        xpReward: 140,
      },
      {
        cost: { gold: 3600, wood: 1300, stone: 1900 },
        buildTimeSec: 110,
        popCapacity: 4,
        xpReward: 280,
      },
    ],
  },
  {
    id: "watchtower",
    name: "Watchtower",
    description: "A keen-eyed garrison post. Raiders think twice beneath its beacon.",
    category: "defense",
    width: 1,
    depth: 1,
    unlockLevel: 4,
    demolishRefundRatio: 0.25,
    levels: [
      { cost: { stone: 120, wood: 40 }, buildTimeSec: 12, xpReward: 24 },
      { cost: { stone: 320, wood: 100 }, buildTimeSec: 26, xpReward: 52 },
      { cost: { stone: 820, wood: 240 }, buildTimeSec: 52, xpReward: 110 },
    ],
  },
  {
    id: "wall",
    name: "Stone Wall",
    description: "A sturdy segment of curtain wall. Chain them to shield your empire.",
    category: "defense",
    width: 1,
    depth: 1,
    unlockLevel: 3,
    demolishRefundRatio: 0.5,
    levels: [
      { cost: { stone: 10 }, buildTimeSec: 2, xpReward: 2 },
      { cost: { stone: 25 }, buildTimeSec: 4, xpReward: 5 },
      { cost: { stone: 60, gold: 30 }, buildTimeSec: 8, xpReward: 12 },
    ],
  },
];

export const BUILDING_DEFS_BY_ID: ReadonlyMap<string, BuildingDefinition> = new Map(
  BUILDING_DEFINITIONS.map((d) => [d.id, d]),
);

export function getBuildingDef(id: string): BuildingDefinition {
  const def = BUILDING_DEFS_BY_ID.get(id);
  if (!def) throw new Error(`Unknown building definition: ${id}`);
  return def;
}
