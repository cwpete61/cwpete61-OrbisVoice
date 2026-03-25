"use client";
import React from "react";

interface AgentWidgetSectionProps {
  agentType: string;
  agentId: string;
  widgetPosition: string;
  setWidgetPositionAction: (pos: string) => void;
  widgetPrimaryColor: string;
  setWidgetPrimaryColorAction: (color: string) => void;
  widgetIsVisible: boolean;
  setWidgetIsVisibleAction: (visible: boolean) => void;
  widgetDefaultOpen: boolean;
  setWidgetDefaultOpenAction: (open: boolean) => void;
  triggerAutoSaveAction: (overrides?: any) => void;
  isActive: boolean;
  onActivateAction: () => void;
  isStepCompleteAction: (step: number) => boolean;
}

export default function AgentWidgetSection({
  agentType,
  agentId,
  widgetPosition,
  setWidgetPositionAction,
  widgetPrimaryColor,
  setWidgetPrimaryColorAction,
  widgetIsVisible,
  setWidgetIsVisibleAction,
  widgetDefaultOpen,
  setWidgetDefaultOpenAction,
  triggerAutoSaveAction,
  isActive,
  onActivateAction,
  isStepCompleteAction,
}: AgentWidgetSectionProps) {
  if (agentType !== "WIDGET") return null;

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? "ring-1 ring-[#14b8a6]/30" : ""}`}
    >
      <button
        onClick={onActivateAction}
        suppressHydrationWarning
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isActive
              ? "bg-[#14b8a6] text-white"
              : isStepCompleteAction(3)
                ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
          }`}
        >
          3
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold text-white">Widget & Embed</div>
          <div className="text-xs text-[rgba(240,244,250,0.35)]">
            Configure how the widget appears on your site
          </div>
        </div>
        {isStepCompleteAction(3) && !isActive && (
          <div className="ml-auto text-xs text-[#14b8a6] font-medium">Configured</div>
        )}
      </button>

      {isActive && (
        <div className="px-6 pb-6 fade-slide-up">
          <div className="border-t border-white/[0.05] pt-5 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
                Embed Code
              </label>
              <div className="space-y-4">
                {/* Script Option */}
                <div className="relative group">
                  <div className="absolute -top-2 left-3 px-2 bg-[#05080f] text-[9px] font-bold text-[#14b8a6] uppercase tracking-tighter z-10">Standard Script</div>
                  <pre className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-4 py-3 text-[10px] text-[rgba(240,244,250,0.5)] font-mono overflow-x-auto">
                    {`<script 
  src="${typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://myorbisvoice.com' : window.location.origin) : ''}/widget.js" 
  data-agent-id="${agentId || "YOUR_AGENT_ID"}"
  data-api-base="${typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://myorbisvoice.com' : window.location.origin) : ''}/api"
  data-app-base="${typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://myorbisvoice.com' : window.location.origin) : ''}"
  async
></script>`}
                  </pre>
                  <button
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://myorbisvoice.com' : window.location.origin) : '';
                      const code = `<script src="${origin}/widget.js" data-agent-id="${agentId || "YOUR_AGENT_ID"}" data-api-base="${origin}/api" data-app-base="${origin}" async></script>`;
                      navigator.clipboard.writeText(code);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>

                {/* Iframe Option */}
                <div className="relative group">
                  <div className="absolute -top-2 left-3 px-2 bg-[#05080f] text-[9px] font-bold text-[#6366f1] uppercase tracking-tighter z-10">Iframe (Direct)</div>
                  <pre className="w-full bg-[#0a0e1a] border border-[#6366f1]/20 rounded-xl px-4 py-3 text-[10px] text-[rgba(240,244,250,0.4)] font-mono overflow-x-auto">
                    {`<iframe
  src="${typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://myorbisvoice.com' : window.location.origin) : ''}/widget/${agentId || "YOUR_AGENT_ID"}"
  allow="microphone"
  style="width: 400px; height: 600px; border: none; position: fixed; bottom: 0; right: 0; z-index: 9999;"
></iframe>`}
                  </pre>
                  <button
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://myorbisvoice.com' : window.location.origin) : '';
                      const code = `<iframe src="${origin}/widget/${agentId || "YOUR_AGENT_ID"}" allow="microphone" style="width: 400px; height: 600px; border: none; position: fixed; bottom: 0; right: 0; z-index: 9999;"></iframe>`;
                      navigator.clipboard.writeText(code);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="mt-4 text-[10px] text-[rgba(240,244,250,0.3)] leading-relaxed">
                <span className="text-[#14b8a6] font-bold">Standard Script:</span> Best for standard websites. Injects the bubble directly.<br/>
                <span className="text-[#6366f1] font-bold">Iframe:</span> Best for platforms that restrict custom scripts. **Requirement:** Must include <code className="bg-white/5 px-1 rounded">allow=&quot;microphone&quot;</code>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Position */}
              <div>
                <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
                  Position
                </label>
                <select 
                  value={widgetPosition}
                  onChange={(e) => {
                    setWidgetPositionAction(e.target.value);
                    triggerAutoSaveAction();
                  }}
                  className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#14b8a6]/50"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              {/* Theme Color */}
              <div>
                <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
                  Theme Color
                </label>
                <div className="flex gap-2">
                  <input 
                    type="color"
                    value={widgetPrimaryColor}
                    onChange={(e) => {
                      setWidgetPrimaryColorAction(e.target.value);
                      triggerAutoSaveAction();
                    }}
                    className="w-10 h-10 bg-transparent border-0 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={widgetPrimaryColor}
                    onChange={(e) => setWidgetPrimaryColorAction(e.target.value)}
                    onBlur={() => triggerAutoSaveAction()}
                    className="flex-1 bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-3 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-2">
              <div className="items-center justify-between flex">
                <div>
                  <div className="text-sm font-semibold text-white">Visible on site</div>
                  <div className="text-[10px] text-white/30">Instantly show or hide the widget icon</div>
                </div>
                <button
                  onClick={() => {
                    const val = !widgetIsVisible;
                    setWidgetIsVisibleAction(val);
                    triggerAutoSaveAction();
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${widgetIsVisible ? 'bg-[#14b8a6]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${widgetIsVisible ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="items-center justify-between flex">
                <div>
                  <div className="text-sm font-semibold text-white">Default Opened</div>
                  <div className="text-[10px] text-white/30">Start with the chat window already open</div>
                </div>
                <button
                  onClick={() => {
                    const val = !widgetDefaultOpen;
                    setWidgetDefaultOpenAction(val);
                    triggerAutoSaveAction();
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${widgetDefaultOpen ? 'bg-[#14b8a6]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${widgetDefaultOpen ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
