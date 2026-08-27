const registry = new Map<string, [number, number, number]>();

export function registerChimney(key: string, pos: [number, number, number]): void {
  registry.set(key, pos);
}

export function unregisterChimney(key: string): void {
  registry.delete(key);
}

export function getChimneyPositions(): Array<[number, number, number]> {
  return [...registry.values()];
}
