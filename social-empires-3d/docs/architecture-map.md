# Aether Empires — Source Archaeology & Migration Plan

## M0 — OLD SYSTEM MAP (`AcidCaos/socialemperors`, Flash preservation server)

The repository is a Python/Flask reimplementation of the Social Empires backend that serves
the original SWF client. Gameplay truth lives in three places:

| Old artifact | Purpose |
|---|---|
| `config/game_config_*.json` | Data bible: `items` (buildings AND units share one schema), `levels`, `missions`, `expansion_prices`, `globals` |
| `command.py` | Command protocol executed against a session save |
| `engine.py` | Pure economy kernels: `apply_cost`, `apply_collect`, `apply_collect_xp` |
| `sessions.py` | Village saves (`playerInfo` + `maps[]` + `privateState`), neighbor villages |
| `constants.py` | Enums: categories, commands, animations, AI states, factions |

### Key discovered rules

```text
ITEM SCHEMA (unified building/unit)
  id, name, type("b"|"u"), cost/cost_type(w|g|s|f|c), xp
  collect/collect_type/collect_xp + activation(seconds cycle)   → harvest economy
  min_level            → unlock gate
  width/height         → grid footprint
  upgrades_to          → linear upgrade chains (House I→II→III…)
  trains               → building produces unit id
  population           → pop cap contribution (buildings) / pop cost (units)
  attack/defense/life/velocity/attack_range/attack_interval, flying, race(h|t|e)

COMMANDS: buy(place), move, orient, collect_new, sell(-5% refund), kill,
          upgrade-chain, expand(land), push/pop_unit(garrison),
          complete_mission/reward_mission, rt_level_up/publish_score,
          start/end_quest(battle report {win,gold,xp,duration}), set_strategy(AI doctrine)

SAVE: maps[0]{coins,wood,stone,food,xp,level,items[[id,x,y,orient,collected_at,level,units]]}

LEVELS: named tiers (Slave→…) with exp_required + reward per level
AI: COLLECTIVEIA states (bandits patrol/assault, village siege doctrines, army wave+retreat)
MODES: tutorial, normal, neighbour, assault(PvP), campaign quests, survival
```

## SYSTEM → NEW IMPLEMENTATION MAPPING

```text
OLD                                   → PURPOSE                    → NEW 3D IMPLEMENTATION
items[] unified schema                → data-driven content        → shared/game-data definitions
                                                                       (BuildingDefinition.levels[],
                                                                        UnitDefinition) — no hardcoded numbers
cost/cost_type + apply_cost           → spending kernel            → economy.trySpend(cost) pure fn,
                                                                       validated centrally (server-ready)
collect/activation cycle              → harvest timers             → auto-income ticks + offline catch-up
                                                                       (lastTickAt epoch per building)
upgrades_to chains                    → progression per building   → BuildingDefinition.levels[] with
                                                                       visible model evolution per level
min_level                             → unlock gating              → unlockLevel + LEVELS table
                                                                       (xp_required, title, reward)
maps[].items [[id,x,y,orient,…]]      → empire layout              → BuildingInstance{x,y,rot,level,status}
population                            → pop cap / unit upkeep      → popCap(TownHall)+popUsed(units)
sell (-5%)                            → demolish refund            → demolishRefundRatio per definition
push/pop_unit                         → garrison                   → training queue + garrisoned army
rt_level_up + publish_score           → client-computed XP         → authoritative xp ledger + events bus
end_quest {win,gold,xp}               → battle reports             → battle module consumes same defs (M4)
COLLECTIVEIA_*                        → enemy AI doctrines         → behavior config objects (aggression,
                                                                       focus, retreat thresholds) in AI FSM
sessions.py JSON saves                → persistence                → SaveService: localStorage autosave +
                                                                       Node save-server (/api/save) sync
```

## NEW STACK

TypeScript strict · Vite · React 18 · Three.js · @react-three/fiber · Zustand
(shared data/types package · Node zero-dep save server · Vitest for gameplay math)

## RUN

```bash
npm install
npm run dev        # client → http://localhost:5173
npm run server     # optional save-sync API → http://localhost:8787
npm test           # gameplay math tests (client workspace)
```

## DEVELOPMENT ORDER TRACKED

M1 empire foundation → M2 living empire → M3 army/training → M4+ combat/progression
(combat reuses UnitDefinition stats + A* grid already shipped in M1-M3).
