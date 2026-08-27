import { create } from "zustand";

export type PanelId = "build" | "quests" | "army" | null;

export interface ToastItem {
  id: number;
  msg: string;
  kind: "info" | "success" | "error";
}

interface UIState {
  mode: "idle" | "placing";
  placingDefId: string | null;
  placingRot: number;
  hoveredTile: { x: number; y: number } | null;
  selectedId: string | null;
  panel: PanelId;
  toasts: ToastItem[];
  modal: null | { kind: "confirm-demolish"; buildingId: string } | { kind: "reset" } | { kind: "help" };
  trainForBuildingId: string | null;

  startPlacement: (defId: string) => void;
  setPlacingRot: (rot: number) => void;
  rotatePlacing: () => void;
  cancelPlacement: () => void;
  setHoveredTile: (tile: { x: number; y: number } | null) => void;
  select: (id: string | null) => void;
  setPanel: (panel: PanelId) => void;
  togglePanel: (panel: Exclude<PanelId, null>) => void;
  openTrain: (buildingId: string | null) => void;
  pushToast: (msg: string, kind?: ToastItem["kind"]) => void;
  dismissToast: (id: number) => void;
  openModal: (modal: UIState["modal"]) => void;
}

let toastId = 0;

export const useUI = create<UIState>()((set, get) => ({
  mode: "idle",
  placingDefId: null,
  placingRot: 0,
  hoveredTile: null,
  selectedId: null,
  panel: null,
  toasts: [],
  modal: null,
  trainForBuildingId: null,

  startPlacement: (defId) =>
    set({ mode: "placing", placingDefId: defId, placingRot: 0, selectedId: null }),
  setPlacingRot: (rot) => set({ placingRot: ((rot % 4) + 4) % 4 }),
  rotatePlacing: () => set((s) => ({ placingRot: (s.placingRot + 1) % 4 })),
  cancelPlacement: () => set({ mode: "idle", placingDefId: null, hoveredTile: null }),
  setHoveredTile: (tile) => {
    const cur = get().hoveredTile;
    if (cur === tile) return;
    if (cur && tile && cur.x === tile.x && cur.y === tile.y) return;
    set({ hoveredTile: tile });
  },
  select: (id) => {
    if (get().mode === "placing" && id !== null) return;
    set({ selectedId: id });
  },
  setPanel: (panel) => set({ panel }),
  togglePanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel })),
  openTrain: (buildingId) => set({ trainForBuildingId: buildingId }),
  pushToast: (msg, kind = "info") => {
    toastId += 1;
    const item = { id: toastId, msg, kind };
    set((s) => ({ toasts: [...s.toasts.slice(-5), item] }));
    window.setTimeout(() => get().dismissToast(item.id), 3600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openModal: (modal) => set({ modal }),
}));
