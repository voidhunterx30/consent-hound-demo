const createSessionButton = document.querySelector("#createSession");
const copyLinkButton = document.querySelector("#copyLink");
const sessionLinkInput = document.querySelector("#sessionLink");
const sessionIdText = document.querySelector("#sessionId");
const eventCountText = document.querySelector("#eventCount");
const latestEventText = document.querySelector("#latestEvent");
const eventsEl = document.querySelector("#events");

let sessionId = null;
let lastEventId = 0;
let totalEvents = 0;
let pollTimer = null;

createSessionButton.addEventListener("click", async () => {
  const response = await fetch("/api/sessions", { method: "POST" });
  const session = await response.json();

  sessionId = session.id;
  lastEventId = 0;
  totalEvents = 0;

  const link = `${window.location.origin}/s/${sessionId}`;
  sessionLinkInput.value = link;
  sessionIdText.textContent = sessionId;
  eventCountText.textContent = "0";
  latestEventText.textContent = "Created";
  copyLinkButton.disabled = false;
  eventsEl.innerHTML = "";

  if (pollTimer) clearInterval(pollTimer);
  await pollEvents();
  pollTimer = setInterval(pollEvents, 1200);
});

copyLinkButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(sessionLinkInput.value);
  copyLinkButton.textContent = "Copied";
  setTimeout(() => {
    copyLinkButton.textContent = "Copy";
  }, 1200);
});

async function pollEvents() {
  if (!sessionId) return;

  const response = await fetch(`/api/sessions/${sessionId}/events?since=${lastEventId}`);
  if (!response.ok) return;

  const payload = await response.json();
  payload.events.forEach(renderEvent);
}

function renderEvent(event) {
  lastEventId = Math.max(lastEventId, event.id);
  totalEvents += 1;

  const item = document.createElement("article");
  item.className = `event event-${event.type}`;

  const title = document.createElement("div");
  title.className = "event-title";
  title.textContent = `${labelFor(event.type)} - ${new Date(event.at).toLocaleTimeString()}`;

  const body = document.createElement("div");
  body.className = "event-body";

  if (event.location) {
    const { latitude, longitude, accuracy } = event.location;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const earthUrl = `https://earth.google.com/web/search/${latitude},${longitude}`;
    body.innerHTML = `
      <p><strong>Latitude:</strong> ${latitude.toFixed(6)}</p>
      <p><strong>Longitude:</strong> ${longitude.toFixed(6)}</p>
      <p><strong>Accuracy:</strong> ${accuracy === null ? "Unknown" : `${accuracy} meters`}</p>
      <p class="map-links">
        <a href="${mapsUrl}" target="_blank" rel="noreferrer">Open Google Maps</a>
        <a href="${earthUrl}" target="_blank" rel="noreferrer">Open Google Earth</a>
      </p>
    `;
  } else {
    body.textContent = event.text || "No details";
  }

  item.append(title, body);
  eventsEl.prepend(item);

  eventCountText.textContent = String(totalEvents);
  latestEventText.textContent = labelFor(event.type);
}

function labelFor(type) {
  const labels = {
    system: "System",
    join: "Participant joined",
    message: "Message",
    location: "Location",
    denied: "Permission denied",
    error: "Error"
  };
  return labels[type] || "Event";
}
