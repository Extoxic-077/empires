import { useEffect, useState } from "react";
import { GameCanvas } from "./game/GameCanvas";
import { Hud } from "./ui/Hud";
import { ErrorBoundary } from "./ErrorBoundary";
import { initAutoSave, loadLocalSave } from "./state/save";
import { useGame } from "./state/gameStore";
import { useUI } from "./state/uiStore";
import { sim } from "./game/engine/Simulation";

export function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const stopAutosave = initAutoSave();
    const save = loadLocalSave();
    if (save) {
      useGame.getState().hydrate(save);
      sim.markNavDirty();
      useGame.getState().finalizeAll(Date.now());
    } else {
      if (!localStorage.getItem("ae-seen-help")) {
        localStorage.setItem("ae-seen-help", "1");
        useUI.getState().openModal({ kind: "help" });
      }
    }
    const t = window.setTimeout(() => setBooting(false), 650);
    return () => {
      stopAutosave();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <>
      <ErrorBoundary>
        <div className="canvas-holder">
          <GameCanvas />
          <div className="vignette" />
        </div>
        <Hud />
      </ErrorBoundary>
      <div className={`loading-screen${booting ? "" : " hide"}`}>
        <div className="game-logo">AETHER EMPIRES</div>
        <div className="game-sub">Raise your banner</div>
        <div className="load-bar">
          <div className="load-fill" />
        </div>
      </div>
    </>
  );
}
