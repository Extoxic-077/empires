import * as THREE from "three";
import type { ReactNode } from "react";
import { TILE_SIZE, getBuildingDef } from "@shared";
import { B, C, K, S, P } from "../../../lib/prims";
import { geoCyl } from "../../../lib/threeCache";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bobber,
  Chimney,
  ClothFlag,
  FlagPole,
  OrbitRing,
  Pulsor,
  Spinner,
} from "./parts";

const STONE = "#a7b0ba";
const STONE_DARK = "#7e8894";
const WOOD = "#8a5a33";
const WOOD_DARK = "#66431f";
const PLASTER = "#ecdfc4";
const ROOF_RED = "#b5432f";
const ROOF_BLUE = "#4a6fa5";
const GOLD = "#ffd166";
const CANVAS = "#e3dbc2";
const LEAF = "#5c9c4e";

function dim(id: string): { w: number; d: number } {
  const def = getBuildingDef(id);
  return { w: def.width * TILE_SIZE, d: def.depth * TILE_SIZE };
}

const merlonGeo = new THREE.BoxGeometry(0.22, 0.26, 0.14);

function MerlonRing({ count, radius, y }: { count: number; radius: number; y: number }) {
  const items: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    items.push(
      <mesh
        key={i}
        geometry={merlonGeo}
        material={matStoneDark()}
        position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
        rotation={[0, -a, 0]}
        castShadow
      />
    );
  }
  return <group>{items}</group>;
}

let _stoneDarkMat: THREE.MeshStandardMaterial | null = null;
function matStoneDark(): THREE.MeshStandardMaterial {
  if (!_stoneDarkMat) {
    _stoneDarkMat = new THREE.MeshStandardMaterial({ color: STONE_DARK, roughness: 0.92 });
  }
  return _stoneDarkMat;
}

const crystalGeoBig = new THREE.OctahedronGeometry(0.26);
const crystalGeoSmall = new THREE.OctahedronGeometry(0.18);
const crystalGeoSpire = new THREE.OctahedronGeometry(0.42);
const windmillBladeGeo = new THREE.PlaneGeometry(0.26, 1.35);
const runeBoxGeo = new THREE.BoxGeometry(0.1, 0.34, 0.05);

