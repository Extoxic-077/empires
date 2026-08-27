import { memo } from "react";
import { UNIT_DEFINITIONS } from "@shared";
import { useGame } from "../state/gameStore";
import { usePopInfo } from "../state/selectors";
import { useUI } from "../state/uiStore";
import { UnitGlyph } from "./icons";
import { useShallow } from "zustand/react/shallow";

function ArmyPanelInner() {
  const units = useGame((s) => s.units);
  const pop = usePopInfo();
  const setPanel = useUI((s) => s.setPanel);
  const panel = useUI(useShallow((s) => s.panel));

  if (panel !== "army") return null;

  const counts = new Map<string, number>();
  for (const u of units) counts.set(u.unitId, (counts.get(u.unitId) ?? 0) + 1);

  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="modal-backdrop" onClick={() => setPanel(null)}>
      <div className="modal army-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Your Army</h3>
          <button
            type="button"
            className="close-x"
            onClick={() => setPanel(null)}
            aria-label="Close Army"
          >
            ✕
          </button>
        </div>

        {units.length === 0 ? (
          <div className="dim pad">No units yet. Build a Warrior Barracks and start drilling troops.</div>
        ) : (
          <>
            <div className="army-pop-row">
              Population {pop.used}/{pop.cap}
              <span className="mini-bar">
                <span style={{ width: `${Math.min(100, (pop.used / Math.max(1, pop.cap)) * 100)}%` }} />
              </span>
            </div>
            <div className="army-list">
              {rows.map(([unitId, count]) => {
                const def = UNIT_DEFINITIONS.find((u) => u.id === unitId);
                if (!def) return null;
                return (
                  <div key={unitId} className="army-row">
                    <UnitGlyph name={def.name.replace(" (mercenary)", "")} color={def.colors.primary} size={34} />
                    <div className="ar-body">
                      <div className="ar-name">
                        {def.name} <span className="ar-count">×{count}</span>
                      </div>
                      <div className="ar-stats">
                        HP {def.stats.health} · ATK {def.stats.attack} · DEF {def.stats.defense} · SPD{" "}
                        {def.stats.speed} · RNG {def.stats.range}
                        {def.abilities.length > 0 && <span className="gold"> · {def.abilities.join(", ")}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const ArmyPanel = memo(ArmyPanelInner);