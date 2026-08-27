import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const vert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;

  float wave(vec2 p, float t) {
    return sin(p.x * 0.32 + t * 1.1) * sin(p.y * 0.27 - t * 0.9)
         + 0.5 * sin((p.x + p.y) * 0.18 + t * 0.7);
  }

  void main() {
    float w = wave(vWorld.xz, uTime) * 0.5 + 0.5;
    vec3 deep = vec3(0.13, 0.42, 0.55);
    vec3 shallow = vec3(0.35, 0.72, 0.78);
    vec3 col = mix(deep, shallow, w * 0.55);
    float sparkle = pow(max(sin(vWorld.x * 1.7 + uTime * 2.2) * sin(vWorld.z * 1.5 - uTime * 1.7), 0.0), 24.0);
    col += vec3(0.55, 0.6, 0.55) * sparkle * 0.35;
    gl_FragColor = vec4(col, 0.92);
  }
`;

export function Water() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(300, 56);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    if (matRef.current) matRef.current.uniformsNeedUpdate = true;
  });

  return (
    <mesh geometry={geo} position={[0, -0.45, 0]}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        fog={false}
      />
    </mesh>
  );
}

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const skyFrag = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y * 1.4 + 0.25, 0.0, 1.0);
    vec3 horizon = vec3(0.87, 0.93, 0.96);
    vec3 zenith = vec3(0.42, 0.66, 0.86);
    vec3 col = mix(horizon, zenith, pow(h, 0.85));
    float sun = pow(max(dot(normalize(vDir), normalize(vec3(0.45, 0.62, 0.3))), 0.0), 220.0);
    col += vec3(1.0, 0.95, 0.8) * sun * 0.9;
    float glow = pow(max(dot(normalize(vDir), normalize(vec3(0.45, 0.62, 0.3))), 0.0), 6.0);
    col += vec3(0.9, 0.85, 0.6) * glow * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SkyDome() {
  const geo = useMemo(() => new THREE.SphereGeometry(420, 24, 16), []);
  return (
    <mesh geometry={geo} renderOrder={-10}>
      <shaderMaterial
        vertexShader={skyVert}
        fragmentShader={skyFrag}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
