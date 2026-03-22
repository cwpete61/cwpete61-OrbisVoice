// Embedded widget loader script for OrbisVoice
// Standard usage: <script src="https://app.myorbisvoice.com/widget.js" data-agent-id="AGENT_ID" data-api-base="https://api.myorbisvoice.com"></script>

(function () {
  const script = document.currentScript;
  const agentId = script?.getAttribute("data-agent-id");
  const apiBase = script?.getAttribute("data-api-base") || "http://localhost:4001";
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
        if (agentConfig.avatarUrl) {
          innerContent.innerHTML = `<img src="${agentConfig.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" />`;
        }
      }
    } catch (e) {
      console.error("[OrbisVoice] Error fetching agent config:", e);
    }
  };

  fetchConfig();

  // Expansion logic
  const openWidget = async () => {
    isOpen = true;
    widgetContainer.style.width = "320px";
    widgetContainer.style.height = "420px";
    widgetContainer.style.borderRadius = "24px";
    widgetContainer.style.background = "#05080f";
    widgetContainer.style.border = "1px solid rgba(255,255,255,0.1)";
    
    // Initialize AudioContext on first click
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      ringerBuffer = await loadAudio(`${apiBase}/assets/audio/ringer.mp3`);
      touchtoneBuffer = await loadAudio(`${apiBase}/assets/audio/touchtone.mp3`);
    }

    renderContent();

    // Auto-start if enabled
    if (agentConfig?.autoStart) {
      setTimeout(() => {
        startConversation();
      }, 500);
    }
  };

  const closeWidget = () => {
    isOpen = false;
    widgetContainer.style.width = "64px";
    widgetContainer.style.height = "64px";
    widgetContainer.style.borderRadius = "50%";
    widgetContainer.style.background = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
    widgetContainer.style.border = "2px solid rgba(20, 184, 166, 0.4)";
    
    if (agentConfig?.avatarUrl) {
      innerContent.innerHTML = `<img src="${agentConfig.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`;
    } else {
      innerContent.innerHTML = defaultIcon;
    }
  };

  const renderContent = () => {
    innerContent.innerHTML = `
      <div style="width: 100%; height: 100%; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4);">OrbisVoice AI</div>
            <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">${agentConfig?.name || "Assistant"}</div>
          </div>
          <div id="close-btn" style="cursor: pointer; opacity: 0.5; hover: opacity: 1;">✕</div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <div style="position: relative; margin-bottom: 24px;">
            <div style="width: 100px; height: 100px; border-radius: 30px; background: rgba(255,255,255,0.05); display: flex; items-center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              ${agentConfig?.avatarUrl ? `<img src="${agentConfig.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-size: 40px; margin-top: 25px;">🤖</span>`}
            </div>
            <div style="position: absolute; bottom: -5px; right: -5px; width: 14px; height: 14px; background: #14b8a6; border-radius: 50%; border: 3px solid #05080f;"></div>
          </div>
          
          <div id="status-text" style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 30px; line-height: 1.5; max-width: 200px;">
            Ready to help with your voice requests.
          </div>

          <button id="main-action-btn" style="width: 100%; padding: 14px; border-radius: 14px; border: none; background: #14b8a6; color: white; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3);">
            ${agentConfig?.autoStart ? "Connecting..." : "Start Conversation"}
          </button>
        </div>
        
        <div style="margin-top: 20px; font-size: 10px; text-align: center; color: rgba(255,255,255,0.2);">
          Powered by <b>OrbisVoice</b>
        </div>
      </div>
    `;

    document.getElementById("close-btn").onclick = (e) => {
      e.stopPropagation();
      closeWidget();
    };

    document.getElementById("main-action-btn").onclick = (e) => {
      e.stopPropagation();
      playSound(touchtoneBuffer);
      startConversation();
    };
  };

  const startConversation = () => {
    const btn = document.getElementById("main-action-btn");
    const status = document.getElementById("status-text");
    if (!btn || !status) return;

    playSound(ringerBuffer);
    status.innerText = "Connecting to voice gateway...";
    btn.innerText = "Connecting...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    // Actual voice connection logic would go here
    // For now, we simulate success
    setTimeout(() => {
      status.innerHTML = `<span style="color: #14b8a6; font-weight: bold;">Agent is listening...</span>`;
      btn.innerText = "End Conversation";
      btn.style.background = "rgba(239, 68, 68, 0.2)";
      btn.style.color = "#ef4444";
      btn.style.border = "1px solid rgba(239, 68, 68, 0.4)";
      btn.style.boxShadow = "none";
      btn.disabled = false;
      
      btn.onclick = (e) => {
        e.stopPropagation();
        closeWidget();
      };
    }, 1500);
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
