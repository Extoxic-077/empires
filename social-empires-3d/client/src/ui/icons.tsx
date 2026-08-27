import type { ResourceKey } from "@shared";
import { RESOURCE_COLORS } from "@shared";

export function ResourceIcon({ k, size = 16 }: { k: ResourceKey | "pop"; size?: number }) {
  const s = { width: size, height: size };
  if (k === "gold") {
    return (
      <svg {...s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill={RESOURCE_COLORS.gold} stroke="#8a6a00" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="5" fill="none" stroke="#8a6a00" strokeWidth="1.2" opacity="0.55" />
      </svg>
    );
  }
  if (k === "wood") {
    return (
      <svg {...s} viewBox="0 0 24 24">
        <rect x="3" y="9" width="18" height="7" rx="3.5" fill={RESOURCE_COLORS.wood} stroke="#5c3a1e" strokeWidth="1.4" />
        <circle cx="6.5" cy="12.5" r="2.4" fill="#d8b98a" stroke="#5c3a1e" strokeWidth="1.2" />
        <circle cx="6.5" cy="12.5" r="0.9" fill="#8a6a44" />
      </svg>
    );
  }
  if (k === "stone") {
    return (
      <svg {...s} viewBox="0 0 24 24">
        <path d="M4 17 L7 8 L14 6 L20 11 L18 18 Z" fill={RESOURCE_COLORS.stone} stroke="#5f6a76" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7 8 L12 11 L20 11" fill="none" stroke="#5f6a76" strokeWidth="1.1" opacity="0.7" />
      </svg>
    );
  }
  if (k === "food") {
    return (
      <svg {...s} viewBox="0 0 24 24">
        <path d="M12 21 V10" stroke="#3f7a3d" strokeWidth="2" />
        <path d="M12 13 C7 13 5 9 5 5 C9 5 12 7 12 13 Z" fill={RESOURCE_COLORS.food} stroke="#3f7a3d" strokeWidth="1.2" />
        <path d="M12 13 C17 13 19 9 19 5 C15 5 12 7 12 13 Z" fill={RESOURCE_COLORS.food} stroke="#3f7a3d" strokeWidth="1.2" opacity="0.85" />
      </svg>
    );
  }
  return (
    <svg {...s} viewBox="0 0 24 24">
      <circle cx="12" cy="7.5" r="3.4" fill="#eec39a" stroke="#7a5c3a" strokeWidth="1.3" />
      <path d="M5 20 C5 14.5 8 12.4 12 12.4 C16 12.4 19 14.5 19 20 Z" fill="#5f7f9e" stroke="#39536b" strokeWidth="1.3" />
    </svg>
  );
}

const BUILDING_GLYPHS: Record<string, string> = {
  townhall: "M3 21 V10 L7 7 L12 10 L17 7 L21 10 V21 H14 V15 H10 V21 Z",
  lumbermill: "M12 3 L21 19 H3 Z M12 9 V15",
  goldmine: "M4 20 L10 6 L14 6 L20 20 Z M12 10 L9 20 M12 10 L15 20",
  farm: "M4 21 C4 12 8 8 12 4 C16 8 20 12 20 21 Z M12 21 V12",
  quarry: "M5 20 L8 9 L13 7 L19 12 L17 20 Z",
  storehouse: "M4 10 L12 4 L20 10 V20 H4 Z M10 20 V14 H14 V20",
  barracks: "M4 20 L7 8 L12 11 L17 8 L20 20 Z M8 20 L9 14 L11 14 V20 M13 14 L15 14 L16 20 L13 20 Z",
  archery: "M5 3 C13 7 13 17 5 21 M5 3 L5 21 M8 12 H21 M17 8 L21 12 L17 16",
  wizardtower: "M10 21 L10 9 A2 2 0 0 1 14 9 L14 21 Z M12 3 L13.4 6 H10.6 Z",
  watchtower: "M9 21 V8 H15 V21 Z M7 8 L12 3 L17 8 Z",
  wall: "M4 20 V10 H8 V13 H12 V10 H16 V13 H20 V20 Z",
};

export function BuildingIcon({ id, size = 26 }: { id: string; size?: number }) {
  const path = BUILDING_GLYPHS[id] ?? "M4 4 H20 V20 H4 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={path} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UnitGlyph({ name, color, size = 30 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="unit-glyph" style={{ width: size, height: size, background: `${color}22`, borderColor: color }}>
      <span style={{ color }}>{initials}</span>
    </div>
  );
}
