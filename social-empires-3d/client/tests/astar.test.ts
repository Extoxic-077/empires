import { describe, expect, it } from "vitest";
import {
  createNavGrid,
  findPath,
  isBlocked,
  setRectBlocked,
} from "../src/game/pathfinding/astar";

describe("a* pathfinding", () => {
  it("finds a straight path on an open grid", () => {
    const grid = createNavGrid(16, 16);
    const path = findPath(grid, 2, 2, 8, 2);
    expect(path).not.toBeNull();
    expect(path!.at(-1)).toEqual({ x: 8, y: 2 });
  });

  it("routes around a blocking rectangle without corner cutting", () => {
    const grid = createNavGrid(24, 24);
    setRectBlocked(grid, 6, 2, 4, 12, 1);
    const path = findPath(grid, 4, 8, 14, 8);
    expect(path).not.toBeNull();
    for (const node of path!) {
      expect(isBlocked(grid, node.x, node.y)).toBe(false);
    }
    let crossesWall = false;
    for (let j = 2; j < 14; j++) {
      if (path!.some((p) => p.x === 7 && p.y === j)) crossesWall = true;
    }
    expect(crossesWall).toBe(false);
  });

  it("returns null when the target is unreachable", () => {
    const grid = createNavGrid(12, 12);
    setRectBlocked(grid, 0, 0, 12, 6, 1);
    expect(findPath(grid, 5, 2, 5, 9)).toBeNull();
  });

  it("returns null when the target itself is blocked", () => {
    const grid = createNavGrid(12, 12);
    setRectBlocked(grid, 8, 8, 2, 2, 1);
    expect(findPath(grid, 2, 2, 9, 9)).toBeNull();
  });

  it("handles identical start and goal", () => {
    const grid = createNavGrid(8, 8);
    expect(findPath(grid, 3, 3, 3, 3)).toEqual([{ x: 3, y: 3 }]);
  });
});
