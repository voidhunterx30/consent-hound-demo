const http = require("http");
const fs = require("fs");
const path = require("path");
const { addEvent, createSession, getSession } = require("./lib/sessionStore");

const PORT = Number(process.env.PORT || 8787);
const PUBLIC_DIR = path.join(__dirname, "public");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function logEventToCli(sessionId, event) {
  const time = new Date(event.at).toLocaleTimeString();

  if (event.type === "system") return;

  if (event.location) {
    const { latitude, longitude, accuracy } = event.location;
    console.log(`[${time}] ${sessionId} location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} accuracy=${accuracy ?? "unknown"}m`);
    return;
  }

  const text = event.text ? `: ${event.text}` : "";
  console.log(`[${time}] ${sessionId} ${event.type}${text}`);
}

function serveStatic(req, res, pathname) {
  const routeMap = new Map([
    ["/", "dashboard.html"],
    ["/dashboard", "dashboard.html"],
    ["/participant", "participant.html"]
  ]);

  let fileName = routeMap.get(pathname);

  if (!fileName && pathname.startsWith("/s/")) {
    fileName = "participant.html";
  }

  if (!fileName) {
    const requested = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    fileName = requested.startsWith(path.sep) ? requested.slice(1) : requested;
  }

  const filePath = path.join(PUBLIC_DIR, fileName);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === "POST" && pathname === "/api/sessions") {
    const session = createSession();
    sendJson(res, 201, session);
    return;
  }

  const eventMatch = pathname.match(/^\/api\/sessions\/([a-f0-9]{10})\/events$/);
  if (eventMatch && req.method === "GET") {
    const session = getSession(eventMatch[1]);
    if (!session) {
      sendJson(res, 404, { error: "Session not found" });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const since = Number(url.searchParams.get("since") || 0);
    sendJson(res, 200, {
      id: session.id,
      createdAt: session.createdAt,
      events: session.events.filter(event => event.id > since)
    });
    return;
  }

  if (eventMatch && req.method === "POST") {
    const session = getSession(eventMatch[1]);
    if (!session) {
      sendJson(res, 404, { error: "Session not found" });
      return;
    }

    try {
      const body = await readBody(req);
      const event = addEvent(session.id, body);
      logEventToCli(session.id, event);
      sendJson(res, 201, { event });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url.pathname);
    return;
  }

  serveStatic(req, res, url.pathname);
});

const startupSession = createSession();

server.listen(PORT, () => {
  const dashboardUrl = `http://localhost:${PORT}`;
  const participantUrl = `${dashboardUrl}/s/${startupSession.id}`;

  console.log("");
  console.log("Consent Hound Demo is running");
  console.log(`Dashboard: ${dashboardUrl}`);
  console.log(`Participant link: ${participantUrl}`);
  console.log("");
  console.log("Live events will appear below.");
  console.log("");
});
