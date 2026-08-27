import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "../../lib/rng";
import { ISLAND_RADIUS, TERRAIN_SEED, WATER_LEVEL, terrainHeightAt } from "./terrainMath";

function paintGeo(geo: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color(hex);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

function pineGeo(): THREE.BufferGeometry {
  const trunk = paintGeo(new THREE.CylinderGeometry(0.16, 0.24, 1.1, 6), "#7a5230");
  trunk.translate(0, 0.55, 0);
  const c1 = paintGeo(new THREE.ConeGeometry(1.25, 1.7, 7), "#3e7d46");
  c1.translate(0, 1.7, 0);
  const c2 = paintGeo(new THREE.ConeGeometry(0.95, 1.5, 7), "#4b8f4f");
  c2.translate(0, 2.75, 0);
  const c3 = paintGeo(new THREE.ConeGeometry(0.62, 1.2, 7), "#57a058");
  c3.translate(0, 3.7, 0);
  return mergeGeometries([trunk, c1, c2, c3], false) as THREE.BufferGeometry;
}

function oakGeo(): THREE.BufferGeometry {
  const trunk = paintGeo(new THREE.CylinderGeometry(0.2, 0.32, 1.4, 6), "#83603a");
  trunk.translate(0, 0.7, 0);
  const b1 = paintGeo(new THREE.IcosahedronGeometry(1.15, 0), "#5c9c4e");
  b1.translate(0, 2.15, 0);
  const b2 = paintGeo(new THREE.IcosahedronGeometry(0.85, 0), "#6cae59");
  b2.translate(0.55, 1.7, 0.3);
  const b3 = paintGeo(new THREE.IcosahedronGeometry(0.8, 0), "#549349");
  b3.translate(-0.55, 1.85, -0.35);
  return mergeGeometries([trunk, b1, b2, b3], false) as THREE.BufferGeometry;
}

function rockGeo(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const s = 0.82 + ((i * 2654435761) % 100) / 320;
    pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s * 0.72, pos.getZ(i) * s);
  }
  g.computeVertexNormals();
  return paintGeo(g, "#98a0a6");
}

const EXCLUSION_MARGIN = 2.5;

interface Sample {
  x: number;
  z: number;
  y: number;
  rot: number;
  scale: number;
}

function makeSampler(seedOffset: number) {
  const rnd = mulberry32(TERRAIN_SEED + seedOffset);
  return (): Sample | null => {
    for (let attempt = 0; attempt < 24; attempt++) {
      const ang = rnd() * Math.PI * 2;
      const rad = Math.sqrt(rnd()) * (ISLAND_RADIUS - 3);
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      if (x > -24 - EXCLUSION_MARGIN && x < 28 + EXCLUSION_MARGIN && z > -24 - EXCLUSION_MARGIN && z < 28 + EXCLUSION_MARGIN)
        continue;
      const y = terrainHeightAt(x, z);
      if (y < WATER_LEVEL + 0.45 || y > 1.6) continue;
      return { x, z, y, rot: rnd() * Math.PI * 2, scale: 0.8 + rnd() * 0.55 };
    }
    return null;
  };
}

export function Scatter() {
  const built = useMemo(() => {
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    const scatterInstanced = (
      geo: THREE.BufferGeometry,
      samples: Sample[],
      extraScaleY = 1,
    ): THREE.InstancedMesh => {
      const mesh = new THREE.InstancedMesh(
        geo,
        new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }),
        samples.length,
      );
      samples.forEach((s, i) => {
        q.setFromAxisAngle(up, s.rot);
        m4.compose(
          new THREE.Vector3(s.x, s.y - 0.05, s.z),
          q,
          new THREE.Vector3(s.scale, s.scale * extraScaleY, s.scale),
        );
        mesh.setMatrixAt(i, m4);
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      return mesh;
    };

    const scatterColored = (
      geo: THREE.BufferGeometry,
      samples: Sample[],
      palette: string[],
      seed: number,
    ): THREE.InstancedMesh => {
      const mesh = new THREE.InstancedMesh(
        geo,
        new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }),
        samples.length,
      );
      const color = new THREE.Color();
      const rnd = mulberry32(TERRAIN_SEED + seed);
      samples.forEach((s, i) => {
        q.setFromAxisAngle(up, s.rot);
        m4.compose(
          new THREE.Vector3(s.x, s.y, s.z),
          q,
          new THREE.Vector3(s.scale, s.scale, s.scale),
        );
        mesh.setMatrixAt(i, m4);
        color.set(palette[Math.floor(rnd() * palette.length)]);
        mesh.setColorAt(i, color);
      });
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      return mesh;
    };

    const pineS: Sample[] = [];
    const oakS: Sample[] = [];
    const rockS: Sample[] = [];
    const tuftS: Sample[] = [];
    const flowerS: Sample[] = [];

    const samplers = [makeSampler(11), makeSampler(23), makeSampler(37), makeSampler(51)];
    let si = 0;
    const nextSample = (): Sample | null => samplers[si++ % samplers.length]();

    for (let i = 0; i < 120; i++) {
      const s = nextSample();
      if (s) pineS.push(s);
    }
    for (let i = 0; i < 90; i++) {
      const s = nextSample();
      if (s) oakS.push(s);
    }
    for (let i = 0; i < 60; i++) {
      const s = nextSample();
      if (s) {
        s.scale *= 1.4;
        rockS.push(s);
      }
    }
    const denseSamplers = [makeSampler(71), makeSampler(83)];
    let di = 0;
    const nextDense = (): Sample | null => denseSamplers[di++ % denseSamplers.length]();
    for (let i = 0; i < 900; i++) {
      const s = nextDense();
      if (s) {
        s.scale = 0.7 + Math.random() * 0.8;
        tuftS.push(s);
      }
    }
    for (let i = 0; i < 240; i++) {
      const s = nextDense();
      if (s) {
        s.scale = 0.8 + Math.random() * 0.6;
        flowerS.push(s);
      }
    }

    return {
      pines: scatterInstanced(pineGeo(), pineS),
      oaks: scatterInstanced(oakGeo(), oakS),
      rocks: scatterInstanced(rockGeo(), rockS),
      tufts: scatterColored(
        new THREE.ConeGeometry(0.09, 0.42, 5),
        tuftS,
        ["#4f8f47", "#5da04f", "#6bb05a", "#3f7a3d"],
        5,
      ),
      flowers: scatterColored(
        new THREE.SphereGeometry(0.07, 6, 4),
        flowerS,
        ["#f2f2f2", "#ffd166", "#ef8fb5", "#fff3b0", "#c77dff"],
        9,
      ),
    };
  }, []);

  return (
    <group>
      <primitive object={built.pines} />
      <primitive object={built.oaks} />
      <primitive object={built.rocks} />
      <primitive object={built.tufts} />
      <primitive object={built.flowers} />
    </group>
  );
}
