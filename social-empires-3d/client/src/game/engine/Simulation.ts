import { TILE_SIZE, getBuildingDef } from "@shared";
import { levelDef } from "../economy/economy";
import { buildingCenterWorld, footprintSize, GRID_N } from "../buildings/placement";
import {
  createNavGrid,
  findPath,
  isBlocked,
  setRectBlocked,
  type NavGrid,
  type PathNode,
} from "../pathfinding/astar";
import { useGame, type BuildingInstance } from "../../state/gameStore";
import { gameEvents } from "../../lib/events";
import { fmt } from "../../lib/format";

export type AgentActivity = "idle" | "walk" | "work";

export interface AgentCtrl {
  x: number;
  z: number;
  facing: number;
  phase: number;
  activity: AgentActivity;
  visible: boolean;
}

interface Villager {
  id: number;
  ctrl: AgentCtrl;
  homeIdx: number;
  path: PathNode[];
  wp: Array<[number, number]>;
  seg: number;
  speed: number;
  timer: number;
  intent: "work" | "wander" | "home";
  stuckTime: number;
  lastProgress: number;
}

export const MAX_VILLAGERS = 11;

function randRange(rnd: () => number, a: number, b: number): number {
  return a + rnd() * (b - a);
}

function tileCenterWorld(i: number, j: number): [number, number] {
  return [(i - GRID_N / 2 + 0.5) * TILE_SIZE, (j - GRID_N / 2 + 0.5) * TILE_SIZE];
}

function workSpotFor(b: BuildingInstance): [number, number] {
  const def = getBuildingDef(b.defId);
  const { w, d } = footprintSize(def, b.rot);
  const sides: Array<[number, number]> = [
    [b.x + w, b.y + ((d / 2) | 0)],
    [b.x - 1, b.y + ((d / 2) | 0)],
    [b.x + ((w / 2) | 0), b.y + d],
    [b.x + ((w / 2) | 0), b.y - 1],
  ];
  const pick = sides[Math.floor(Math.random() * sides.length)];
  const spot = tileCenterWorld(pick[0], pick[1]);
  if (!isBlocked(sim.grid, pick[0], pick[1])) return spot;
  return tileCenterWorld(b.x + w, b.y);
}

let simInstance: Simulation | null = null;

export class Simulation {
  grid: NavGrid = createNavGrid(GRID_N, GRID_N);
  villagers: Villager[] = [];

  private navDirty = true;
  private ecoAccum = 0;
  private reconcileAccum = 0;
  private nextId = 1;
  private rnd = Math.random;
  private unsub?: () => void;

  attachStoreListener(): void {
    if (this.unsub) return;
    let prevBuildings = useGame.getState().buildings;
    this.unsub = useGame.subscribe((s) => {
      if (s.buildings !== prevBuildings) {
        prevBuildings = s.buildings;
        this.navDirty = true;
      }
    });
  }

  rebuildNav(): void {
    this.grid.blocked.fill(0);
    for (const b of useGame.getState().buildings) {
      const def = getBuildingDef(b.defId);
      const { w, d } = footprintSize(def, b.rot);
      setRectBlocked(this.grid, b.x, b.y, w, d, 1);
    }
    this.navDirty = false;
  }

  markNavDirty(): void {
    this.navDirty = true;
  }

  private producers(): BuildingInstance[] {
    return useGame.getState().buildings.filter((b) => {
      if (b.status !== "ready") return false;
      const def = getBuildingDef(b.defId);
      return Boolean(levelDef(def, b.level).production);
    });
  }

  private makeVillager(homeIdx: number): Villager {
    const angle = this.rnd() * Math.PI * 2;
    const radius = randRange(this.rnd, 3, 12);
    let i = Math.round(GRID_N / 2 + Math.cos(angle) * radius);
    let j = Math.round(GRID_N / 2 + Math.sin(angle) * radius);
    if (isBlocked(this.grid, i, j)) {
      i = GRID_N / 2 + 3;
      j = GRID_N / 2;
    }
    const [x, z] = tileCenterWorld(i, j);
    return {
      id: this.nextId++,
      ctrl: { x, z, facing: this.rnd() * Math.PI * 2, phase: this.rnd() * 10, activity: "idle", visible: true },
      homeIdx,
      path: [],
      wp: [],
      seg: 0,
      speed: randRange(this.rnd, 1.15, 1.55) * TILE_SIZE,
      timer: randRange(this.rnd, 0.5, 3),
      intent: "wander",
      stuckTime: 0,
      lastProgress: 0,
    };
  }

  private reconcile(): void {
    const producers = this.producers();
    const desired = Math.min(MAX_VILLAGERS, 3 + producers.length);
    while (this.villagers.length > desired) {
      const removed = this.villagers.pop();
      if (removed) removed.ctrl.visible = false;
    }
    while (this.villagers.length < desired) {
      this.villagers.push(this.makeVillager(this.villagers.length % Math.max(producers.length, 1)));
    }
    this.villagers.forEach((v, idx) => {
      v.homeIdx = producers.length > 0 ? idx % producers.length : -1;
    });
  }