function Slider({
  ax,
  az,
  bx,
  bz,
  period = 5,
  y = 0,
  children,
}: {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  period?: number;
  y?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  const dir = useRef(1);
  useFrame((_, dt) => {
    t.current += dt / period;
    if (t.current >= 1) {
      t.current = 0;
      dir.current *= -1;
    }
    const e = t.current < 0.5 ? 2 * t.current * t.current : 1 - Math.pow(-2 * t.current + 2, 2) / 2;
    const k = dir.current > 0 ? e : 1 - e;
    if (ref.current) {
      ref.current.position.x = ax + (bx - ax) * k;
      ref.current.position.z = az + (bz - az) * k;
      ref.current.position.y = y;
    }
  });
  return <group ref={ref}>{children}</group>;
}

export function TownHallModel({ level }: { level: number }) {
  const { w, d } = dim("townhall");
  return (
    <group>
      <P w={w * 0.98} h={d * 0.98} y={0.06} c={STONE_DARK} rough={0.95} />
      <B w={w * 0.86} h={0.42} d={d * 0.86} y={0.32} c={STONE} />
      <B w={w * 0.58} h={2.1} d={d * 0.52} y={1.55} c={PLASTER} />
      <K r={w * 0.47} h={1.7} seg={4} y={3.45} c={ROOF_RED} ry={Math.PI / 4} />
      <B w={0.9} h={1.3} d={0.12} y={0.95} z={d * 0.27} c={WOOD_DARK} />
      <C rt={0.42} rb={0.48} h={2.6} seg={8} x={-w * 0.34} y={1.75} z={-d * 0.28} c={STONE} />
      <K r={0.62} h={0.9} seg={8} x={-w * 0.34} y={3.5} z={-d * 0.28} c={ROOF_BLUE} />
      {level >= 2 && (
        <>
          <C rt={0.42} rb={0.48} h={2.6} seg={8} x={w * 0.34} y={1.75} z={-d * 0.28} c={STONE} />
          <K r={0.62} h={0.9} seg={8} x={w * 0.34} y={3.5} z={-d * 0.28} c={ROOF_BLUE} />
          <B w={w * 0.6} h={0.16} d={0.16} y={2.68} z={-d * 0.27} c={GOLD} metal={0.65} rough={0.3} />
        </>
      )}
      {level >= 3 && (
        <>
          <B w={w * 0.94} h={0.72} d={0.34} y={0.86} z={d * 0.46} c={STONE_DARK} />
          <B w={w * 0.94} h={0.72} d={0.34} y={0.86} z={-d * 0.46} c={STONE_DARK} />
          <B w={0.34} h={0.72} d={d * 0.94} y={0.86} x={w * 0.46} c={STONE_DARK} />
          <B w={0.34} h={0.72} d={d * 0.94} y={0.86} x={-w * 0.46} c={STONE_DARK} />
        </>
      )}
      {level >= 4 ? (
        <group position={[0, 0, -d * 0.05]}>
          <C rt={0.55} rb={0.66} h={4.6} seg={10} y={2.9} c={STONE} />
          <K r={0.78} h={1.3} seg={10} y={5.85} c={ROOF_BLUE} />
          <C rt={0.035} rb={0.05} h={1.4} seg={5} y={6.95} c="#6b4f2a" />
          <group position={[0.03, 7.25, 0]}>
            <ClothFlag w={1.3} h={0.72} color={GOLD} />
          </group>
        </group>
      ) : (
        <FlagPole height={2.2} color={ROOF_RED} z={-d * 0.05} />
      )}
      <Chimney lx={w * 0.22} lz={d * 0.16} h={3.4} />
    </group>
  );
}

export function GoldMineModel({ level }: { level: number }) {
  const { w, d } = dim("goldmine");
  return (
    <group>
      <P w={w * 0.96} h={d * 0.96} y={0.05} c="#8f7a55" rough={0.97} />
      <K r={w * 0.42} h={1.5} seg={7} y={0.75} c="#7d6a49" />
      <B w={0.95} h={1.05} d={0.3} y={0.5} z={d * 0.3} c="#241c12" />
      <B w={0.12} h={1.15} d={0.14} y={0.57} z={d * 0.38} x={-0.5} c={WOOD_DARK} />
      <B w={0.12} h={1.15} d={0.14} y={0.57} z={d * 0.38} x={0.5} c={WOOD_DARK} />
      <B w={1.25} h={0.13} d={0.15} y={1.2} z={d * 0.38} c={WOOD_DARK} />
      <P w={w * 0.7} h={0.34} y={0.07} z={d * 0.42} c="#5c4a30" />
      <Slider ax={-w * 0.22} az={d * 0.42} bx={w * 0.24} bz={d * 0.42} period={4.4}>
        <Bobber lift={0.22} amp={0.03} speed={9}>
          <B w={0.42} h={0.3} d={0.3} c="#6d4f2c" metal={0.25} rough={0.7}>
            <S r={0.09} c={GOLD} metal={0.8} rough={0.3} y={0.18} />
          </B>
        </Bobber>
      </Slider>
      <group position={[w * 0.3, 0.3, -d * 0.22]}>
        <mesh geometry={crystalGeoBig} material={matGold()} castShadow scale={1.2} position={[0, 0.1, 0]} />
        {level >= 2 && (
          <mesh geometry={crystalGeoSmall} material={matGold()} castShadow position={[0.3, 0.02, 0.14]} scale={1.1} />
        )}
      </group>
      {level >= 3 && (
        <B w={w * 0.5} h={0.14} d={d * 0.5} y={1.52} c="#6e5c3e" rz={0.12} x={-w * 0.1} />
      )}
      {level >= 4 && (
        <group position={[0, 0, -d * 0.1]}>
          <mesh geometry={crystalGeoSpire} material={matGold()} castShadow position={[0, 1.9, 0]} />
          <C rt={0.1} rb={0.14} h={1.6} seg={6} y={0.8} c={WOOD_DARK} />
        </group>
      )}
      <Chimney lx={-w * 0.3} lz={d * 0.1} h={2.2} />
    </group>
  );
}

let _goldMat: THREE.MeshStandardMaterial | null = null;
function matGold(): THREE.MeshStandardMaterial {
  if (!_goldMat) {
    _goldMat = new THREE.MeshStandardMaterial({
      color: GOLD,
      emissive: new THREE.Color("#7a5b00"),
      emissiveIntensity: 0.5,
      metalness: 0.75,
      roughness: 0.28,
      flatShading: true,
    });
  }
  return _goldMat;
}

export function LumberMillModel({ level }: { level: number }) {
  const { w, d } = dim("lumbermill");
  return (
    <group>
      <P w={w * 0.95} h={d * 0.95} y={0.05} c="#9c8054" rough={0.97} />
      <B w={w * 0.52} h={1.5} d={d * 0.6} y={0.8} x={-w * 0.16} c={WOOD} />
      <B w={w * 0.56} h={0.18} d={d * 0.66} y={1.62} x={-w * 0.16} rz={0.14} c={WOOD_DARK} />
      <B w={0.55} h={0.85} d={0.1} y={0.45} x={-w * 0.16} z={d * 0.31} c={WOOD_DARK} />
      <Chimney lx={-w * 0.3} lz={-d * 0.2} h={2.4} />
      <group position={[w * 0.22, 0.95, d * 0.1]}>
        <Spinner speed={7}>
          <mesh geometry={geoCyl(0.82, 0.82, 0.07, 20)} material={matBlade()} rotation={[0, 0, Math.PI / 2]} castShadow />
        </Spinner>
      </group>
      <B w={w * 0.34} h={0.5} d={d * 0.2} y={0.3} x={w * 0.22} z={-d * 0.32} c={WOOD_DARK} />
      <group position={[-w * 0.05, 0, d * 0.36]}>
        <mesh geometry={geoCyl(0.16, 0.16, w * 0.55, 8)} material={matLog()} rotation={[0, 0, Math.PI / 2]} position={[0, 0.16, 0]} castShadow />
        <mesh geometry={geoCyl(0.16, 0.16, w * 0.5, 8)} material={matLog()} rotation={[0, 0, Math.PI / 2]} position={[0.04, 0.44, 0.05]} castShadow />
      </group>
      {level >= 2 && (
        <group position={[w * 0.3, 0.95, -d * 0.05]}>
          <Spinner speed={5.4}>
            <mesh geometry={geoCyl(0.6, 0.6, 0.06, 18)} material={matBlade()} rotation={[0, 0, Math.PI / 2]} castShadow />
          </Spinner>
        </group>
      )}
      {level >= 3 && (
        <B w={w * 0.3} h={1.1} d={d * 0.4} y={0.55} x={w * 0.3} z={d * 0.28} c={WOOD} />
      )}
      {level >= 4 && <FlagPole height={2.4} color="#2f6f3f" z={-d * 0.42} />}
    </group>
  );
}

let _bladeMat: THREE.MeshStandardMaterial | null = null;
function matBlade(): THREE.MeshStandardMaterial {
  if (!_bladeMat) {
    _bladeMat = new THREE.MeshStandardMaterial({ color: "#c3ccd3", metalness: 0.6, roughness: 0.35 });
  }
  return _bladeMat;
}

let _logMat: THREE.MeshStandardMaterial | null = null;
function matLog(): THREE.MeshStandardMaterial {
  if (!_logMat) {
    _logMat = new THREE.MeshStandardMaterial({ color: "#a9713f", roughness: 0.9, flatShading: true });
  }
  return _logMat;
}

export function FarmModel({ level }: { level: number }) {
  const { w, d } = dim("farm");
  const cropColor = level >= 3 ? "#e0c25a" : "#7fb35a";
  const rows: ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let cIdx = 0; cIdx < 5; cIdx++) {
      rows.push(
        <B key={`${r}-${cIdx}`} w={0.24} h={0.26} d={0.24} y={0.22} x={-w * 0.28 + cIdx * w * 0.14} z={-d * 0.24 + r * d * 0.16} c={cropColor} rough={0.8} />,
      );
    }
  }
  return (
    <group>
      <P w={w * 0.97} h={d * 0.97} y={0.05} c="#8f6f42" rough={0.98} />
      {rows}
      <group position={[w * 0.32, 0, -d * 0.28]}>
        <B w={1.15} h={1.0} d={0.95} y={0.55} c={ROOF_RED} rough={0.85} />
        <B w={1.25} h={0.14} d={1.05} y={1.12} rz={0} c={WOOD_DARK} />
        <B w={0.3} h={0.5} d={0.06} y={0.28} z={0.49} c={WOOD_DARK} />
      </group>
      <group position={[-w * 0.34, 0, d * 0.32]}>
        <C rt={0.16} rb={0.22} h={2.1} seg={7} y={1.05} c={PLASTER} />
        <group position={[0, 2.15, 0.12]}>
          <Spinner speed={1.5} axis="z">
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} geometry={windmillBladeGeo} material={matCanvas()} rotation={[0, 0, (i * Math.PI) / 2]} castShadow />
            ))}
            <S r={0.09} c={WOOD_DARK} />
          </Spinner>
        </group>
      </group>
      {level >= 2 && (
        <group position={[-w * 0.05, 0, -d * 0.36]}>
          <C rt={0.03} rb={0.04} h={1.1} seg={5} y={0.55} c={WOOD_DARK} />
          <B w={0.5} h={0.06} d={0.06} y={0.95} c={WOOD_DARK} />
          <S r={0.12} c="#e8c39e" y={1.12} />
        </group>
      )}
      {level >= 4 && <FlagPole height={2.1} color="#d9b64e" z={d * 0.44} />}
    </group>
  );
}

