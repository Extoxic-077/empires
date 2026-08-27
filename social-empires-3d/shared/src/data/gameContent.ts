export const GAME_CONTENT = {
  title: "Aether Empires",
  tagline: "Build. Defend. Conquer.",
  starterResources: { gold: 520, wood: 420, stone: 180, food: 360 },
  starterBuildings: ["townhall"],
  progression: [
    { level: 1, name: "Frontier", unlocks: ["lumbermill", "goldmine", "farm"] },
    { level: 2, name: "Settlement", unlocks: ["storehouse"] },
    { level: 3, name: "Stronghold", unlocks: ["quarry", "barracks", "wall"] },
    { level: 4, name: "Kingdom", unlocks: ["archery", "watchtower"] },
    { level: 6, name: "Arcane Realm", unlocks: ["wizardtower"] },
  ],
} as const;

export const STARTER_TIPS = [
  "Place a Sawmill first — wood unlocks rapid expansion.",
  "Keep your food production ahead of your army.",
  "Upgrade the Imperial Keep to unlock stronger infrastructure.",
  "Walls are cheap. Rebuilding a kingdom is not.",
] as const;
