#!/usr/bin/env node
/**
 * OrbisVoice Webhook Deploy Server
 * Listens on port 9000 for GitHub push events and triggers deploy.sh
 * Replaces GitHub Actions CI/CD pipeline.
 */

const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || "";
const DEPLOY_SCRIPT = path.join(__dirname, "deploy.sh");
const LOG_FILE = path.join(__dirname, "deploy.log");
const BRANCH = process.env.DEPLOY_BRANCH || "master";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

function verifySignature(payload, signature) {
  if (!SECRET) {
    log("WARNING: WEBHOOK_SECRET not set — skipping signature verification");
    return true;
  }
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  const digest = "sha256=" + hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

let deploying = false;

function runDeploy() {
  if (deploying) {
    log("Deploy already in progress — skipping duplicate trigger");
    return;
  }
  deploying = true;
  log("=== Starting deploy ===");

  const child = spawn("bash", [DEPLOY_SCRIPT], {
    detached: true,
    stdio: ["ignore", fs.openSync(LOG_FILE, "a"), fs.openSync(LOG_FILE, "a")],
    env: { ...process.env },
  });

  child.on("exit", (code) => {
    deploying = false;
    log(`=== Deploy finished with exit code ${code} ===`);
  });

  child.unref();
}

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, deploying, branch: BRANCH }));
    return;
  }

  // Webhook endpoint
  if (req.method === "POST" && req.url === "/webhook") {
    const event = req.headers["x-github-event"];
    const sig = req.headers["x-hub-signature-256"] || "";

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (!verifySignature(body, sig)) {
        log("Invalid webhook signature — rejected");
        res.writeHead(401);
        res.end("Unauthorized");
        return;
      }

      if (event !== "push") {
        res.writeHead(200);
        res.end("Ignored (not a push event)");
        return;
      }

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400);
        res.end("Bad payload");
        return;
      }

      const pushedBranch = (payload.ref || "").replace("refs/heads/", "");
      if (pushedBranch !== BRANCH) {
        log(`Push to '${pushedBranch}' — ignoring (watching '${BRANCH}')`);
        res.writeHead(200);
        res.end(`Ignored branch: ${pushedBranch}`);
        return;
      }

      const pusher = payload.pusher?.name || "unknown";
      const commits = payload.commits?.length || 0;
      log(`Push received from ${pusher} (${commits} commit(s)) — triggering deploy`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, message: "Deploy triggered" }));

      // Run deploy async (after response sent)
      setImmediate(runDeploy);
    });
    return;
  }

  // 404 for everything else
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  log(`Webhook server listening on port ${PORT}`);
  log(`Watching branch: ${BRANCH}`);
  log(`Deploy script: ${DEPLOY_SCRIPT}`);
  log(`Secret configured: ${SECRET ? "YES" : "NO (WEBHOOK_SECRET not set)"}`);
});