let _canvasMat: THREE.MeshStandardMaterial | null = null;
function matCanvas(): THREE.MeshStandardMaterial {
  if (!_canvasMat) {
    _canvasMat = new THREE.MeshStandardMaterial({ color: CANVAS, roughness: 0.9, side: THREE.DoubleSide });
  }
  return _canvasMat;
}

export function QuarryModel({ level }: { level: number }) {
  const { w, d } = dim("quarry");
  return (
    <group>
      <P w={w * 0.96} h={d * 0.96} y={0.05} c="#9aa0a6" rough={0.97} />
      <C rt={w * 0.3} rb={w * 0.36} h={0.5} seg={9} y={0.22} c="#8b9198" />
      <C rt={w * 0.2} rb={w * 0.3} h={0.52} seg={9} y={0.5} c="#5f666d" />
      <group position={[w * 0.28, 0, d * 0.28]}>
        <C rt={0.07} rb={0.09} h={2.6} seg={6} y={1.3} c={WOOD_DARK} />
        <group position={[0, 2.5, 0]}>
          <Spinner speed={0.5}>
            <B w={1.7} h={0.12} d={0.12} x={0.7} c={WOOD} />
          </Spinner>
          <Bobber lift={-0.7} amp={0.06} speed={1.4}>
            <group position={[1.35, 0, 0]}>
              <C rt={0.02} rb={0.02} h={1.1} seg={4} y={0.55} c="#3f3f3f" noShadow />
              <B w={0.3} h={0.24} d={0.3} y={-0.05} c={STONE} />
            </group>
          </Bobber>
        </group>
      </group>
      <B w={0.5} h={0.4} d={0.5} y={0.2} x={-w * 0.3} z={d * 0.28} c={STONE} rz={0.2} />
      <B w={0.44} h={0.36} d={0.44} y={0.18} x={-w * 0.22} z={d * 0.36} c={STONE_DARK} rx={0.15} />
      {level >= 2 && <B w={0.56} h={0.44} d={0.5} y={0.22} x={-w * 0.32} z={-d * 0.2} c={STONE} ry={0.5} />}
      {level >= 3 && <B w={0.5} h={0.4} d={0.46} y={0.2} x={w * 0.05} z={-d * 0.34} c={STONE_DARK} ry={0.3} />}
      {level >= 4 && <FlagPole height={2.2} color="#ff8c42" z={-d * 0.42} />}
      <Chimney lx={w * 0.3} lz={-d * 0.3} h={2.6} />
    </group>
  );
}

