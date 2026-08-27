import { PerspectiveCamera, Vector3 } from "three";
import { clamp } from "../../lib/format";

export interface CameraRigOptions {
  onCanvasClickSuppressed?: () => void;
}

const MIN_DIST = 14;
const MAX_DIST = 92;
const MAX_TARGET_RADIUS = 46;

export class CameraRig {
  targetX = 0;
  targetZ = 8;
  yaw = Math.PI * 0.22;
  dist = 52;

  private curX = 0;
  private curZ = 8;
  private curYaw = Math.PI * 0.22;
  private curDist = 60;

  keys = new Set<string>();
  suppressClick = false;

  private dom: HTMLElement | null = null;
  private pointers = new Map<number, { x: number; y: number; button: number }>();
  private dragMode: "none" | "pan" | "rotate" | "pinch" = "none";
  private movedPixels = 0;
  private pinchStartDist = 0;
  private detachFns: Array<() => void> = [];

  attach(dom: HTMLElement): void {
    this.dom = dom;
    const onPointerDown = (e: PointerEvent) => {
      dom.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button });
      if (this.pointers.size === 2) {
        this.dragMode = "pinch";
        const pts = [...this.pointers.values()];
        this.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      } else {
        this.movedPixels = 0;
        this.suppressClick = false;
        this.dragMode = e.button === 2 || e.shiftKey ? "rotate" : "pan";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX;
      prev.y = e.clientY;
      if (this.dragMode === "pinch" && this.pointers.size === 2) {
        const pts = [...this.pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.pinchStartDist > 0) this.zoomBy(this.pinchStartDist / d);
        return;
      }
      this.movedPixels += Math.abs(dx) + Math.abs(dy);
      if (this.dragMode === "rotate") {
        this.curYaw -= dx * 0.005;
        this.yaw = this.curYaw;
      } else if (this.dragMode === "pan") {
        if (this.movedPixels > 6) this.suppressClick = true;
        this.panPixels(dx, dy);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) {
        this.dragMode = "none";
      } else if (this.pointers.size === 1) {
        this.dragMode = "pan";
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.zoomBy(Math.exp(e.deltaY * 0.0011));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      this.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
    const onBlur = () => this.keys.clear();
    const noMenu = (e: Event) => e.preventDefault();

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    dom.addEventListener("contextmenu", noMenu);

    this.detachFns = [
      () => dom.removeEventListener("pointerdown", onPointerDown),
      () => dom.removeEventListener("pointermove", onPointerMove),
      () => dom.removeEventListener("pointerup", onPointerUp),
      () => dom.removeEventListener("pointercancel", onPointerUp),
      () => dom.removeEventListener("wheel", onWheel),
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => window.removeEventListener("blur", onBlur),
      () => dom.removeEventListener("contextmenu", noMenu),
    ];
  }

  detach(): void {
    for (const fn of this.detachFns) fn();
    this.detachFns = [];
    this.dom = null;
  }

  zoomBy(factor: number): void {
    this.dist = clamp(this.dist * factor, MIN_DIST, MAX_DIST);
  }

  panPixels(dxPx: number, dyPx: number): void {
    const s = this.dist * 0.00115;
    const fx = -Math.sin(this.curYaw);
    const fz = -Math.cos(this.curYaw);
    const rx = Math.cos(this.curYaw);
    const rz = -Math.sin(this.curYaw);
    let nx = this.targetX + (-dxPx * rx - dyPx * fx) * s;
    let nz = this.targetZ + (-dxPx * rz - dyPx * fz) * s;
    const radius = Math.hypot(nx, nz);
    if (radius > MAX_TARGET_RADIUS) {
      nx *= MAX_TARGET_RADIUS / radius;
      nz *= MAX_TARGET_RADIUS / radius;
    }
    this.targetX = nx;
    this.targetZ = nz;
  }

  wasDrag(): boolean {
    return this.suppressClick;
  }

  curTargetX(): number {
    return this.curX;
  }

  curTargetZ(): number {
    return this.curZ;
  }

  clearClickFlag(): void {
    this.suppressClick = false;
  }

  applyKeyboard(dt: number): void {
    const k = this.keys;
    if (k.size === 0) return;
    let mx = 0;
    let mz = 0;
    if (k.has("KeyW") || k.has("ArrowUp")) mz += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) mz -= 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) mx -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) mx += 1;
    if (k.has("KeyQ")) this.yaw += dt * 1.7;
    if (k.has("KeyE")) this.yaw -= dt * 1.7;
    if (mx !== 0 || mz !== 0) {
      const speed = this.dist * 0.85 * dt;
      const fx = -Math.sin(this.curYaw);
      const fz = -Math.cos(this.curYaw);
      const rx = -fz;
      const rz = fx;
      let nx = this.targetX + (fx * mz + rx * mx) * speed;
      let nz = this.targetZ + (fz * mz + rz * mx) * speed;
      const radius = Math.hypot(nx, nz);
      if (radius > MAX_TARGET_RADIUS) {
        nx *= MAX_TARGET_RADIUS / radius;
        nz *= MAX_TARGET_RADIUS / radius;
      }
      this.targetX = nx;
      this.targetZ = nz;
    }
  }

  update(dt: number, camera: PerspectiveCamera): void {
    this.applyKeyboard(dt);
    const lambda = 7.5;
    const t = 1 - Math.exp(-lambda * dt);
    this.curX += (this.targetX - this.curX) * t;
    this.curZ += (this.targetZ - this.curZ) * t;
    this.curDist += (this.dist - this.curDist) * t;
    this.curYaw += (this.yaw - this.curYaw) * t;

    const normDist = (this.curDist - MIN_DIST) / (MAX_DIST - MIN_DIST);
    const pitch = (38 + normDist * 18) * (Math.PI / 180);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    camera.position.set(
      this.curX + this.curDist * cosP * Math.sin(this.curYaw),
      this.curDist * sinP + 1.5,
      this.curZ + this.curDist * cosP * Math.cos(this.curYaw),
    );
    camera.lookAt(new Vector3(this.curX, 0, this.curZ));
  }
}

export const rig = new CameraRig();
