export type FloatersEvent = { pos: [number, number, number]; text: string; color: string };
export type ToastEvent = { msg: string; kind: "info" | "success" | "error" };

export interface GameEvents {
  floater: FloatersEvent;
  toast: ToastEvent;
  built: { defId: string; name: string };
  completed: { name: string; level: number };
  trained: { unitName: string };
  levelup: { level: number; title: string };
  questReady: { title: string };
  selectionChanged: { id: string | null };
}

type Handler<T> = (payload: T) => void;

class Emitter {
  private map = new Map<keyof GameEvents, Set<Handler<never>>>();

  on<K extends keyof GameEvents>(key: K, fn: Handler<GameEvents[K]>): () => void {
    let set = this.map.get(key);
    if (!set) {
      set = new Set();
      this.map.set(key, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(key, fn);
  }

  off<K extends keyof GameEvents>(key: K, fn: Handler<GameEvents[K]>): void {
    this.map.get(key)?.delete(fn as Handler<never>);
  }

  emit<K extends keyof GameEvents>(key: K, payload: GameEvents[K]): void {
    const set = this.map.get(key);
    if (!set) return;
    for (const fn of set) (fn as unknown as Handler<GameEvents[K]>)(payload);
  }
}

export const gameEvents = new Emitter();

export function toast(msg: string, kind: ToastEvent["kind"] = "info"): void {
  gameEvents.emit("toast", { msg, kind });
}
