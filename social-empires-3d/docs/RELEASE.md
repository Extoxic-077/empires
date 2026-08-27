# Aether Empires — Release Baseline

## Local development

From `social-empires-3d`:

```bash
npm install
npm run server
```

In a second terminal:

```bash
npm run dev
```

Open `http://localhost:5173`.

The save service runs at `http://localhost:8787`. Its root and `/api/health` both return a JSON health response. The Vite development server proxies `/api` to port 8787.

## Production checks

Run before publishing:

```bash
npm run typecheck
npm run test
npm run build
```

The frontend build output is produced by the client workspace. The Node save service is intentionally separate and must be deployed as a persistent service when server-side save mirroring is desired.

## Save resilience

The browser save is the primary development save. Invalid JSON, wrong-version saves, null entities, entities without ids, and malformed unit records are discarded or filtered before hydration. A missing server save returns `{ "ok": true, "save": null }` so a first-time player can start cleanly.

## Release gates

Do not call a build publish-ready until all of these pass:

- Fresh profile starts without console errors.
- Existing valid save hydrates correctly.
- Corrupt local save falls back to a fresh empire.
- Building placement works with rotation and invalid-placement feedback.
- Economy ticks without runaway renders.
- Save/reload preserves buildings and units.
- `npm run typecheck`, `npm run test`, and `npm run build` pass.
- The production host has a rewrite strategy for the SPA and, if used, a reachable `/api` service.

## Current scope

The repository already contains the strategy-game foundation: 3D canvas/world, camera, placement, economy, quests, building definitions, units, training, simulation, local save, server mirror, and HUD. Future release work should extend those systems instead of replacing them with a second prototype architecture.
