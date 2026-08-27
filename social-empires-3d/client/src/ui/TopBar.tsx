import { getXpProgress } from "@shared";
import { fmt } from "../lib/format";
import { useGame } from "../state/gameStore";
import { usePopInfo, useLevelInfo } from "../state/selectors";
import { useUI } from "../state/uiStore";
import { Tip } from "./Tip";
import { ResourceBar } from "./ResourceBar";
import { ResourceIcon } from "./icons";

export function TopBar() {
  const xp = useGame((s) => s.xp);
  const playerName = useGame((s) => s.playerName);
  const pop = usePopInfo();
  const lvl = useLevelInfo();
  const togglePanel = useUI((s) => s.togglePanel);
  const openModal = useUI((s) => s.openModal);

  const p = getXpProgress(xp);
  const pct = Math.min(100, (p.into / Math.max(1, p.needed)) * 100);

  return (
    <div className="top-bar">
      <div className="crest-block">
        <div className="crest">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <rect width="32" height="32" rx="7" fill="#2b3a67" />
            <path d="M7 24V13l4-3 5 3 5-3 4 3v11z" fill="#ffc93c" />
            <rect x="14" y="17" width="4" height="7" fill="#2b3a67" />
          </svg>
        </div>
        <div className="player-info">
          <div className="player-name">{playerName}</div>
          <div className="level-row">
            <span className="lv-badge">Lv {p.level}</span>
            <span className="lv-title">{lvl.title}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${pct}%` }} />
            <span className="xp-text">
              XP {fmt(p.into)}/{fmt(p.needed)}
            </span>
          </div>
        </div>
      </div>

      <ResourceBar />

      <div className="top-actions">
        <Tip content={<span>Population: {pop.used}/{pop.cap}</span>}>
          <div className={`pop-pill${pop.used >= pop.cap ? " full" : ""}`}>
            <ResourceIcon k="pop" size={16} />
            <span>
              {pop.used}/{pop.cap}
            </span>
          </div>
        </Tip>
        <button className="hud-btn" onClick={() => togglePanel("army")}>
          Army
        </button>
        <button className="hud-btn" onClick={() => togglePanel("quests")}>
          Quests
        </button>
        <button className="hud-btn icon-only" onClick={() => openModal({ kind: "help" })} title="Help">
          ?
        </button>
        <button
          className="hud-btn icon-only danger"
          onClick={() => openModal({ kind: "reset" })}
          title="Reset empire"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
