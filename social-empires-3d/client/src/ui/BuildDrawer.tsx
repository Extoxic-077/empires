import { memo } from "react";
import { BUILDING_DEFINITIONS, getLevelFromXp } from "@shared";
import { canAfford } from "../lib/format";
import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";
import { Tip } from "./Tip";
import { BuildingIcon } from "./icons";
import { useShallow } from "zustand/react/shallow";

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  resource: "Resources",
  military: "Military",
  defense: "Defense",
  special: "Special",
};

function costLine(cost: Record<string, number | undefined>): string {
  const parts = Object.entries(cost)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${k} ${v}`);
  return parts.length ? `Cost: ${parts.join(" · ")}` : "Cost: free";
}

function costShort(cost: Record<string, number | undefined>): string {
  const first = Object.entries(cost).find(([, v]) => (v ?? 0) > 0);
  return first ? `${first[0][0].toUpperCase()} ${first[1]}` : "Free";
}

function BuildDrawerInner() {
  const resources = useGame(useShallow((s) => s.resources));
  const xp = useGame((s) => s.xp);
  const startPlacement = useUI((s) => s.startPlacement);
  const placingDefId = useUI((s) => s.placingDefId);

  const level = getLevelFromXp(xp);

  return (
    <div className="build-drawer">
      <div className="build-grid">
        {BUILDING_DEFINITIONS.map((def) => {
          const locked = level < def.unlockLevel;
          const cost = def.levels[0].cost;
          const afford = canAfford(resources, cost);
          const activeCls = placingDefId === def.id ? " placing" : "";
          if (locked) {
            return (
              <div key={def.id} className={`build-card locked${activeCls}`}>
                <div className="bc-icon">
                  <BuildingIcon id={def.id} />
                </div>
                <div className="bc-name">{def.name}</div>
                <div className="bc-lock">Unlocks at Lv {def.unlockLevel}</div>
              </div>
            );
          }
          return (
            <Tip
              key={def.id}
              wide
              content={
                <span className="tip-lines">
                  <b>{def.name}</b> · {CATEGORY_LABELS[def.category]}
                  <span className="dim">{def.description}</span>
                  <span>Footprint {def.width}×{def.depth} · Build {def.levels[0].buildTimeSec}s</span>
                  <span>{costLine(cost)}</span>
                  {def.trainsUnitIds && def.trainsUnitIds.length > 0 && (
                    <span className="gold">Trains: {def.trainsUnitIds.length} unit types</span>
                  )}
                </span>
              }
            >
              <button
                className={`build-card${afford ? "" : " poor"}${activeCls}`}
                onClick={() => {
                  startPlacement(def.id);
                  useUI.getState().setPanel(null);
                }}
              >
                <div className="bc-icon">
                  <BuildingIcon id={def.id} />
                </div>
                <div className="bc-name">{def.name}</div>
                <div className={`bc-cost${afford ? "" : " lack"}`}>{costShort(cost)}</div>
              </button>
          </Tip>
          );
        })}
      </div>
    </div>
  );
}

export const BuildDrawer = memo(BuildDrawerInner);