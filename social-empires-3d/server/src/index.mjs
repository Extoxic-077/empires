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
  const body = JSON.stringify(payload);
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

async function handleGetSave(req, res, pid) {
  try {
    const raw = await fs.readFile(savePath(pid), "utf8");
    sendJson(res, 200, { ok: true, save: JSON.parse(raw) });
  } catch (err) {
    if (err && err.code === "ENOENT") sendJson(res, 404, { ok: false, error: "no save" });
    else sendJson(res, 500, { ok: false, error: "read failed" });
  }
}

async function handlePutSave(req, res, pid) {
  try {
    const body = await readBody(req);
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || !parsed.version) {
      sendJson(res, 400, { ok: false, error: "malformed save" });
      return;
    }
    const tmp = `${savePath(pid)}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(parsed), "utf8");
    await fs.rename(tmp, savePath(pid));
    sendJson(res, 200, { ok: true, savedAt: Date.now() });
  } catch {
    sendJson(res, 400, { ok: false, error: "invalid payload" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, uptime: process.uptime() });
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
        await handleGetSave(req, res, pid);
        return;
      }
      if (req.method === "PUT") {
        await handlePutSave(req, res, pid);
        return;
      }
    }
    sendJson(res, 404, { ok: false, error: "not found" });
  } catch {
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
