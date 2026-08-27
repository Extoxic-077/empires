import { nextLevelDef, popCapacityAt, levelDef } from "../game/economy/economy";
import { canAfford, fmt, fmtTime } from "../lib/format";
import { getBuildingDef, RESOURCE_KEYS } from "@shared";
import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";
import { useTicker } from "./useTicker";
import { memo } from "react";
import { ResourceIcon } from "./icons";
import { useShallow } from "zustand/react/shallow";

function SelectionPanelInner() {
  useTicker(1000);
  const selectedId = useUI((s) => s.selectedId);
  const select = useUI((s) => s.select);
  const openTrain = useUI((s) => s.openTrain);
  const openModal = useUI((s) => s.openModal);
  const inst = useGame((s) => s.buildings.find((b) => b.id === selectedId));
  const startUpgrade = useGame((s) => s.startUpgrade);

  if (!inst) return null;
  const def = getBuildingDef(inst.defId);
  const now = Date.now();
  const busy = inst.status !== "ready";
  const progress =
    busy && inst.durationMs > 0 ? Math.min(1, Math.max(0, (now - inst.startedAt) / inst.durationMs)) : 1;
  const remaining = busy ? Math.max(0, (inst.startedAt + inst.durationMs - now) / 1000) : 0;

  const cur = inst.level > 0 ? levelDef(def, inst.level) : null;
  const nxt = nextLevelDef(def, inst.level);
  const resources = useGame(useShallow((s) => s.resources));
  const canUp = Boolean(nxt && !busy && canAfford(resources, nxt.cost));

  const prodLines = cur
    ? RESOURCE_KEYS.filter((k) => ((cur.production ?? {})[k] ?? 0) > 0).map((k) => ({
        k,
        v: (cur.production ?? {})[k] ?? 0,
      }))
    : [];
  const storeLines = cur
    ? RESOURCE_KEYS.filter((k) => ((cur.storage ?? {})[k] ?? 0) > 0).map((k) => ({
        k,
        v: (cur.storage ?? {})[k] ?? 0,
      }))
    : [];
  const popCap = cur?.popCapacity ?? popCapacityAt(def, Math.max(1, inst.level));

  return (
    <div className="selection-panel">
      <div className="sp-head">
        <div>
          <div className="sp-name">{def.name}</div>
          <div className="sp-sub">
            Level {inst.level}/{def.levels.length}
            {busy && (
              <span className="sp-status">
                {inst.status === "construction" ? " · Building" : " · Upgrading"} {Math.ceil(progress * 100)}% ({fmtTime(remaining)})
              </span>
            )}
          </div>
        </div>
        <button className="close-x" onClick={() => select(null)}>
          ✕
        </button>
      </div>

      {busy && (
        <div className="progress-line">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className="sp-desc">{def.description}</div>

      {(prodLines.length > 0 || storeLines.length > 0 || popCap > 0) && (
        <div className="stat-rows">
          {prodLines.map(({ k, v }) => (
            <div key={k} className="stat-row">
              <ResourceIcon k={k} size={14} /> +{v}/min
            </div>
          ))}
          {storeLines.map(({ k, v }) => (
            <div key={k} className="stat-row">
              <ResourceIcon k={k} size={14} /> +{fmt(v)} storage
            </div>
          ))}
          {popCap > 0 && (
            <div className="stat-row">
              <ResourceIcon k="pop" size={14} /> +{popCap} population
            </div>
          )}
        </div>
      )}

      {inst.queue.length > 0 && (
        <div className="queue-hint">
          Training queue: {inst.queue.length}
          {inst.queue[0].startedAt !== null &&
            ` · head done in ${fmtTime((inst.queue[0].startedAt! + inst.queue[0].durationMs - now) / 1000)}`}
        </div>
      )}

      <div className="sp-actions">
        {nxt ? (
          <button
            className="act-btn primary"
            disabled={!canUp}
            onClick={() => startUpgrade(inst.id)}
            title={
              !canUp
                ? busy
                  ? "Busy"
                  : "Not enough resources"
                : `Upgrade for ${costText(nxt.cost)} — ${nxt.buildTimeSec}s`
            }
          >
            Upgrade → Lv {inst.level + 1}
            <span className="sub">
              {costText(nxt.cost)} · {nxt.buildTimeSec}s
            </span>
          </button>
        ) : (
          <div className="maxed">Max level reached</div>
        )}
        {def.trainsUnitIds && def.trainsUnitIds.length > 0 && inst.status === "ready" && (
          <button className="act-btn train" onClick={() => openTrain(inst.id)}>
            Train Units
          </button>
        )}
        {def.category !== "core" && (
          <button className="act-btn danger" onClick={() => openModal({ kind: "confirm-demolish", buildingId: inst.id })}>
            Demolish
          </button>
        )}
      </div>
    </div>
  );
}

function costText(cost: Partial<Record<string, number>>): string {
  const parts = Object.entries(cost)
    .filter(([k, v]) => k !== "pop" && (v ?? 0) > 0)
    .map(([k, v]) => `${k} ${v}`);
  return parts.length ? parts.join(" · ") : "free";
}

export const SelectionPanel = memo(SelectionPanelInner);