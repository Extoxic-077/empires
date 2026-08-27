import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 8787);
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "saves");
const PID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function savePath(pid) {
  return path.join(DATA_DIR, `${pid}.json`);
}

function sendJson(res, status, payload) {
  const body = status === 204 ? "" : JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readBody(req, limitBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleGetSave(res, pid) {
  try {
    const raw = await fs.readFile(savePath(pid), "utf8");
    const save = JSON.parse(raw);
    if (!save || typeof save !== "object") throw new Error("invalid save");
    sendJson(res, 200, { ok: true, save });
  } catch (err) {
    // Missing or corrupt development saves are not server failures. The client
    // can immediately start a clean kingdom from save:null.
    if (err && (err.code === "ENOENT" || err instanceof SyntaxError)) {
      sendJson(res, 200, { ok: true, save: null });
    } else {
      sendJson(res, 500, { ok: false, error: "read failed" });
    }
  }
}

async function handlePutSave(req, res, pid) {
  try {
    const body = await readBody(req);
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1 || !Array.isArray(parsed.buildings) || !Array.isArray(parsed.units)) {
      sendJson(res, 400, { ok: false, error: "malformed save" });
      return;
    }
    const tmp = `${savePath(pid)}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(parsed), "utf8");
    await fs.rename(tmp, savePath(pid));
    sendJson(res, 200, { ok: true, savedAt: Date.now() });
  } catch (err) {
    sendJson(res, 400, { ok: false, error: err instanceof Error ? err.message : "invalid payload" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/api/health")) {
      sendJson(res, 200, { ok: true, service: "aether-empires-save", uptime: process.uptime() });
      return;
    }
    const saveMatch = /^\/api\/save\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);
    if (saveMatch) {
      const pid = saveMatch[1];
      if (!PID_RE.test(pid)) {
        sendJson(res, 400, { ok: false, error: "bad player id" });
        return;
      }
      if (req.method === "GET") {
        await handleGetSave(res, pid);
        return;
      }
      if (req.method === "PUT") {
        await handlePutSave(req, res, pid);
        return;
      }
    }
    sendJson(res, 404, { ok: false, error: "not found" });
  } catch (err) {
    console.error("[aether-empires] request failed", err);
    sendJson(res, 500, { ok: false, error: "internal error" });
  }
});

ensureDataDir()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[aether-empires] save server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[aether-empires] could not create data dir", err);
    process.exit(1);
  });
