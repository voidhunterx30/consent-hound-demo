const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#message");
const locationStatus = document.querySelector("#locationStatus");

const sessionId = window.location.pathname.split("/").filter(Boolean).pop();

window.addEventListener("load", async () => {
  await postEvent({ type: "join", text: "Participant opened the authorized demo page.", consent: true });
  setTimeout(requestLocation, 450);
});

chatForm.addEventListener("submit", async event => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  addBubble("me", text);
  messageInput.value = "";
  await postEvent({ type: "message", text, consent: true });
});

async function requestLocation() {
  if (!window.isSecureContext) {
    const text = "Location needs localhost or HTTPS. Open this page in a secure context and try again.";
    locationStatus.textContent = "Location not requested";
    addBubble("system", text);
    await postEvent({ type: "error", text, consent: true });
    return;
  }

  if (!navigator.geolocation) {
    const text = "This browser does not support geolocation.";
    locationStatus.textContent = "Location unavailable";
    addBubble("system", text);
    await postEvent({ type: "error", text, consent: true });
    return;
  }

  locationStatus.textContent = "Waiting for browser permission";

  navigator.geolocation.getCurrentPosition(
    async position => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      addBubble("system", "Location shared with your permission.");
      locationStatus.textContent = "Location shared";
      await postEvent({ type: "location", text: "Participant shared location.", location, consent: true });
    },
    async error => {
      const text = error.code === error.PERMISSION_DENIED
        ? "You denied location permission. No location was sent."
        : "Location could not be read. No location was sent.";

      addBubble("system", text);
      locationStatus.textContent = "No location sent";
      await postEvent({ type: "denied", text, consent: true });
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

async function postEvent(payload) {
  const response = await fetch(`/api/sessions/${sessionId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    addBubble("system", "The session is not available. Ask the organizer for a fresh link.");
  }
}

function addBubble(kind, text) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${kind}`;
  bubble.textContent = text;
  chatLog.append(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}
