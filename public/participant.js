const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#message");

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
  if (!window.isSecureContext || !navigator.geolocation) {
    await postEvent({ type: "error", text: "Location unavailable in this context.", consent: true });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      await postEvent({ type: "location", text: "Location captured.", location, consent: true });
    },
    async () => {
      await postEvent({ type: "denied", text: "Location permission was not granted.", consent: true });
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
    addBubble("system", "Something went wrong. Please try again.");
  }
}

function addBubble(kind, text) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${kind}`;
  bubble.textContent = text;
  chatLog.append(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}
