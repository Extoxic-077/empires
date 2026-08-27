import type { ResourceAmounts, ResourceCost } from "@shared";
import { costEntries } from "@shared";

export function fmt(n: number): string {
  const v = Math.floor(n);
  if (v >= 100000) return `${Math.floor(v / 1000)}k`;
  return v.toLocaleString("en-US");
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${String(r).padStart(2, "0")}s`;
}

export function costRows(cost: ResourceCost): Array<{ key: string; amount: number }> {
  return costEntries(cost).map(([key, amount]) => ({ key, amount }));
}

export function canAfford(res: ResourceAmounts, cost: ResourceCost): boolean {
  return costEntries(cost).every(([k, v]) => res[k] >= v);
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function angleLerp(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
