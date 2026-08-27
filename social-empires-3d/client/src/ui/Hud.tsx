import { useEffect } from "react";
import { BUILDING_DEFS_BY_ID } from "@shared";
import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";
import { TopBar } from "./TopBar";
import { QuestTracker } from "./QuestTracker";
import { EmpireGuide } from "./EmpireGuide";
import { BuildDrawer } from "./BuildDrawer";
import { SelectionPanel } from "./SelectionPanel";
import { TrainPanel } from "./TrainPanel";
import { ArmyPanel } from "./ArmyPanel";
import { Toasts } from "./Toasts";
import { Modals } from "./Modals";

export function Hud() {
  const mode = useUI((s) => s.mode);
  const panel = useUI((s) => s.panel);
  const togglePanel = useUI((s) => s.togglePanel);
  const setPlacingRot = useUI((s) => s.setPlacingRot);
  const placingRot = useUI((s) => s.placingRot);
  const cancelPlacement = useUI((s) => s.cancelPlacement);
  const selectedId = useUI((s) => s.selectedId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Escape":
          if (ui.modal !== null) ui.openModal(null);
          else if (ui.trainForBuildingId) ui.openTrain(null);
          else if (ui.mode === "placing") ui.cancelPlacement();
          else if (ui.panel) ui.setPanel(null);
          else if (ui.selectedId) ui.select(null);
          break;
        case "KeyR":
          if (ui.mode === "placing") setPlacingRot(ui.placingRot + 1);
          break;
        case "KeyB":
          if (ui.mode === "placing") ui.cancelPlacement();
          ui.togglePanel("build");
          break;
        case "Delete":
        case "Backspace": {
          const selected = ui.selectedId;
          if (selected) {
            const inst = useGame.getState().buildings.find((b) => b?.id === selected);
            if (inst && getBuildingCategory(inst.defId) !== "core") ui.openModal({ kind: "confirm-demolish", buildingId: inst.id });
          }
          break;
        }
        case "F1":
          e.preventDefault();
          ui.openModal({ kind: "help" });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPlacingRot]);

  return (
    <div className="hud-root">
      <div className="hud-top"><TopBar /></div>
      <div className="hud-left"><QuestTracker /><EmpireGuide /></div>
      <div className="hud-right"><Toasts /></div>
      <div className="hud-bottom">
        {mode === "placing" ? (
          <div className="place-toolbar">
            <span className="pt-hint">Choose a clear patch of land · <b>R</b> rotate · <b>Esc</b> cancel</span>
            <button className="act-btn small" onClick={() => setPlacingRot(placingRot + 1)}>Rotate</button>
            <button className="act-btn danger small" onClick={cancelPlacement}>Cancel</button>
          </div>
        ) : selectedId ? <SelectionPanel /> : (
          <button className={`dock-build-btn${panel === "build" ? " active" : ""}`} onClick={() => togglePanel("build")}>Build <span>B</span></button>
        )}
      </div>
      {panel === "build" && mode !== "placing" && <div className="hud-build"><BuildDrawer /></div>}
      <TrainPanel />
      <ArmyPanel />
      <Modals />
    </div>
  );
}

function getBuildingCategory(defId: string): string {
  return BUILDING_DEFS_BY_ID.get(defId)?.category ?? "special";
}
