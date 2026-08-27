import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { getBuildingDef, getUnitDef } from "@shared";
import { hashString } from "../../lib/rng";
import { useGame, type UnitInstance } from "../../state/gameStore";
import type { AgentCtrl } from "../engine/Simulation";
import { buildingCenterWorld } from "../buildings/placement";
import { HumanoidRig, specForUnit } from "./HumanoidRig";
import { DrakeRig } from "./DrakeRig";
import { useShallow } from "zustand/react/shallow";

const GARRISON_CAP = 36;
const PREFERRED_HOSTS = ["barracks", "archery", "wizardtower"];

interface GarrisonEntry {
  unit: UnitInstance;
  ctrl: AgentCtrl;
  anchor: [number, number];
  isDrake: boolean;
  colors: { primary: string; secondary: string; accent: string };
  scale: number;
  seed: number;
}

function hostAnchor(
  buildings: Array<{ defId: string; x: number; y: number; rot: number; status: string }>,
): [number, number] {
  for (const host of PREFERRED_HOSTS) {
    const b = buildings.find((x) => x.defId === host && x.status === "ready");
    if (b) return buildingCenterWorld(b, getBuildingDef(host));
  }
  const th = buildings.find((x) => x.defId === "townhall");
  if (th) return buildingCenterWorld(th, getBuildingDef("townhall"));
  return [0, 0];
}

export function GarrisonLayer() {
  const units = useGame(useShallow((s) => s.units));
  const buildings = useGame(useShallow((s) => s.buildings));

  const entries = useMemo<GarrisonEntry[]>(() => {
    const anchor = hostAnchor(buildings);
    const shown = units.slice(-GARRISON_CAP);
    return shown.map((unit) => {
      const def = getUnitDef(unit.unitId);
      const h1 = hashString(unit.uid);
      const ang = (h1 / 4294967296) * Math.PI * 2;
      const rad = 2.2 + ((hashString(unit.uid + "r") % 100) / 100) * 1.8;
      const ax = anchor[0] + Math.cos(ang) * rad;
      const az = anchor[1] + Math.sin(ang) * rad;
      return {
        unit,
        ctrl: {
          x: ax,
          z: az,
          facing: ang + Math.PI,
          phase: (h1 % 100) / 10,
          activity: "idle",
          visible: true,
        },
        anchor: [ax, az],
        isDrake: unit.unitId === "drake",
        colors: def.colors,
        scale: def.scale,
        seed: h1 % 628,
      };
    });
  }, [units, buildings]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    for (const e of entries) {
      if (e.isDrake) {
        e.ctrl.x = e.anchor[0] + Math.cos(t * 0.45 + e.seed) * 1.5;
        e.ctrl.z = e.anchor[1] + Math.sin(t * 0.45 + e.seed) * 1.5;
        e.ctrl.facing = t * 0.45 + e.seed + Math.PI / 2;
      } else {
        e.ctrl.phase += dt * 2.1;
        e.ctrl.x = e.anchor[0] + Math.sin(t * 0.4 + e.seed) * 0.35;
        e.ctrl.z = e.anchor[1] + Math.cos(t * 0.33 + e.seed * 0.7) * 0.35;
        e.ctrl.facing = Math.sin(t * 0.22 + e.seed) * 1.4 + Math.PI;
      }
    }
  });

  return (
    <group>
      {entries.map((e) =>
        e.isDrake ? (
          <DrakeRig key={e.unit.uid} ctrl={e.ctrl} colors={e.colors} />
        ) : (
          <group key={e.unit.uid} scale={e.scale}>
            <HumanoidRig ctrl={e.ctrl} spec={specForUnit(e.unit.unitId)} />
          </group>
        ),
      )}
    </group>
  );
}
