// OrbisVoice Embedded Widget v3.0 — No-iframe, vanilla JS
// Usage: <script src="https://myorbisvoice.com/widget.js" data-agent-id="AGENT_ID" async></script>

(function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────────────────────
  const script = document.currentScript;
  const agentId = script?.getAttribute('data-agent-id');

  if (!agentId) {
    console.warn('[OrbisVoice] data-agent-id is required');
    return;
  }

  const origin = (() => {
    try { return new URL(script.src).origin; } catch (_) { return window.location.origin; }
  })();

  const apiBase   = script?.getAttribute('data-api-base') || `${origin}/api`;
  const position  = script?.getAttribute('data-position')  || 'bottom-right';
  const wsUrl     = origin.replace(/^http/, 'ws') + '/voice';
  const DEFAULT_COLOR = '#14b8a6';

  // ── State ──────────────────────────────────────────────────────────────────
  let agentConfig  = null;
  let color        = DEFAULT_COLOR;
  let phase        = 'idle';   // idle | connecting | talking
  let ws           = null;
  let audioCtx     = null;
  let mediaStream  = null;
  let processor    = null;

  // ── CSS ────────────────────────────────────────────────────────────────────
  const css = `
    #_ov_root *, #_ov_root *::before, #_ov_root *::after { box-sizing: border-box; margin: 0; padding: 0; }
    #_ov_root {
      position: fixed; z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #_ov_bubble {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border: 2px solid rgba(20,184,166,.45);
      box-shadow: 0 4px 24px rgba(20,184,166,.3);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform .3s cubic-bezier(.175,.885,.32,1.275), box-shadow .3s;
      overflow: hidden;
    }
    #_ov_bubble:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(20,184,166,.5); }
    #_ov_panel {
      width: 360px;
      background: #05080f;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,.1);
      box-shadow: 0 28px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.04);
      display: none; flex-direction: column; overflow: hidden;
      animation: _ov_fadein .28s ease;
    }
    @keyframes _ov_fadein {
      from { opacity:0; transform: translateY(10px) scale(.97); }
      to   { opacity:1; transform: translateY(0)   scale(1);   }
    }
    ._ov_hdr {
      padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,.05);
      background: rgba(255,255,255,.02);
    }
    ._ov_hdr_l { display: flex; align-items: center; gap: 8px; }
    ._ov_dot { width: 8px; height: 8px; border-radius: 50%; }
    ._ov_lbl { font-size: 10px; font-weight: 800; color: rgba(255,255,255,.45); letter-spacing: .18em; text-transform: uppercase; }
    ._ov_close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,.3); padding: 6px; border-radius: 8px; line-height: 0; transition: background .2s, color .2s; }
    ._ov_close:hover { background: rgba(255,255,255,.1); color: #fff; }
    ._ov_body { padding: 26px 22px; display: flex; flex-direction: column; gap: 18px; }
    ._ov_profile { display: flex; align-items: center; gap: 16px; }
    ._ov_avatar {
      width: 66px; height: 66px; border-radius: 18px; overflow: visible;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 900; color: #fff; flex-shrink: 0; position: relative;
    }
    ._ov_avatar_inner {
      width: 66px; height: 66px; border-radius: 18px; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    ._ov_avatar img { width: 100%; height: 100%; object-fit: cover; }
    ._ov_badge {
      position: absolute; bottom: -5px; right: -5px;
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid #05080f;
    }
    ._ov_name { font-size: 19px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: .04em; line-height: 1.1; }
    ._ov_vbadge {
      display: inline-block; margin-top: 7px;
      padding: 3px 12px; border-radius: 99px;
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
    }
    ._ov_wave {
      height: 78px; background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.05); border-radius: 14px;
      display: flex; align-items: center; justify-content: center; gap: 5px; padding: 0 18px;
    }
    ._ov_bar { width: 5px; border-radius: 4px; transition: opacity .3s; }
    ._ov_bar._ov_active { animation: _ov_wave 1.2s ease-in-out infinite; }
    @keyframes _ov_wave { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
    ._ov_btn {
      width: 100%; height: 64px; border-radius: 16px; border: none;
      font-weight: 900; font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
      color: #fff; transition: opacity .2s, transform .12s; position: relative; overflow: hidden;
    }
    ._ov_btn:active:not(:disabled) { transform: scale(.98); }
    ._ov_btn:disabled { opacity: .45; cursor: not-allowed; }
    ._ov_btn_end { background: rgba(239,68,68,.1)!important; border: 1px solid rgba(239,68,68,.3)!important; box-shadow: none!important; }
    ._ov_btn_end:hover { background: rgba(239,68,68,.22)!important; }
    ._ov_err {
      font-size: 10px; font-weight: 700; color: #f87171; text-align: center;
      background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
      border-radius: 12px; padding: 10px 14px; letter-spacing: .04em; display: none;
    }
    ._ov_footer {
      display: flex; justify-content: center;
      font-size: 9px; font-weight: 800; letter-spacing: .28em;
      color: #14b8a6; text-transform: uppercase; opacity: .22; padding-top: 2px;
    }
    ._ov_spin {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.2); border-top-color: #fff;
      animation: _ov_spinner .75s linear infinite;
    }
    @keyframes _ov_spinner { to { transform: rotate(360deg); } }
    ._ov_pulse { width: 9px; height: 9px; border-radius: 50%; background: #ef4444; animation: _ov_pulseA 1.2s ease-in-out infinite; }
    @keyframes _ov_pulseA { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── DOM ────────────────────────────────────────────────────────────────────
  const root = el('div', { id: '_ov_root' });
  positionRoot();

  // Bubble
  const bubble = el('div', { id: '_ov_bubble' });
  bubble.innerHTML = micIcon(28);
  bubble.addEventListener('click', openPanel);

  // Panel
  const panel = el('div', { id: '_ov_panel' });

  // Header
  const hdr = el('div', { class: '_ov_hdr' });
  const hdrL = el('div', { class: '_ov_hdr_l' });
  const dot  = el('div', { class: '_ov_dot', style: `background:${color};box-shadow:0 0 8px ${color}80` });
  const lbl  = el('span', { class: '_ov_lbl', text: 'ORBISVOICE LIVE' });
  hdrL.append(dot, lbl);
  const closeBtn = el('button', { class: '_ov_close', title: 'Close',
    html: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>` });
  closeBtn.addEventListener('click', closePanel);
  hdr.append(hdrL, closeBtn);

  // Body
  const body = el('div', { class: '_ov_body' });

  // Profile
  const profile = el('div', { class: '_ov_profile' });
  const avatar = el('div', { class: '_ov_avatar' });
  const avatarInner = el('div', { class: '_ov_avatar_inner',
    style: `background:linear-gradient(135deg,${color}20,${color}05);border:1px solid ${color}30` });
  const badge = el('div', { class: '_ov_badge', style: `background:${color}`,
    html: `<svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"/></svg>` });
  avatar.append(avatarInner, badge);
  const profileInfo = el('div');
  const agentNameEl = el('div', { class: '_ov_name', text: 'Loading...' });
  const vbadge = el('div', { class: '_ov_vbadge',
    style: `background:${color}20;color:${color}`, text: 'AI VOICE' });
  profileInfo.append(agentNameEl, vbadge);
  profile.append(avatar, profileInfo);

  // Waveform
  const waveEl = el('div', { class: '_ov_wave' });
  const barHeights = [6, 9, 14, 20, 14, 26, 14, 20, 14, 9, 6, 13, 19, 13, 8];
  const bars = barHeights.map((h, i) => {
    const b = el('div', { class: '_ov_bar',
      style: `height:${h}px;background:${color};opacity:.15;transform-origin:center;animation-delay:${i * 0.08}s` });
    waveEl.appendChild(b);
    return b;
  });

  // Action button
  const btn = el('button', { class: '_ov_btn' });
  setIdle();

  // Error
  const errEl = el('div', { class: '_ov_err' });

  // Footer
  const footer = el('div', { class: '_ov_footer', text: 'POWERED BY ORBISVOICE' });

  body.append(profile, waveEl, btn, errEl, footer);
  panel.append(hdr, body);
  root.append(bubble, panel);
  document.body.appendChild(root);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function el(tag, opts = {}) {
    const e = document.createElement(tag);
    if (opts.id)    e.id = opts.id;
    if (opts.class) e.className = opts.class;
    if (opts.style) e.setAttribute('style', opts.style);
    if (opts.title) e.title = opts.title;
    if (opts.html)  e.innerHTML = opts.html;
    if (opts.text)  e.textContent = opts.text;
    return e;
  }

  function micIcon(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>`;
  }

  function positionRoot() {
    const [v, h] = position.split('-');
    root.style.cssText = `position:fixed;z-index:2147483647;${v}:20px;${h}:20px;`;
  }

  function applyPos(pos) {
    if (!pos) return;
    const [v, h] = pos.split('-');
    root.style.top = 'auto'; root.style.bottom = 'auto';
    root.style.left = 'auto'; root.style.right = 'auto';
    root.style[v] = '20px'; root.style[h] = '20px';
  }

  function applyColor(c) {
    color = c || DEFAULT_COLOR;
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}80`;
    bubble.style.borderColor = `${color}66`;
    bubble.style.boxShadow = `0 4px 24px ${color}4d`;
    avatarInner.style.background = `linear-gradient(135deg,${color}20,${color}05)`;
    avatarInner.style.border = `1px solid ${color}30`;
    badge.style.background = color;
    vbadge.style.background = `${color}20`;
    vbadge.style.color = color;
    bars.forEach(b => b.style.background = color);
    if (phase === 'idle') rebuildIdleBtn();
  }

  function openPanel() {
    bubble.style.display = 'none';
    panel.style.display = 'flex';
  }

  function closePanel() {
    panel.style.display = 'none';
    bubble.style.display = 'flex';
    stopSession();
  }

  // ── Button states ──────────────────────────────────────────────────────────
  function rebuildIdleBtn() {
    btn.style.background = `linear-gradient(135deg,${color},${color}aa)`;
    btn.style.boxShadow  = `0 8px 40px ${color}40`;
    btn.style.border = 'none';
    btn.innerHTML = `${micIcon(20)}<span>START CONVERSATION</span>`;
  }

  function setIdle() {
    btn.disabled = false;
    btn.className = '_ov_btn';
    rebuildIdleBtn();
    btn.onclick = startSession;
    bars.forEach(b => { b.classList.remove('_ov_active'); b.style.opacity = '.15'; b.style.boxShadow = 'none'; });
  }

  function setConnecting() {
    btn.disabled = true;
    btn.className = '_ov_btn';
    btn.style.background = 'rgba(255,255,255,.05)';
    btn.style.boxShadow = 'none';
    btn.style.border = '1px solid rgba(255,255,255,.08)';
    btn.innerHTML = `<div class="_ov_spin"></div><span>CONNECTING...</span>`;
  }

  function setTalking() {
    btn.disabled = false;
    btn.className = '_ov_btn _ov_btn_end';
    btn.innerHTML = `<div class="_ov_pulse"></div><span>END CONVERSATION</span>`;
    btn.onclick = stopSession;
    bars.forEach((b, i) => {
      b.classList.add('_ov_active');
      b.style.opacity = '1';
      b.style.boxShadow = `0 0 10px ${color}60`;
    });
  }

  function showError(msg) {
    const clean = (msg.includes('NotAllowed') || msg.includes('denied') || msg.includes('ermission'))
      ? 'Microphone access denied. Please allow mic access in your browser and try again.'
      : msg;
    errEl.textContent = clean;
    errEl.style.display = 'block';
  }

  function clearError() { errEl.style.display = 'none'; errEl.textContent = ''; }

  // ── Audio utils ────────────────────────────────────────────────────────────
  function buf2b64(buffer) {
    const bytes = new Uint8Array(buffer);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function b642buf(b64) {
    const s = atob(b64);
    const buf = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
    return buf.buffer;
  }

  async function getAudioCtx() {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    return audioCtx;
  }

  function playPCMChunk(b64) {
    if (!audioCtx) return;
    try {
      const raw  = new Int16Array(b642buf(b64));
      const f32  = new Float32Array(raw.length);
      for (let i = 0; i < raw.length; i++) f32[i] = raw[i] / 32768;
      const buf  = audioCtx.createBuffer(1, f32.length, 24000);
      buf.copyToChannel(f32, 0);
      const src  = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start();
    } catch (_) {}
  }

  function stopAudio() {
    if (audioCtx) { try { audioCtx.close(); } catch(_) {} audioCtx = null; }
  }

  function stopMic() {
    if (processor) { try { processor.disconnect(); } catch(_) {} processor = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
  }

  // ── Session ────────────────────────────────────────────────────────────────
  async function startSession() {
    if (phase !== 'idle') return;
    clearError();
    
    // Step 1: Request mic IMMEDIATELY (must be first in click handler)
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
        video: false,
      });
    } catch (e) {
      console.error('[OrbisVoice] Mic denied:', e);
      showError('Microphone access denied. Please allow mic access in your browser and try again.');
      return;
    }

    setConnecting();
    phase = 'connecting';

    try {
      // Step 2: init AudioContext
      const ctx = await getAudioCtx();

      // Step 3: Open WebSocket
      const sock = new WebSocket(wsUrl);
      ws = sock;

      sock.onopen = () => {
        sock.send(JSON.stringify({
          type: 'control',
          data: JSON.stringify({
            event:        'init',
            token:        localStorage.getItem('token') || '',
            agentId,
            voiceId:      agentConfig?.voiceId      || 'aoede',
            voiceGender:  agentConfig?.voiceGender   || 'FEMALE',
            systemPrompt: agentConfig?.systemPrompt  || '',
          }),
          timestamp: Date.now(),
        }));
      };

      sock.onmessage = async (evt) => {
        let msg;
        try { msg = JSON.parse(evt.data); } catch (_) { return; }

        // Session confirmed — wire up microphone pipeline
        if (msg.ok && msg.message === 'Session initialized') {
          phase = 'talking';
          setTalking();

          const micSource = ctx.createMediaStreamSource(mediaStream);
          processor = ctx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            if (sock.readyState !== WebSocket.OPEN || phase !== 'talking') return;
            const f32  = e.inputBuffer.getChannelData(0);
            const i16  = new Int16Array(f32.length);
            for (let i = 0; i < f32.length; i++) {
              const s = Math.max(-1, Math.min(1, f32[i]));
              i16[i]  = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            sock.send(JSON.stringify({ type: 'audio', data: buf2b64(i16.buffer), timestamp: Date.now() }));
          };
          micSource.connect(processor);
          processor.connect(ctx.destination);
        }

        if (msg.type === 'audio' && msg.data)                      playPCMChunk(msg.data);
        if (msg.type === 'control' && msg.data === 'interrupted')  { stopAudio(); getAudioCtx(); }
        if (msg.error) { showError(msg.error); stopSession(); }
      };

      sock.onclose = () => { if (phase !== 'idle') stopSession(); };
      sock.onerror = () => { showError('Gateway connection failed. Please try again.'); stopSession(); };

    } catch (e) {
      console.error('[OrbisVoice]', e);
      
      const isNotAllowed = e.name === 'NotAllowedError' || e.message?.includes('denied');
      const inIframe = window.self !== window.top;

      if (isNotAllowed && inIframe) {
        showError('Microphone restricted in iframe. Click below to talk in a new window:');
        const bypass = document.createElement('button');
        bypass.textContent = 'Open in New Window to Talk';
        bypass.style.cssText = 'width:100%; margin-top:12px; padding:10px; border-radius:12px; background:#14b8a6; color:white; border:0; font-weight:bold; cursor:pointer; font-size:12px;';
        bypass.onclick = () => window.open(window.location.href, '_blank');
        errEl.appendChild(document.createElement('br'));
        errEl.appendChild(bypass);
      } else {
        showError(e.message || String(e));
      }

      phase = 'idle';
      setIdle();
      stopMic();
      stopAudio();
    }
  }

  function stopSession() {
    phase = 'idle';
    stopMic();
    stopAudio();
    if (ws) { try { ws.close(); } catch (_) {} ws = null; }
    setIdle();
  }

  // ── Fetch agent config ─────────────────────────────────────────────────────
  async function fetchConfig() {
    try {
      const res  = await fetch(`${apiBase}/public/agents/${agentId}`);
      const json = await res.json();
      if (!json.ok || !json.data) return;
      agentConfig = json.data;

      if (agentConfig.widgetIsVisible === false) { root.style.display = 'none'; return; }

      applyPos(agentConfig.widgetPosition);
      if (agentConfig.widgetPrimaryColor) applyColor(agentConfig.widgetPrimaryColor);

      agentNameEl.textContent = agentConfig.name || 'AI Assistant';

      if (agentConfig.avatarUrl) {
        const src = agentConfig.avatarUrl.startsWith('/') 
          ? `${origin}${agentConfig.avatarUrl}` 
          : agentConfig.avatarUrl;
        avatarInner.innerHTML = `<img src="${src}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;"/>`;
        // Mirror on bubble
        bubble.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
      }

      if (agentConfig.widgetDefaultOpen) openPanel();
    } catch (e) {
      console.warn('[OrbisVoice] Config fetch failed:', e);
    }
  }

  fetchConfig();
  console.log('[OrbisVoice] Widget v3 initialized — agent:', agentId);
})();
