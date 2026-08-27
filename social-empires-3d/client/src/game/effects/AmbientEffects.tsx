import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { gameEvents } from "../../lib/events";
import { getChimneyPositions } from "./chimneys";

function makePointsMaterial(color: string, size: number, additive: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      varying float vAlpha;
      uniform float uSize;
      void main() {
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (240.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      uniform vec3 uColor;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float a = smoothstep(0.5, 0.12, d) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

const SMOKE_COUNT = 110;

function Smoke() {
  const pointsRef = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(SMOKE_COUNT * 3);
    const alphas = new Float32Array(SMOKE_COUNT);
    const seeds = Array.from({ length: SMOKE_COUNT }, () => Math.random());
    return { positions, alphas, seeds };
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(data.alphas, 1));
    return g;
  }, [data]);
  const mat = useMemo(() => makePointsMaterial("#e8e4da", 9, false), []);

  useFrame((state) => {
    const emitters = getChimneyPositions();
    const points = pointsRef.current;
    if (!points) return;
    points.visible = emitters.length > 0;
    if (!points.visible) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const e = emitters[i % emitters.length];
      const speed = 0.14 + data.seeds[i] * 0.1;
      let p = ((t * speed + data.seeds[i]) % 1 + 1) % 1;
      const wind = Math.sin(t * 0.7 + i) * 0.25 * p;
      data.positions[i * 3] = e[0] + wind;
      data.positions[i * 3 + 1] = e[1] + p * 2.6;
      data.positions[i * 3 + 2] = e[2] + wind * 0.6;
      data.alphas[i] = Math.sin(p * Math.PI) * 0.32;
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} frustumCulled={false} />;
}

const POLLEN_COUNT = 150;

function Pollen() {
  const data = useMemo(() => {
    const positions = new Float32Array(POLLEN_COUNT * 3);
    const alphas = new Float32Array(POLLEN_COUNT);
    const seeds = Array.from({ length: POLLEN_COUNT }, (_, i) => ({
      a: Math.random() * Math.PI * 2,
      r: 4 + Math.sqrt(Math.random()) * 26,
      h: 0.6 + Math.random() * 3.6,
      s: 0.4 + Math.random() * 0.8,
      o: Math.random() * 100,
    }));
    return { positions, alphas, seeds };
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(data.alphas, 1));
    return g;
  }, [data]);
  const mat = useMemo(() => makePointsMaterial("#fff3b0", 5, true), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < POLLEN_COUNT; i++) {
      const s = data.seeds[i];
      data.positions[i * 3] = Math.cos(s.a + t * 0.05 * s.s) * s.r + Math.sin(t * s.s + s.o) * 0.7;
      data.positions[i * 3 + 1] = s.h + Math.sin(t * 0.6 * s.s + s.o) * 0.4;
      data.positions[i * 3 + 2] = Math.sin(s.a + t * 0.05 * s.s) * s.r + Math.cos(t * s.s + s.o) * 0.7;
      data.alphas[i] = 0.35 + Math.sin(t * 2 * s.s + s.o) * 0.25;
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

const BIRD_COUNT = 5;

function Birds() {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const wings = useRef<Array<[THREE.Mesh | null, THREE.Mesh | null]>>([]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < BIRD_COUNT; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const speed = 0.14 + i * 0.02;
      const rad = 24 + i * 3.2;
      const ang = t * speed + i * 1.9;
      g.position.set(Math.cos(ang) * rad, 11 + Math.sin(t * 0.7 + i) * 1.6, Math.sin(ang) * rad);
      g.rotation.y = -ang + Math.PI / 2;
      const pair = wings.current[i];
      if (pair) {
        const flap = Math.sin(t * 9 + i * 2) * 0.6;
        if (pair[0]) pair[0].rotation.z = flap;
        if (pair[1]) pair[1].rotation.z = -flap;
      }
    }
    void dt;
  });

  return (
    <group>
      {Array.from({ length: BIRD_COUNT }, (_, i) => (
        <group key={i} ref={(obj) => { refs.current[i] = obj; }}>
          <mesh>
            <coneGeometry args={[0.09, 0.42, 5]} />
            <meshStandardMaterial color="#3d4652" flatShading />
          </mesh>
          {[0, 1].map((side) => (
            <mesh
              key={side}
              ref={(obj) => {
                wings.current[i] = wings.current[i] ?? [null, null];
                wings.current[i][side] = obj;
              }}
              position={[0, 0.03, side === 0 ? 0 : 0]}
              rotation={[0, 0, side === 0 ? 0.3 : -0.3]}
            >
              <planeGeometry args={[0.55, 0.22]} />
              <meshStandardMaterial color="#333b46" side={THREE.DoubleSide} flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

interface FloaterItem {
  sprite: THREE.Sprite;
  life: number;
  maxLife: number;
  vy: number;
  active: boolean;
}

const floaterTexCache = new Map<string, THREE.CanvasTexture>();

function floaterTexture(text: string, color: string): THREE.CanvasTexture {
  const key = `${text}|${color}`;
  let tex = floaterTexCache.get(key);
  if (tex) return tex;
  const c = document.createElement("canvas");
  c.width = 192;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.font = "bold 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(15,18,28,0.85)";
    ctx.strokeText(text, 96, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 96, 32);
  }
  tex = new THREE.CanvasTexture(c);
  floaterTexCache.set(key, tex);
  return tex;
}

const FLOATER_POOL = 12;

function Floaters() {
  const items = useMemo<FloaterItem[]>(() => {
    const out: FloaterItem[] = [];
    for (let i = 0; i < FLOATER_POOL; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: null, transparent: true, depthTest: false }),
      );
      sprite.visible = false;
      sprite.scale.set(2.2, 0.73, 1);
      out.push({ sprite, life: 0, maxLife: 1.5, vy: 1.15, active: false });
    }
    return out;
  }, []);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    return gameEvents.on("floater", (payload) => {
      const item = items.find((f) => !f.active) ?? items[0];
      item.active = true;
      item.life = item.maxLife;
      item.sprite.position.set(payload.pos[0], payload.pos[1], payload.pos[2]);
      const mat = item.sprite.material as THREE.SpriteMaterial;
      mat.map = floaterTexture(payload.text, payload.color);
      mat.needsUpdate = true;
      item.sprite.visible = true;
    });
  }, [items]);

  useFrame((_, dt) => {
    for (const item of items) {
      if (!item.active) continue;
      item.life -= dt;
      if (item.life <= 0) {
        item.active = false;
        item.sprite.visible = false;
        continue;
      }
      item.sprite.position.y += item.vy * dt;
      const mat = item.sprite.material as THREE.SpriteMaterial;
      mat.opacity = Math.min(1, item.life / (item.maxLife * 0.6));
    }
    void groupRef;
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <primitive key={i} object={item.sprite} />
      ))}
    </group>
  );
}

export function AmbientEffects() {
  return (
    <group>
      <Smoke />
      <Pollen />
      <Birds />
      <Floaters />
    </group>
  );
}
