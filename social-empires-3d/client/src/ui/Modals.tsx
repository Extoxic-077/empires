import { useGame } from "../state/gameStore";
import { useUI } from "../state/uiStore";
import { wipeSave } from "../state/save";

export function Modals() {
  const modal = useUI((s) => s.modal);
  const openModal = useUI((s) => s.openModal);
  const demolish = useGame((s) => s.demolish);
  const resetGame = useGame((s) => s.resetGame);
  const select = useUI((s) => s.select);

  if (!modal) return null;

  return (
    <div className="modal-backdrop" onClick={() => openModal(null)}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        {modal.kind === "confirm-demolish" && (
          <>
            <h3>Demolish building?</h3>
            <p className="dim">You will recover part of the invested resources. Queued training is refunded.</p>
            <div className="modal-actions">
              <button className="act-btn" onClick={() => openModal(null)}>
                Cancel
              </button>
              <button
                className="act-btn danger"
                onClick={() => {
                  demolish(modal.buildingId);
                  select(null);
                  openModal(null);
                }}
              >
                Demolish
              </button>
            </div>
          </>
        )}
        {modal.kind === "reset" && (
          <>
            <h3>Reset your empire?</h3>
            <p className="dim">Everything will be erased and you will start from a fresh Keep. There is no undo.</p>
            <div className="modal-actions">
              <button className="act-btn" onClick={() => openModal(null)}>
                Cancel
              </button>
              <button
                className="act-btn danger"
                onClick={() => {
                  wipeSave();
                  resetGame();
                  openModal(null);
                }}
              >
                Reset Empire
              </button>
            </div>
          </>
        )}
        {modal.kind === "help" && (
          <>
            <h3>How to rule</h3>
            <ul className="help-list">
              <li><b>Drag</b> / WASD — pan · <b>Wheel</b> — zoom · <b>Q/E</b> or Right-drag — rotate</li>
              <li><b>B</b> — open build menu · pick a building, click green ground to place (R rotates)</li>
              <li><b>Click a building</b> — inspect, upgrade, train or demolish</li>
              <li>Resource buildings produce automatically; watch your storage caps!</li>
              <li>Esc closes panels and cancels placement.</li>
            </ul>
            <div className="modal-actions">
              <button className="act-btn primary" onClick={() => openModal(null)}>
                To battle!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
