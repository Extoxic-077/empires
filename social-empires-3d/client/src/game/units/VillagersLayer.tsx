import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { HumanoidRig, villagerSpec } from "./HumanoidRig";
import { MAX_VILLAGERS, sim, type AgentCtrl } from "../engine/Simulation";

export function VillagersLayer() {
  return (
    <group>
      {Array.from({ length: MAX_VILLAGERS }, (_, i) => (
        <VillagerSlot key={i} index={i} />
      ))}
    </group>
  );
}

function VillagerSlot({ index }: { index: number }) {
  const specRef = useRef(villagerSpec(index));
  const proxyRef = useRef<AgentCtrl>({
    x: 0,
    z: 999,
    facing: 0,
    phase: 0,
    activity: "idle",
    visible: false,
  });

  useFrame(() => {
    const src = sim.villagers[index];
    const p = proxyRef.current;
    if (!src) {
      p.visible = false;
      return;
    }
    p.x = src.ctrl.x;
    p.z = src.ctrl.z;
    p.facing = src.ctrl.facing;
    p.phase = src.ctrl.phase;
    p.activity = src.ctrl.activity;
    p.visible = src.ctrl.visible;
  });

  return <HumanoidRig ctrl={proxyRef.current} spec={specRef.current} tool />;
}
