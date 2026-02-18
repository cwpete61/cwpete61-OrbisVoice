// Embedded widget loader script
// Add this to any website: <script src="https://app.myorbisvoice.com/widget.js" data-agent-id="agent-123"></script>

(function () {
  const script = document.currentScript;
  const agentId = script?.getAttribute("data-agent-id");
  const apiKey = script?.getAttribute("data-api-key");
  const position = script?.getAttribute("data-position") || "bottom-right";

  if (!agentId) {
    console.warn("[MyOrbisVoice] data-agent-id attribute is required");
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "orbis-voice-widget";
  widgetContainer.style.cssText = `
    position: fixed;
    ${position === "bottom-right" ? "right: 20px; bottom: 20px;" : ""}
    ${position === "bottom-left" ? "left: 20px; bottom: 20px;" : ""}
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0B1B3B 0%, #37CBEA 100%);
    box-shadow: 0 4px 12px rgba(55, 203, 234, 0.3);
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    border: 2px solid #37CBEA;
  `;

  // Microphone icon
  const icon = document.createElement("div");
  icon.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" stroke="white" stroke-width="2"/>
      <path d="M20 12v12M16 20c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  widgetContainer.appendChild(icon);

  // Widget state
  let isOpen = false;
  let mediaStream = null;
  let audioContext = null;

  // Click handler
  widgetContainer.addEventListener("click", async () => {
    isOpen = !isOpen;

    if (isOpen) {
      widgetContainer.style.width = "300px";
      widgetContainer.style.height = "400px";
      widgetContainer.style.borderRadius = "12px";
      icon.innerHTML = `
        <div style="text-align: center; color: white; font-family: arial;">
          <div style="font-size: 24px; margin-bottom: 10px;">🎤</div>
          <div style="font-size: 12px;">Click to speak</div>
          <button style="margin-top: 10px; padding: 8px 16px; background: #37CBEA; border: none; border-radius: 4px; color: #0B1B3B; cursor: pointer; font-weight: bold;">
            Start Now
          </button>
        </div>
      `;

      // Request microphone access
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("[MyOrbisVoice] Microphone access granted");
      } catch (err) {
        console.error("[MyOrbisVoice] Microphone access denied:", err);
        icon.innerHTML = `<div style="text-align: center; color: white; font-size: 12px;">Microphone<br/>access denied</div>`;
      }
    } else {
      widgetContainer.style.width = "80px";
      widgetContainer.style.height = "80px";
      widgetContainer.style.borderRadius = "50%";
      icon.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="white" stroke-width="2"/>
          <path d="M20 12v12M16 20c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

      // Stop microphone
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    }
  });

  // Add hover effect
  widgetContainer.addEventListener("mouseover", () => {
    if (!isOpen) {
      widgetContainer.style.transform = "scale(1.1)";
      widgetContainer.style.boxShadow = "0 6px 16px rgba(55, 203, 234, 0.4)";
    }
  });

  widgetContainer.addEventListener("mouseout", () => {
    if (!isOpen) {
      widgetContainer.style.transform = "scale(1)";
      widgetContainer.style.boxShadow = "0 4px 12px rgba(55, 203, 234, 0.3)";
    }
  });

  // Inject widget into page
  document.body.appendChild(widgetContainer);

  // Log initialization
  console.log(`[MyOrbisVoice] Widget initialized for agent: ${agentId}`);
})();
