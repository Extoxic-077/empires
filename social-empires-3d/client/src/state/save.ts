import type { SaveFileV1 } from "@shared";
import { useGame } from "./gameStore";

const SAVE_KEY = "aether-empires-save-v1";

export function loadLocalSave(): SaveFileV1 | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveFileV1;
    if (parsed.version !== 1 || !Array.isArray(parsed.buildings)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalSave(save: SaveFileV1): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* storage full or blocked — server mirror may still succeed */
  }
}

async function mirrorToServer(save: SaveFileV1): Promise<void> {
  try {
    await fetch("/api/save/local", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(save),
    });
  } catch {
    /* offline or server not running — local storage remains source of truth */
  }
}

let dirty = false;
let timer: number | null = null;

function flush(): void {
  if (!dirty) return;
  dirty = false;
  const save = useGame.getState().serialize();
  writeLocalSave(save);
  void mirrorToServer(save);
}

function scheduleFlush(): void {
  dirty = true;
  if (timer !== null) return;
  timer = window.setTimeout(() => {
    timer = null;
    flush();
  }, 900);
}

export function initAutoSave(): () => void {
  const unsub = useGame.subscribe(() => scheduleFlush());
  const interval = window.setInterval(flush, 20000);
  const onLeave = (): void => flush();
  window.addEventListener("beforeunload", onLeave);
  return () => {
    unsub();
    window.clearInterval(interval);
    window.removeEventListener("beforeunload", onLeave);
    flush();
  };
}

export function wipeSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