export function StorehouseModel({ level }: { level: number }) {
  const { w, d } = dim("storehouse");
  return (
    <group>
      <P w={w * 0.95} h={d * 0.95} y={0.05} c="#9c8054" rough={0.97} />
      <B w={w * 0.62} h={1.6} d={d * 0.62} y={0.85} x={-w * 0.08} c={WOOD} />
      <mesh geometry={new THREE.CylinderGeometry(0.01, w * 0.46, 0.85, 4)} material={matRoofWood()} rotation={[0, Math.PI / 4, 0]} position={[-w * 0.08, 2.05, 0]} castShadow />
      <B w={0.7} h={0.95} d={0.1} y={0.5} x={-w * 0.08} z={d * 0.32} c={WOOD_DARK} />
      <B w={0.5} h={0.5} d={0.5} y={0.25} x={w * 0.3} z={d * 0.28} c={WOOD_DARK} ry={0.4} />
      <mesh geometry={geoCyl(0.22, 0.22, 0.5, 9)} material={matBarrel()} position={[w * 0.32, 0.25, -d * 0.2]} castShadow />
      {level >= 2 && (
        <>
          <B w={0.5} h={0.5} d={0.5} y={0.25} x={w * 0.3} z={d * 0.02} c={WOOD_DARK} ry={0.2} />
          <mesh geometry={geoCyl(0.22, 0.22, 0.5, 9)} material={matBarrel()} position={[w * 0.05, 0.25, -d * 0.34]} castShadow />
        </>
      )}
      {level >= 3 && (
        <>
          <B w={0.5} h={0.5} d={0.5} y={0.75} x={w * 0.3} z={d * 0.28} c={WOOD} ry={0.4} />
          <B w={w * 0.66} h={0.14} d={0.1} y={2.0} x={-w * 0.08} z={d * 0.33} c={GOLD} metal={0.5} rough={0.4} />
        </>
      )}
    </group>
  );
}

