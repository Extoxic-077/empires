import {
  BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  ConeGeometry,
  SphereGeometry,
  IcosahedronGeometry,
  PlaneGeometry,
  RingGeometry,
  Color,
  Material,
  MeshStandardMaterial,
} from "three";

const geoCache = new Map<string, BufferGeometry>();
const matCache = new Map<string, Material>();

export function geoBox(w: number, h: number, d: number): BufferGeometry {
  const key = `box:${w}:${h}:${d}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new BoxGeometry(w, h, d);
    geoCache.set(key, g);
  }
  return g;
}

export function geoCyl(rt: number, rb: number, h: number, seg = 10): BufferGeometry {
  const key = `cyl:${rt}:${rb}:${h}:${seg}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new CylinderGeometry(rt, rb, h, seg);
    geoCache.set(key, g);
  }
  return g;
}

export function geoCone(r: number, h: number, seg = 8): BufferGeometry {
  const key = `cone:${r}:${h}:${seg}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new ConeGeometry(r, h, seg);
    geoCache.set(key, g);
  }
  return g;
}

export function geoSphere(r: number, seg = 12): BufferGeometry {
  const key = `sph:${r}:${seg}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new SphereGeometry(r, seg, Math.max(6, seg >> 1));
    geoCache.set(key, g);
  }
  return g;
}

export function geoIco(r: number, detail = 0): BufferGeometry {
  const key = `ico:${r}:${detail}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new IcosahedronGeometry(r, detail);
    geoCache.set(key, g);
  }
  return g;
}

export function geoPlane(w: number, h: number): BufferGeometry {
  const key = `plane:${w}:${h}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new PlaneGeometry(w, h);
    geoCache.set(key, g);
  }
  return g;
}

export function geoRing(inner: number, outer: number, seg = 24): BufferGeometry {
  const key = `ring:${inner}:${outer}:${seg}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new RingGeometry(inner, outer, seg);
    geoCache.set(key, g);
  }
  return g;
}

export interface MatOpts {
  rough?: number;
  metal?: number;
  flat?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}

export function mat(hex: string, opts: MatOpts = {}): MeshStandardMaterial {
  const key = `m:${hex}:${opts.rough ?? 0.85}:${opts.metal ?? 0}:${opts.flat ? 1 : 0}:${
    opts.emissive ?? ""
  }:${opts.emissiveIntensity ?? 0}:${opts.transparent ? 1 : 0}:${opts.opacity ?? 1}`;
  let m = matCache.get(key) as MeshStandardMaterial | undefined;
  if (!m) {
    m = new MeshStandardMaterial({
      color: hex,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0,
      flatShading: opts.flat ?? false,
    });
    if (opts.emissive) {
      m.emissive = new Color(opts.emissive);
      m.emissiveIntensity = opts.emissiveIntensity ?? 1;
    }
    if (opts.transparent) {
      m.transparent = true;
      m.opacity = opts.opacity ?? 0.5;
    }
    matCache.set(key, m);
  }
  return m;
}

export function ghostMat(valid: boolean): MeshStandardMaterial {
  return mat(valid ? "#5dd97c" : "#ff5a52", {
    transparent: true,
    opacity: 0.55,
    rough: 0.6,
    emissive: valid ? "#1d5f31" : "#6e1512",
    emissiveIntensity: 0.7,
  });
}
