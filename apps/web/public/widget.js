// Embedded widget loader script for OrbisVoice
// Standard usage: <script src="https://app.myorbisvoice.com/widget.js" data-agent-id="AGENT_ID" data-api-base="https://api.myorbisvoice.com"></script>

(function () {
  const script = document.currentScript;
  const agentId = script?.getAttribute("data-agent-id");
  const DEFAULT_API_BASE = "https://api.myorbisvoice.com";
  const deriveApiBase = () => {
    const src = script?.src;
    if (src) {
      try {
        const url = new URL(src, window.location.origin);
        return `${url.origin}/api`;
      } catch (err) {
        console.warn("[OrbisVoice] Failed to parse script src for API base", err);
      }
    }
    return DEFAULT_API_BASE;
  };
  const apiBase = script?.getAttribute("data-api-base")?.trim() || deriveApiBase();
  const position = script?.getAttribute("data-position") || "bottom-right";

  if (!agentId) {
    console.warn("[OrbisVoice] data-agent-id attribute is required");
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "orbis-voice-widget";
  widgetContainer.style.cssText = `
    position: fixed;
    ${position === "bottom-right" ? "right: 20px; bottom: 20px;" : ""}
    ${position === "bottom-left" ? "left: 20px; bottom: 20px;" : ""}
    ${position === "top-right" ? "right: 20px; top: 20px;" : ""}
    ${position === "top-left" ? "left: 20px; top: 20px;" : ""}
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    box-shadow: 0 4px 20px rgba(20, 184, 166, 0.3);
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 2px solid rgba(20, 184, 166, 0.4);
    overflow: hidden;
  `;

  // Inner icon / avatar container
  const innerContent = document.createElement("div");
  innerContent.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  `;
  widgetContainer.appendChild(innerContent);

  // Default mic icon
  const defaultIcon = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  `;
  innerContent.innerHTML = defaultIcon;

  // Widget state
  let isOpen = false;
  let agentConfig = null;
  let audioCtx = null;
  let ringerBuffer = null;
  let touchtoneBuffer = null;

  // Audio utility
  const playSound = (buffer) => {
    if (!audioCtx || !buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  };

  const loadAudio = async (url) => {
    try {
      const resp = await fetch(url);
      const arrayBuf = await resp.arrayBuffer();
      return await audioCtx.decodeAudioData(arrayBuf);
    } catch (e) {
      return null;
    }
  };

  // Fetch agent configuration
  const fetchConfig = async () => {
    try {
      const resp = await fetch(`${apiBase}/public/agents/${agentId}`);
      const json = await resp.json();
      if (json.ok) {
        agentConfig = json.data;

        // Apply visibility
        if (agentConfig.widgetIsVisible === false) {
          widgetContainer.style.display = "none";
          return;
        }

        // Apply position
        const pos = agentConfig.widgetPosition || position;
        widgetContainer.style.right = "auto";
        widgetContainer.style.left = "auto";
        widgetContainer.style.top = "auto";
        widgetContainer.style.bottom = "auto";
        if (pos === "bottom-right") {
          widgetContainer.style.right = "20px";
          widgetContainer.style.bottom = "20px";
        } else if (pos === "bottom-left") {
          widgetContainer.style.left = "20px";
          widgetContainer.style.bottom = "20px";
        } else if (pos === "top-right") {
          widgetContainer.style.right = "20px";
          widgetContainer.style.top = "20px";
        } else if (pos === "top-left") {
          widgetContainer.style.left = "20px";
          widgetContainer.style.top = "20px";
        }

        // Apply theme color
        if (agentConfig.widgetPrimaryColor) {
          widgetContainer.style.boxShadow = `0 4px 20px ${agentConfig.widgetPrimaryColor}4d`;
          widgetContainer.style.borderColor = `${agentConfig.widgetPrimaryColor}66`;
        }

        if (agentConfig.avatarUrl) {
          innerContent.innerHTML = `<img src="${agentConfig.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" />`;
        }

        // Initial state
        if (agentConfig.widgetDefaultOpen) {
          openWidget();
        }
      }
    } catch (e) {
      console.error("[OrbisVoice] Error fetching agent config:", e);
    }
  };

  fetchConfig();

  // Expansion logic
  const openWidget = () => {
    isOpen = true;
    
    // Create iframe if it doesn't exist
    let iframe = document.getElementById("orbis-voice-iframe");
    if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "orbis-voice-iframe";
        const baseUrl = script?.src ? new URL(script.src).origin : window.location.origin;
        iframe.src = `${baseUrl}/widget/${agentId}`;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 24px;
            background: #05080f;
            display: block;
        `;
        widgetContainer.appendChild(iframe);
    }
    
    // Hide original bubble icon
    innerContent.style.display = "none";
    
    // Animate container to full widget size
    widgetContainer.style.width = "360px";
    widgetContainer.style.height = "560px";
    widgetContainer.style.borderRadius = "24px";
    widgetContainer.style.background = "#05080f";
    widgetContainer.style.border = "1px solid rgba(255,255,255,0.15)";
    widgetContainer.style.boxShadow = "0 24px 80px rgba(0,0,0,0.6), 0 0 20px rgba(20,184,166,0.1)";
    iframe.style.display = "block";
  };

  const closeWidget = () => {
    isOpen = false;
    
    // Hide iframe
    const iframe = document.getElementById("orbis-voice-iframe");
    if (iframe) iframe.style.display = "none";
    
    // Restore bubble size and style
    widgetContainer.style.width = "64px";
    widgetContainer.style.height = "64px";
    widgetContainer.style.borderRadius = "50%";
    widgetContainer.style.background = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
    const color = agentConfig?.widgetPrimaryColor || "#14b8a6";
    widgetContainer.style.boxShadow = `0 8px 30px ${color}4d`;
    widgetContainer.style.border = `2px solid ${color}66`;

    // Restore original bubble icon
    innerContent.style.display = "flex";
    if (agentConfig?.avatarUrl) {
      innerContent.innerHTML = `<img src="${agentConfig.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`;
    } else {
      innerContent.innerHTML = defaultIcon;
    }
  };

  const startConversation = () => {
    openWidget();
  };

  // Interactions
  widgetContainer.addEventListener("click", () => {
    if (!isOpen) openWidget();
  });

  widgetContainer.addEventListener("mouseover", () => {
    if (!isOpen) {
      widgetContainer.style.transform = "scale(1.08)";
      widgetContainer.style.borderColor = "rgba(20, 184, 166, 0.8)";
    }
  });

  widgetContainer.addEventListener("mouseout", () => {
    if (!isOpen) {
      widgetContainer.style.transform = "scale(1)";
      widgetContainer.style.borderColor = "rgba(20, 184, 166, 0.4)";
    }
  });

  // Inject widget into page
  document.body.appendChild(widgetContainer);

  // Log initialization
  console.log(`[OrbisVoice] Widget initialized for agent: ${agentId}`);
})();