let _roofWoodMat: THREE.MeshStandardMaterial | null = null;
function matRoofWood(): THREE.MeshStandardMaterial {
  if (!_roofWoodMat) {
    _roofWoodMat = new THREE.MeshStandardMaterial({ color: "#6f4a26", roughness: 0.85, flatShading: true });
  }
  return _roofWoodMat;
}

let _barrelMat: THREE.MeshStandardMaterial | null = null;
function matBarrel(): THREE.MeshStandardMaterial {
  if (!_barrelMat) {
    _barrelMat = new THREE.MeshStandardMaterial({ color: "#8a5f33", roughness: 0.85 });
  }
  return _barrelMat;
}

export function BarracksModel({ level }: { level: number }) {
  const { w, d } = dim("barracks");
  return (
    <group>
      <P w={w * 0.96} h={d * 0.96} y={0.05} c="#8f8455" rough={0.97} />
      <K r={1.15} h={1.5} seg={7} x={-w * 0.22} z={-d * 0.18} y={0.8} c={CANVAS} />
      <K r={0.95} h={1.25} seg={7} x={w * 0.18} z={-d * 0.26} y={0.67} c="#d6cdb2" />
      <B w={0.1} h={1.15} d={0.1} y={0.57} x={-w * 0.22} z={-d * 0.18} c={WOOD_DARK} />
      <group position={[w * 0.05, 0, d * 0.3]}>
        <B w={1.3} h={0.09} d={0.09} y={1.05} c={WOOD_DARK} />
        <C rt={0.05} rb={0.06} h={1.1} seg={5} x={-0.6} y={0.55} c={WOOD_DARK} />
        <C rt={0.05} rb={0.06} h={1.1} seg={5} x={0.6} y={0.55} c={WOOD_DARK} />
        <B w={0.09} h={0.6} d={0.16} y={0.78} x={-0.2} c="#cfd6dd" metal={0.7} rough={0.3} />
        <B w={0.09} h={0.6} d={0.16} y={0.78} x={0.15} c="#cfd6dd" metal={0.7} rough={0.3} rz={0.2} />
      </group>
      <FlagPole height={2.8} color={ROOF_RED} z={d * 0.42} x={-w * 0.4} />
      {level >= 2 && (
        <group position={[w * 0.42, 0, d * 0.05]}>
          <mesh geometry={geoCyl(0.42, 0.42, 0.08, 14)} material={matShield()} rotation={[0, 0, 0]} position={[0, 1.5, 0]} castShadow />
          <C rt={0.06} rb={0.08} h={1.6} seg={6} y={0.8} c={WOOD_DARK} />
        </group>
      )}
      {level >= 3 && (
        <group position={[w * 0.36, 0, d * 0.36]}>
          <C rt={0.5} rb={0.56} h={2.4} seg={8} y={1.2} c={STONE} />
          <K r={0.68} h={0.8} seg={8} y={2.8} c={ROOF_RED} />
        </group>
      )}
      <Chimney lx={-w * 0.05} lz={-d * 0.42} h={1.9} />
    </group>
  );
}

