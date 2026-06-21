const { addEvent, createSession, getSession } = require("../lib/sessionStore");

module.exports = (req, res) => {
  const path = Array.isArray(req.query.path) ? req.query.path : [];

  if (req.method === "POST" && path.length === 1 && path[0] === "sessions") {
    res.status(201).json(createSession());
    return;
  }

  if (path.length === 3 && path[0] === "sessions" && path[2] === "events") {
    const session = getSession(path[1]);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (req.method === "GET") {
      const since = Number(req.query.since || 0);
      res.status(200).json({
        id: session.id,
        createdAt: session.createdAt,
        events: session.events.filter(event => event.id > since)
      });
      return;
    }

    if (req.method === "POST") {
      const event = addEvent(session.id, req.body || {});
      res.status(201).json({ event });
      return;
    }
  }

  res.status(404).json({ error: "Not found" });
};
