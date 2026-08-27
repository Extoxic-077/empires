import { useMemo } from "react";
import { getBuildingDef } from "@shared";
import { canAfford } from "../../lib/format";
import { useGame } from "../../state/gameStore";
import { useUI } from "../../state/uiStore";
import { useShallow } from "zustand/react/shallow";
import {
  buildOccupancy,
  checkPlacement,
  footprintSize,
  originForCenteredCursor,
  type PlacementFailReason,
} from "./placement";

export interface PlacementState {
  defId: string;
  origin: { x: number; y: number };
  rot: number;
  valid: boolean;
  reason: PlacementFailReason | "funds" | null;
  centerWorld: [number, number];
  sizeW: number;
  sizeD: number;
}

export function usePlacementState(): PlacementState | null {
  const defId = useUI((s) => s.placingDefId);
  const rot = useUI((s) => s.placingRot);
  const hovered = useUI((s) => s.hoveredTile);
  const buildings = useGame(useShallow((s) => s.buildings));
  const resources = useGame(useShallow((s) => s.resources));
  const level = useGame((s) => s.xp);

  return useMemo(() => {
    if (!defId || !hovered) return null;
    const def = getBuildingDef(defId);
    if (level === -999) return null;
    const { w, d } = footprintSize(def, rot);
    const origin = originForCenteredCursor(hovered.x, hovered.y, w, d);
    const occ = buildOccupancy(buildings);
    const check = checkPlacement(occ, def, origin.x, origin.y, rot);
    const afford = canAfford(resources, def.levels[0].cost);
    const reason = !check.ok ? (check.reason ?? "bounds") : !afford ? "funds" : null;
    return {
      defId,
      origin,
      rot,
      valid: reason === null,
      reason,
      sizeW: w,
      sizeD: d,
      centerWorld: [(origin.x + w / 2 - 21) * 2, (origin.y + d / 2 - 21) * 2],
    };
  }, [defId, rot, hovered, buildings, resources, level]);
}

export function computePlacementAt(worldX: number, worldZ: number): PlacementState | null {
  const ui = useUI.getState();
  const g = useGame.getState();
  const defId = ui.placingDefId;
  if (!defId) return null;
  const hovered = { x: Math.floor(worldX / 2 + 21), y: Math.floor(worldZ / 2 + 21) };
  const def = getBuildingDef(defId);
  const { w, d } = footprintSize(def, ui.placingRot);
  const origin = originForCenteredCursor(hovered.x, hovered.y, w, d);
  const occ = buildOccupancy(g.buildings);
  const check = checkPlacement(occ, def, origin.x, origin.y, ui.placingRot);
  const afford = canAfford(g.resources, def.levels[0].cost);
  const reason = !check.ok ? (check.reason ?? "bounds") : !afford ? "funds" : null;
  return {
    defId,
    origin,
    rot: ui.placingRot,
    valid: reason === null,
    reason,
    sizeW: w,
    sizeD: d,
    centerWorld: [(origin.x + w / 2 - 21) * 2, (origin.y + d / 2 - 21) * 2],
  };
}

export function attemptPlaceAt(worldX: number, worldZ: number): void {
  const state = computePlacementAt(worldX, worldZ);
  if (!state || !state.valid) return;
  const id = useGame.getState().placeBuilding(state.defId, state.origin.x, state.origin.y, state.rot);
  if (id !== null) {
    const keepMode = state.defId === "wall";
    if (!keepMode) useUI.getState().cancelPlacement();
  }
}
