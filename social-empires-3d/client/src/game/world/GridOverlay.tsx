import { useMemo } from "react";
import * as THREE from "three";
import { BUILD_AREA_MAX, BUILD_AREA_MIN, TILE_SIZE } from "@shared";
import { ghostMat } from "../../lib/threeCache";
import { usePlacementState } from "../buildings/usePlacement";
import { tileToWorldCenter } from "../buildings/placement";

export function GridOverlay() {
  const placing = usePlacementState();

  const linesGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = BUILD_AREA_MIN; i <= BUILD_AREA_MAX + 1; i++) {
      const x = tileToWorldCenter(i) - TILE_SIZE / 2;
      pts.push(x, 0.04, tileToWorldCenter(BUILD_AREA_MIN) - TILE_SIZE / 2);
      pts.push(x, 0.04, tileToWorldCenter(BUILD_AREA_MAX) + TILE_SIZE / 2);
      const z = tileToWorldCenter(i) - TILE_SIZE / 2;
      pts.push(tileToWorldCenter(BUILD_AREA_MIN) - TILE_SIZE / 2, 0.04, z);
      pts.push(tileToWorldCenter(BUILD_AREA_MAX) + TILE_SIZE / 2, 0.04, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  if (!placing) return <lineSegments geometry={linesGeo} visible={false} />;

  const wPx = placing.sizeW * TILE_SIZE;
  const dPx = placing.sizeD * TILE_SIZE;

  return (
    <group>
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
      <mesh
        position={[placing.centerWorld[0], 0.05, placing.centerWorld[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={ghostMat(placing.valid)}
      >
        <planeGeometry args={[wPx, dPx]} />
      </mesh>
      <mesh
        position={[placing.centerWorld[0], 0.06, placing.centerWorld[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[
            Math.max(wPx, dPx) * 0.52,
            Math.max(wPx, dPx) * 0.56,
            4,
            1,
            Math.PI / 4,
            Math.PI * 2,
          ]}
        />
        <meshBasicMaterial color={placing.valid ? "#7dffa8" : "#ff8b84"} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
