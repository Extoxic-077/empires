import { useEffect } from "react";
import { gameEvents } from "../lib/events";
import { useUI } from "../state/uiStore";

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const pushToast = useUI((s) => s.pushToast);
  const dismissToast = useUI((s) => s.dismissToast);

  useEffect(() => {
    return gameEvents.on("toast", ({ msg, kind }) => pushToast(msg, kind));
  }, [pushToast]);

  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismissToast(t.id)}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
