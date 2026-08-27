import { useMemo } from "react";
import { BUILDING_DEFS_BY_ID, getLevelFromXp } from "@shared";
import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";

export function EmpireGuide() {
  const xp = useGame((s) => s.xp);
  const buildings = useGame((s) => s.buildings);
  const startPlacement = useUI((s) => s.startPlacement);
  const togglePanel = useUI((s) => s.togglePanel);
  const level = getLevelFromXp(xp);

  const next = useMemo(() => {
    const owned = new Set(buildings.map((b) => b?.defId).filter(Boolean));
    const priorities = ["lumbermill", "goldmine", "farm", "storehouse", "barracks"];
    return priorities.find((id) => !owned.has(id)) ?? null;
  }, [buildings]);

  if (!next) return null;
  const def = BUILDING_DEFS_BY_ID.get(next);
  if (!def) return null;
  const locked = level < def.unlockLevel;

  return (
    <div className="empire-guide panel-card">
      <div className="panel-title">Your next move</div>
      <div className="guide-main">
        <div className="guide-kicker">Frontier objective</div>
        <div className="guide-name">{def.name}</div>
        <div className="guide-copy">{def.description}</div>
      </div>
      {locked ? (
        <div className="guide-lock">Reach Empire Lv {def.unlockLevel} to unlock this.</div>
      ) : (
        <button
          className="guide-action"
          onClick={() => {
            togglePanel("build");
            startPlacement(def.id);
          }}
        >
          Place {def.name}
        </button>
      )}
    </div>
  );
}
