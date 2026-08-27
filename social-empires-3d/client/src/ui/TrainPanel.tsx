import { memo } from "react";
import { getBuildingDef, getUnitDef } from "@shared";
import { canAfford, fmtTime } from "../lib/format";
import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";
import { useTicker } from "./useTicker";
import { UnitGlyph } from "./icons";
import { useShallow } from "zustand/react/shallow";

function TrainPanelInner() {
  useTicker(1000);
  const buildingId = useUI((s) => s.trainForBuildingId);
  const openTrain = useUI((s) => s.openTrain);
  const enqueueTraining = useGame((s) => s.enqueueTraining);
  const cancelTraining = useGame((s) => s.cancelTraining);
  const buildings = useGame((s) => s.buildings);
  const resources = useGame(useShallow((s) => s.resources));

  if (!buildingId) return null;
  const inst = buildings.find((b) => b.id === buildingId);
  if (!inst) return null;
  const def = getBuildingDef(inst.defId);
  const now = Date.now();

  return (
    <div className="modal-backdrop" onClick={() => openTrain(null)}>
      <div className="modal train-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Train at {def.name}</h3>
          <button className="close-x" onClick={() => openTrain(null)}>
            ✕
          </button>
        </div>

        <div className="train-queue">
          <span className="tq-label">Queue</span>
          {inst.queue.length === 0 && <span className="dim">Empty</span>}
          {inst.queue.map((slot, i) => {
            const ud = getUnitDef(slot.unitId);
            const active = slot.startedAt !== null;
            const p = active
              ? Math.min(1, Math.max(0, (now - (slot.startedAt ?? now)) / slot.durationMs))
              : 0;
            const remain = active ? Math.max(0, ((slot.startedAt ?? now) + slot.durationMs - now) / 1000) : ud.trainTimeSec;
            return (
              <div key={slot.uid} className={`queue-item${i === 0 && active ? " active" : ""}`}>
                <UnitGlyph name={ud.name.replace(" (mercenary)", "")} color={ud.colors.primary} size={24} />
                <span className="qi-name">{ud.name}</span>
                <span className="qi-time">{active ? fmtTime(remain) : "queued"}</span>
                {active && (
                  <span className="qi-bar">
                    <span style={{ width: `${p * 100}%` }} />
                  </span>
                )}
                <button className="qi-cancel" title="Cancel (refund)" onClick={() => cancelTraining(inst.id, slot.uid)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="train-cards">
          {(def.trainsUnitIds ?? []).map((uidStr) => {
            const ud = getUnitDef(uidStr);
            const afford = canAfford(resources, ud.cost);
            return (
              <div key={uidStr} className={`unit-card${afford ? "" : " poor"}`}>
                <UnitGlyph name={ud.name.replace(" (mercenary)", "")} color={ud.colors.primary} />
                <div className="uc-body">
                  <div className="uc-name">{ud.name}</div>
                  <div className="uc-stats">
                    HP {ud.stats.health} · ATK {ud.stats.attack} · DEF {ud.stats.defense} · RNG{" "}
                    {ud.stats.range}
                  </div>
                  <div className="uc-cost">
                    {costInline(ud)} · {ud.trainTimeSec}s
                  </div>
                </div>
                <button className="act-btn primary small" disabled={!afford} onClick={() => enqueueTraining(inst.id, uidStr)}>
                  Train
                </button>
              </div>
            );
          })}
        </div>
        <div className="train-note dim">
          Trained units garrison near their barracks. Population: see top bar. Cancel refunds full cost
          before training starts.
        </div>
      </div>
    </div>
  );
}

function costInline(ud: ReturnType<typeof getUnitDef>): string {
  const parts = Object.entries(ud.cost)
    .filter(([k, v]) => k !== "pop" && (v ?? 0) > 0)
    .map(([k, v]) => `${k} ${v}`);
  if (ud.cost.pop) parts.push(`pop ${ud.cost.pop}`);
  return parts.join(" · ") || "free";
}

export const TrainPanel = memo(TrainPanelInner);