let _shieldMat: THREE.MeshStandardMaterial | null = null;
function matShield(): THREE.MeshStandardMaterial {
  if (!_shieldMat) {
    _shieldMat = new THREE.MeshStandardMaterial({ color: "#b03a3a", roughness: 0.6, metalness: 0.2 });
  }
  return _shieldMat;
}

export function ArcheryModel({ level }: { level: number }) {
  const { w, d } = dim("archery");
  const targets: ReactNode[] = [];
  const xs = [-w * 0.26, 0, w * 0.26];
  for (let i = 0; i < 3; i++) {
    targets.push(
      <group key={i} position={[xs[i], 0, -d * 0.28]}>
        <mesh geometry={geoCyl(0.5, 0.5, 0.08, 16)} material={matTarget("#f5f0e0")} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.85, 0]} castShadow />
        <mesh geometry={geoCyl(0.3, 0.3, 0.09, 16)} material={matTarget("#d94f3d")} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.85, 0.005]} castShadow={false} />
        <mesh geometry={geoCyl(0.12, 0.12, 0.1, 12)} material={matTarget("#f5f0e0")} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.85, 0.01]} castShadow={false} />
        <C rt={0.05} rb={0.06} h={0.9} seg={5} y={0.45} c={WOOD_DARK} />
      </group>,
    );
  }
  return (
    <group>
      <P w={w * 0.96} h={d * 0.96} y={0.05} c="#6faf58" rough={0.97} />
      {targets}
      <group position={[0, 0, d * 0.32]}>
        <B w={w * 0.8} h={0.1} d={0.1} y={0.55} c={WOOD} />
        <C rt={0.06} rb={0.07} h={0.6} seg={5} x={-w * 0.4} y={0.3} c={WOOD} />
        <C rt={0.06} rb={0.07} h={0.6} seg={5} x={w * 0.4} y={0.3} c={WOOD} />
      </group>
      {level >= 2 && (
        <group position={[0, 0, d * 0.32]}>
          <B w={w * 0.84} h={0.12} d={d * 0.3} y={1.25} rz={0.1} c={ROOF_BLUE} />
        </group>
      )}
      {level >= 3 && (
        <>
          <group position={[w * 0.34, 0, d * 0.02]}>
            <mesh geometry={geoCyl(0.42, 0.42, 0.08, 14)} material={matTarget("#f5f0e0")} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.0, 0]} />
            <mesh geometry={geoCyl(0.24, 0.24, 0.09, 14)} material={matTarget("#d94f3d")} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.0, 0.006]} />
            <C rt={0.05} rb={0.06} h={1.05} seg={5} y={0.52} c={WOOD_DARK} />
          </group>
          <FlagPole height={2.3} color="#3f7d4e" x={-w * 0.42} z={d * 0.4} />
        </>
      )}
    </group>
  );
}

let _targetMats = new Map<string, THREE.MeshStandardMaterial>();
function matTarget(color: string): THREE.MeshStandardMaterial {
  let m = _targetMats.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    _targetMats.set(color, m);
  }
  return m;
}

