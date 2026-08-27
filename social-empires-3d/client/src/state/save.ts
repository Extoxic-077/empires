import type { SaveFileV1 } from "@shared";
import { useGame } from "./gameStore";

const SAVE_KEY = "aether-empires-save-v1";
const SAVE_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Old development builds occasionally wrote partial entities into localStorage.
 * Never let a corrupt save reach the renderer or simulation: a missing entity id
 * used to cascade into repeated `Cannot read properties of null (reading 'id')`.
 */
function sanitizeSave(value: unknown): SaveFileV1 | null {
  if (!isRecord(value) || value.version !== SAVE_VERSION) return null;
  if (!Array.isArray(value.buildings) || !Array.isArray(value.units)) return null;

  const buildings = value.buildings.filter((entry) => {
    if (!isRecord(entry)) return false;
    return (
      typeof entry.id === "string" && entry.id.length > 0 &&
      typeof entry.defId === "string" && entry.defId.length > 0 &&
      Number.isFinite(entry.x) && Number.isFinite(entry.y) &&
      Number.isFinite(entry.rot)
    );
  });

  const units = value.units.filter((entry) => {
    if (!isRecord(entry)) return false;
    return typeof entry.uid === "string" && entry.uid.length > 0 && typeof entry.unitId === "string" && entry.unitId.length > 0;
  });

  return {
    ...(value as SaveFileV1),
    buildings,
    units,
  };
}

export function loadLocalSave(): SaveFileV1 | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = sanitizeSave(JSON.parse(raw));
    if (!save) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return save;
  } catch {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* storage blocked */
    }
    return null;
  }
}

function writeLocalSave(save: SaveFileV1): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* storage full or blocked — the game remains playable in memory */
  }
}

async function mirrorToServer(save: SaveFileV1): Promise<void> {
  try {
    const response = await fetch("/api/save/local", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(save),
    });
    // The server is an optional development mirror. A failed mirror must never
    // throw into gameplay or trigger an autosave retry loop.
    if (!response.ok) console.warn("[aether-empires] save mirror unavailable", response.status);
  } catch {
    /* offline or server not running — local storage remains source of truth */
  }
}

let dirty = false;
let timer: number | null = null;
let saving = false;

function flush(): void {
  if (!dirty || saving) return;
  dirty = false;
  saving = true;
  const save = useGame.getState().serialize();
  writeLocalSave(save);
  void mirrorToServer(save).finally(() => {
    saving = false;
    if (dirty) flush();
  });
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
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
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
