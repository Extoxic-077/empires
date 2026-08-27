import { memo, useMemo, useState } from "react";
import { BUILDING_DEFINITIONS, getLevelFromXp } from "@shared";
import { canAfford } from "../lib/format";
import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";
import { Tip } from "./Tip";
import { BuildingIcon } from "./icons";
import { useShallow } from "zustand/react/shallow";

const CATEGORY_LABELS: Record<string, string> = { core: "Core", resource: "Resources", military: "Military", defense: "Defense", special: "Special" };

function costShort(cost: Record<string, number | undefined>): string {
  return Object.entries(cost).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => `${k} ${v}`).join(" · ") || "Free";
}

function BuildDrawerInner() {
  const resources = useGame(useShallow((s) => s.resources));
  const xp = useGame((s) => s.xp);
  const startPlacement = useUI((s) => s.startPlacement);
  const placingDefId = useUI((s) => s.placingDefId);
  const [category, setCategory] = useState<string>("all");
  const level = getLevelFromXp(xp);
  const categories = useMemo(() => ["all", ...Array.from(new Set(BUILDING_DEFINITIONS.map((d) => d.category)))], []);
  const visible = useMemo(() => BUILDING_DEFINITIONS.filter((d) => category === "all" || d.category === category), [category]);

  return <div className="build-drawer">
    <div className="build-head">
      <div><div className="panel-title">Kingdom construction</div><div className="build-subtitle">Choose a structure, then place it on open terrain.</div></div>
      <div className="build-level">Empire Lv {level}</div>
    </div>
    <div className="build-tabs">
      {categories.map((key) => <button key={key} className={`build-tab${category === key ? " active" : ""}`} onClick={() => setCategory(key)}>{key === "all" ? "All" : CATEGORY_LABELS[key]}</button>)}
    </div>
    <div className="build-grid">
      {visible.map((def) => {
        const locked = level < def.unlockLevel;
        const cost = def.levels[0].cost;
        const afford = canAfford(resources, cost);
        const activeCls = placingDefId === def.id ? " placing" : "";
        const tooltip = <span className="tip-lines"><b>{def.name}</b><span className="dim">{def.description}</span><span>Footprint {def.width}×{def.depth} · Build {def.levels[0].buildTimeSec}s</span><span>{costShort(cost)}</span>{def.trainsUnitIds?.length ? <span className="gold">Trains {def.trainsUnitIds.length} unit types</span> : null}</span>;
        if (locked) return <div key={def.id} className={`build-card locked${activeCls}`}><div className="bc-icon"><BuildingIcon id={def.id} /></div><div className="bc-name">{def.name}</div><div className="bc-lock">Lv {def.unlockLevel}</div></div>;
        return <Tip key={def.id} wide content={tooltip}><button className={`build-card${afford ? "" : " poor"}${activeCls}`} onClick={() => { startPlacement(def.id); useUI.getState().setPanel(null); }}><div className="bc-icon"><BuildingIcon id={def.id} /></div><div className="bc-name">{def.name}</div><div className={`bc-cost${afford ? "" : " lack"}`}>{costShort(cost)}</div></button></Tip>;
      })}
    </div>
  </div>;
}

export const BuildDrawer = memo(BuildDrawerInner);