export function WizardTowerModel({ level }: { level: number }) {
  const { w } = dim("wizardtower");
  const h = level >= 3 ? 5.2 : 4.2;
  return (
    <group>
      <P w={w * 0.95} h={w * 0.95} y={0.05} c="#8f83ad" rough={0.96} />
      <C rt={0.78} rb={0.95} h={h} seg={9} y={h / 2 + 0.1} c="#7f6fae" />
      <S r={0.85} seg={10} y={h + 0.25} c="#6d5da0" />
      <K r={0.95} h={1.15} seg={9} y={h + 1.15} c="#4b3f7a" />
      <group position={[0, h + 1.9, 0]}>
        <Pulsor min={0.85} max={1.2} speed={2.2}>
          <S r={0.2} c="#bde9ff" emissive="#59c8ff" emissiveIntensity={2.2} rough={0.2} />
        </Pulsor>
      </group>
      <OrbitRing radius={1.15} y={h * 0.72} count={level >= 2 ? 4 : 3} color="#8be0ff" size={0.13} speed={1.1} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            geometry={runeBoxGeo}
            material={matRune()}
            position={[Math.sin(a) * 0.93, h * 0.4, Math.cos(a) * 0.93]}
            rotation={[0, a, 0]}
          />
        );
      })}
      {level >= 2 && (
        <C rt={0.03} rb={0.05} h={1.4} seg={5} y={h + 2.4} c={STONE_DARK} />
      )}
      {level >= 3 && (
        <OrbitRing radius={1.6} y={h * 0.4} count={5} color="#c77dff" size={0.1} speed={-0.8} />
      )}
    </group>
  );
}

let _runeMat: THREE.MeshStandardMaterial | null = null;
function matRune(): THREE.MeshStandardMaterial {
  if (!_runeMat) {
    _runeMat = new THREE.MeshStandardMaterial({
      color: "#9fe8ff",
      emissive: new THREE.Color("#3fa9d8"),
      emissiveIntensity: 1.4,
    });
  }
  return _runeMat;
}

export function WatchTowerModel({ level }: { level: number }) {
  const { w } = dim("watchtower");
  const h = 2.6 + level * 0.55;
  return (
    <group>
      <P w={w * 0.98} h={w * 0.98} y={0.05} c={STONE_DARK} rough={0.97} />
      <C rt={0.52} rb={0.68} h={h} seg={8} y={h / 2} c={STONE} />
      <C rt={0.78} rb={0.64} h={0.3} seg={8} y={h + 0.15} c={STONE_DARK} />
      <MerlonRing count={7} radius={0.66} y={h + 0.42} />
      <group position={[0, h + 0.62, 0]}>
        <Pulsor min={0.8} max={1.25} speed={5}>
          <S r={0.16} c="#ffb703" emissive="#ff7b00" emissiveIntensity={2.6} rough={0.3} />
        </Pulsor>
      </group>
      {level >= 2 && <C rt={0.3} rb={0.36} h={0.5} seg={6} y={h + 0.5} c={WOOD_DARK} />}
      {level >= 3 && <FlagPole height={1.6} color="#ff8c42" />}
    </group>
  );
}

export function WallModel({ level }: { level: number }) {
  const h = level === 1 ? 1.05 : level === 2 ? 1.3 : 1.5;
  return (
    <group>
      <B w={1.94} h={h} d={0.78} y={h / 2} c={STONE} rough={0.92} />
      <B w={1.98} h={0.16} d={0.86} y={h + 0.08} c={STONE_DARK} />
      <B w={0.3} h={0.24} d={0.86} y={h + 0.28} x={-0.66} c={STONE_DARK} />
      <B w={0.3} h={0.24} d={0.86} y={h + 0.28} c={STONE_DARK} />
      <B w={0.3} h={0.24} d={0.86} y={h + 0.28} x={0.66} c={STONE_DARK} />
      {level >= 2 && <B w={0.24} h={h * 0.7} d={1.0} y={h * 0.35} x={0.85} c={STONE_DARK} />}
      {level >= 3 && <B w={2.0} h={0.08} d={0.9} y={h + 0.18} c={GOLD} metal={0.5} rough={0.4} />}
    </group>
  );
}
