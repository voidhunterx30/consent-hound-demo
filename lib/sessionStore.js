const crypto = require("crypto");

const storeKey = "__consentHoundSessions";
const sessions = global[storeKey] || new Map();
global[storeKey] = sessions;

function makeId() {
  return crypto.randomBytes(5).toString("hex");
}

function createSession() {
  const id = makeId();
  const createdAt = new Date().toISOString();
  sessions.set(id, { id, createdAt, events: [], nextEventId: 1 });
  addEvent(id, {
    type: "system",
    text: "Session created. Share the participant link only with authorized hackathon testers."
  });
  return { id, createdAt };
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function addEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const safeEvent = {
    id: session.nextEventId++,
    at: new Date().toISOString(),
    type: String(event.type || "note").slice(0, 40),
    text: typeof event.text === "string" ? event.text.slice(0, 1000) : "",
    location: normalizeLocation(event.location),
    consent: event.consent === true
  };

  session.events.push(safeEvent);
  if (session.events.length > 500) session.events.shift();
  return safeEvent;
}

function normalizeLocation(location) {
  if (!location || typeof location !== "object") return null;

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const accuracy = Number(location.accuracy);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? Math.max(0, Math.round(accuracy)) : null
  };
}

module.exports = {
  addEvent,
  createSession,
  getSession
};
