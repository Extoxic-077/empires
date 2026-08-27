import { memo } from "react";
import { QUEST_CHAIN } from "@shared";
import { useGame } from "../state/gameStore";

function QuestTrackerInner() {
  const quests = useGame((s) => s.quests);

  const activeEntry = QUEST_CHAIN.map((q) => ({ q, st: quests[q.id] })).find(
    (e) => e.st && !e.st.claimed && e.st.progress < e.q.count,
  );
  const claimable = QUEST_CHAIN.filter((q) => {
    const st = quests[q.id];
    return st && !st.claimed && st.progress >= q.count;
  });

  return (
    <div className="quest-tracker">
      <div className="panel-title">Quests</div>
      {claimable.map((q) => (
        <ClaimRow key={q.id} id={q.id} title={q.title} />
      ))}
      {activeEntry ? (
        <div className="quest-card">
          <div className="quest-name">{activeEntry.q.title}</div>
          <div className="quest-desc">{activeEntry.q.description}</div>
          <div className="quest-progress">
            <div className="quest-bar">
              <div
                className="quest-fill"
                style={{
                  width: `${Math.min(100, (activeEntry.st!.progress / activeEntry.q.count) * 100)}%`,
                }}
              />
            </div>
            <span className="quest-count">
              {Math.min(activeEntry.st!.progress, activeEntry.q.count)}/{activeEntry.q.count}
            </span>
          </div>
        </div>
      ) : claimable.length === 0 ? (
        <div className="quest-done">All quests complete — a true Emperor!</div>
      ) : null}
    </div>
  );
}

function ClaimRow({ id, title }: { id: string; title: string }) {
  const claimQuest = useGame((s) => s.claimQuest);
  return (
    <button className="quest-claim" onClick={() => claimQuest(id)}>
      Claim · {title}
    </button>
  );
}

export const QuestTracker = memo(QuestTrackerInner);