  private routeTo(v: Villager, ti: number, tj: number): boolean {
    const si = Math.floor(v.ctrl.x / TILE_SIZE + GRID_N / 2);
    const sj = Math.floor(v.ctrl.z / TILE_SIZE + GRID_N / 2);
    let sx = si;
    let sz = sj;
    if (isBlocked(this.grid, sx, sz)) {
      const ring: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ];
      const found = ring.map(([dx, dy]) => [si + dx, sj + dy] as [number, number]).find(
        ([a, b]) => !isBlocked(this.grid, a, b),
      );
      if (!found) return false;
      sx = found[0];
      sz = found[1];
      v.ctrl.x = tileCenterWorld(sx, sz)[0];
      v.ctrl.z = tileCenterWorld(sx, sz)[1];
    }
    const path = findPath(this.grid, sx, sz, ti, tj);
    if (!path || path.length === 0) return false;
    v.path = path;
    v.wp = path.map((p) => tileCenterWorld(p.x, p.y));
    v.seg = 0;
    v.stuckTime = 0;
    v.lastProgress = 0;
    v.ctrl.activity = "walk";
    return true;
  }

  private decideNext(v: Villager): void {
    const buildings = useGame.getState().buildings;
    const producers = this.producers();
    if (v.intent === "work" && v.homeIdx >= 0 && v.homeIdx < producers.length) {
      const b = producers[v.homeIdx];
      const [tx, tz] = workSpotFor(b);
      const ti = Math.floor(tx / TILE_SIZE + GRID_N / 2);
      const tj = Math.floor(tz / TILE_SIZE + GRID_N / 2);
      if (this.routeTo(v, ti, tj)) {
        v.intent = "work";
        return;
      }
    }
    const anchor =
      v.homeIdx >= 0 && v.homeIdx < producers.length
        ? buildingCenterWorld(producers[v.homeIdx], getBuildingDef(producers[v.homeIdx].defId))
        : ([0, 0] as [number, number]);
    for (let attempt = 0; attempt < 6; attempt++) {
      const ang = this.rnd() * Math.PI * 2;
      const rad = randRange(this.rnd, 2, 9) * TILE_SIZE;
      const ti = Math.floor((anchor[0] + Math.cos(ang) * rad) / TILE_SIZE + GRID_N / 2);
      const tj = Math.floor((anchor[1] + Math.sin(ang) * rad) / TILE_SIZE + GRID_N / 2);
      if (!isBlocked(this.grid, ti, tj) && this.routeTo(v, ti, tj)) {
        v.intent = "wander";
        return;
      }
    }
    v.timer = randRange(this.rnd, 1, 3);
    v.ctrl.activity = "idle";
  }

  private moveAlong(v: Villager, dt: number): boolean {
    if (v.seg >= v.wp.length) return true;
    const before = v.ctrl.x + v.ctrl.z;
    const [tx, tz] = v.wp[v.seg];
    const dx = tx - v.ctrl.x;
    const dz = tz - v.ctrl.z;
    const dist = Math.hypot(dx, dz);
    const step = v.speed * dt;
    if (dist <= step) {
      v.ctrl.x = tx;
      v.ctrl.z = tz;
      v.seg++;
    } else {
      v.ctrl.x += (dx / dist) * step;
      v.ctrl.z += (dz / dist) * step;
      const targetFacing = Math.atan2(dx, dz);
      let diff = targetFacing - v.ctrl.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      v.ctrl.facing += diff * Math.min(1, dt * 10);
    }
    v.ctrl.phase += dt * 9;
    const moved = Math.abs(v.ctrl.x + v.ctrl.z - before);
    if (moved < 0.0005 && v.wp.length > 0) {
      v.stuckTime += dt;
      if (v.stuckTime > 1.2) {
        return false;
      }
    } else {
      v.stuckTime = 0;
    }
    return v.seg >= v.wp.length;
  }

  private updateVillagers(dt: number): void {
    for (const v of this.villagers) {
      switch (v.ctrl.activity) {
        case "idle": {
          v.timer -= dt;
          if (v.timer <= 0) this.decideNext(v);
          break;
        }
        case "walk": {
          const arrived = this.moveAlong(v, dt);
          if (!arrived && v.stuckTime > 1.2) {
            v.intent = "wander";
            v.timer = 0.2;
            v.ctrl.activity = "idle";
          } else if (arrived) {
            if (v.intent === "work") {
              v.ctrl.activity = "work";
              v.timer = randRange(this.rnd, 5, 11);
            } else {
              v.ctrl.activity = "idle";
              v.timer = randRange(this.rnd, 1.5, 5);
            }
          }
          break;
        }
        case "work": {
          v.ctrl.phase += dt * 7;
          v.timer -= dt;
          if (v.timer <= 0) {
            v.intent = "wander";
            v.timer = 0;
            v.ctrl.activity = "idle";
          }
          break;
        }
      }
    }
  }

  private emitIncomeFloaters(gainedTotal: number): void {
    const producers = this.producers();
    if (producers.length === 0) return;
    const count = Math.min(2, producers.length);
    for (let n = 0; n < count; n++) {
      const b = producers[Math.floor(this.rnd() * producers.length)];
      const def = getBuildingDef(b.defId);
      const [cx, cz] = buildingCenterWorld(b, def);
      const share = gainedTotal / producers.length;
      gameEvents.emit("floater", {
        pos: [cx, 3.6 + this.rnd(), cz],
        text: `+${fmt(Math.max(1, share))}`,
        color: "#ffe08a",
      });
    }
  }

  update(dtSec: number, now: number): void {
    const dt = Math.min(dtSec, 0.1);
    if (this.navDirty) this.rebuildNav();
    this.reconcileAccum += dt;
    if (this.reconcileAccum > 2) {
      this.reconcileAccum = 0;
      this.reconcile();
    }
    this.ecoAccum += dt;
    if (this.ecoAccum >= 1.0) {
      this.ecoAccum = 0;
      const res = useGame.getState().finalizeAll(now);
      if (res.gainedTotal > 0.5) this.emitIncomeFloaters(res.gainedTotal);
    }
    this.updateVillagers(dt);
  }

  dispose(): void {
    this.unsub?.();
    this.unsub = undefined;
  }
}

export const sim: Simulation = (simInstance = new Simulation());
