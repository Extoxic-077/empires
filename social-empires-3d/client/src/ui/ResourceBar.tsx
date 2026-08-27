import { RESOURCE_KEYS } from "@shared";
import { fmt } from "../lib/format";
import { useGame } from "../state/gameStore";
import { useIncomePerMin, useStorageCaps } from "../state/selectors";
import { Tip } from "./Tip";
import { ResourceIcon } from "./icons";
import { useShallow } from "zustand/react/shallow";

export function ResourceBar() {
  const resources = useGame(useShallow((s) => s.resources));
  const caps = useStorageCaps();
  const income = useIncomePerMin();

  return (
    <div className="resource-bar">
      {RESOURCE_KEYS.map((k) => (
        <Tip
          key={k}
          content={
            <span className="tip-lines">
              <b>{capLabel(k)}</b>
              <span>Stored {fmt(resources[k])} / {fmt(caps[k])}</span>
              <span>Income +{income[k].toFixed(1)} / min</span>
            </span>
          }
        >
          <div className={`res-pill res-${k}`}>
            <ResourceIcon k={k} size={17} />
            <span className="res-amount">{fmt(resources[k])}</span>
            <span className="res-cap">/{fmt(caps[k])}</span>
          </div>
        </Tip>
      ))}
    </div>
  );
}

function capLabel(k: string): string {
  return k.charAt(0).toUpperCase() + k.slice(1);
}
