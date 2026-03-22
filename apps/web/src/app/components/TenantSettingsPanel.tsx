"use client";

import { useEffect, useState } from "react";
import PasswordInput from "./PasswordInput";
import { apiFetch } from "@/lib/api";

export default function TenantSettingsPanel({ tenantId }: { tenantId: string }) {
  const [twilioConfig, setTwilioConfig] = useState<any>({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
    hasConfig: false,
  });
  const [tenantGoogleConfig, setTenantGoogleConfig] = useState<any>({
    clientId: "",
    clientSecret: "",
    geminiApiKey: "",
    hasConfig: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<any>(null);

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    setSettingsLoading(true);
    apiFetch<{ twilio?: any; google?: any }>(`/admin/subscribers/${tenantId}/settings`)
      .then(({ data }) => {
        if (data?.data) {
          setTwilioConfig(
            data.data.twilio || { accountSid: "", authToken: "", phoneNumber: "", hasConfig: false }
          );
          setTenantGoogleConfig(
            data.data.google || {
              clientId: "",
              clientSecret: "",
              geminiApiKey: "",
              hasConfig: false,
            }
          );
        }
        setSettingsLoading(false);
      })
      .catch(() => setSettingsLoading(false));
  }, [tenantId]);

  useEffect(() => {
    setKeysLoading(true);
    apiFetch<any[]>(`/admin/subscribers/${tenantId}/api-keys`)
      .then(({ data }) => {
        if (data?.data) setApiKeys(data.data);
        setKeysLoading(false);
      })
      .catch(() => setKeysLoading(false));
  }, [tenantId]);

  const saveTenantSettings = async (type: "twilio" | "google") => {
    setSettingsSaving(true);
    setSettingsMessage(null);
    const config = type === "twilio" ? twilioConfig : tenantGoogleConfig;

    try {
      const { data } = await apiFetch<any>(`/admin/subscribers/${tenantId}/settings`, {
        method: "POST",
        body: JSON.stringify({ type, config }),
      });
      if (data?.data) {
        setSettingsMessage({
          type: "success",
          text: `${type.charAt(0).toUpperCase() + type.slice(1)} settings saved.`,
        });
        if (type === "twilio") setTwilioConfig({ ...twilioConfig, hasConfig: true });
        if (type === "google") setTenantGoogleConfig({ ...tenantGoogleConfig, hasConfig: true });
      } else {
        setSettingsMessage({
          type: "error",
          text: data?.data?.message || "Failed to save settings.",
        });
      }
    } catch (err) {
      setSettingsMessage({ type: "error", text: "Network error." });
    } finally {
      setSettingsSaving(false);
    }
  };

  const deleteTenantSettings = async (type: "twilio" | "google") => {
    if (!confirm(`Are you sure you want to remove the ${type} configuration for this tenant?`))
      return;
    try {
      await apiFetch(`/admin/subscribers/${tenantId}/settings/${type}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete settings:", err);
    } finally {
      if (type === "twilio")
        setTwilioConfig({ accountSid: "", authToken: "", phoneNumber: "", hasConfig: false });
      else
        setTenantGoogleConfig({
          clientId: "",
          clientSecret: "",
          geminiApiKey: "",
          hasConfig: false,
        });
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const { data } = await apiFetch<any>(`/admin/subscribers/${tenantId}/api-keys`, {
        method: "POST",
        body: JSON.stringify({ name: newKeyName }),
      });
      if (data?.data) {
        setApiKeys([data.data, ...apiKeys]);
        setNewKeyName("");
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      await apiFetch(`/admin/subscribers/${tenantId}/api-keys/${keyId}`, {
        method: "DELETE",
      });
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 pr-6">
      <div className="space-y-6">
        {settingsMessage && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${settingsMessage.type === "success" ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}
          >
            <span>{settingsMessage.text}</span>
            <button
              onClick={() => setSettingsMessage(null)}
              className="text-xs opacity-50 hover:opacity-100 italic"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="rounded-xl border border-white/[0.04] bg-[#0c111d]/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#f0f4fa]">Twilio Configuration</h2>
            </div>
            {twilioConfig.hasConfig && (
              <button
                onClick={() => deleteTenantSettings("twilio")}
                className="text-[10px] font-bold uppercase tracking-wider text-red-400/70 hover:text-red-400 transition"
              >
                Remove Config
              </button>
            )}
          </div>

          {settingsLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent mx-auto my-6" />
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[rgba(240,244,250,0.6)] mb-1">
                  Account SID
                </label>
                <input
                  type="text"
                  value={twilioConfig.accountSid}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                  className="w-full rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-[rgba(240,244,250,0.6)] mb-1">
                  Auth Token
                </label>
                <PasswordInput
                  value={twilioConfig.authToken}
                  onChange={(e: any) =>
                    setTwilioConfig({ ...twilioConfig, authToken: e.target.value })
                  }
                  className="w-full rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-[rgba(240,244,250,0.6)] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={twilioConfig.phoneNumber}
                  onChange={(e) =>
                    setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })
                  }
                  className="w-full rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
                />
              </div>
              <button
                onClick={() => saveTenantSettings("twilio")}
                disabled={settingsSaving}
                className="btn-primary w-full py-1.5 text-xs"
              >
                {settingsSaving ? "Saving..." : "Update Twilio"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-[#0c111d]/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#f0f4fa]">Google Cloud & Gemini</h2>
            </div>
            {tenantGoogleConfig.hasConfig && (
              <button
                onClick={() => deleteTenantSettings("google")}
                className="text-[10px] font-bold uppercase tracking-wider text-red-400/70 hover:text-red-400 transition"
              >
                Remove Config
              </button>
            )}
          </div>

          {settingsLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent mx-auto my-6" />
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[rgba(240,244,250,0.6)] mb-1">
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={tenantGoogleConfig.clientId}
                  onChange={(e) =>
                    setTenantGoogleConfig({ ...tenantGoogleConfig, clientId: e.target.value })
                  }
                  className="w-full rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-[rgba(240,244,250,0.6)] mb-1">
                  Google Client Secret
                </label>
                <PasswordInput
                  value={tenantGoogleConfig.clientSecret}
                  onChange={(e: any) =>
                    setTenantGoogleConfig({ ...tenantGoogleConfig, clientSecret: e.target.value })
                  }
                  className="w-full rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-[rgba(240,244,250,0.6)] mb-1">
                  Gemini API Key
                </label>
                <PasswordInput
                  value={tenantGoogleConfig.geminiApiKey}
                  onChange={(e: any) =>
                    setTenantGoogleConfig({ ...tenantGoogleConfig, geminiApiKey: e.target.value })
                  }
                  className="w-full rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
                />
              </div>
              <button
                onClick={() => saveTenantSettings("google")}
                disabled={settingsSaving}
                className="btn-primary w-full py-1.5 text-xs"
              >
                {settingsSaving ? "Saving..." : "Update Google"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-white/[0.04] bg-[#0c111d]/50 p-5">
          <h2 className="text-sm font-semibold text-[#f0f4fa] mb-4">API Keys</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="New key name..."
              className="flex-1 rounded border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition"
            />
            <button
              onClick={createApiKey}
              disabled={creatingKey || !newKeyName.trim()}
              className="btn-primary px-4 text-xs whitespace-nowrap"
            >
              Generate
            </button>
          </div>

          <div className="rounded-lg border border-white/[0.04] bg-[#0c111d] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05] text-left">
                  <th className="px-3 py-2 text-[10px] font-bold text-[rgba(240,244,250,0.35)]">
                    Name
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-[rgba(240,244,250,0.35)]">
                    Key
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-[rgba(240,244,250,0.35)] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {keysLoading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-[rgba(240,244,250,0.4)]">
                      Loading...
                    </td>
                  </tr>
                ) : apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-[rgba(240,244,250,0.4)]">
                      No keys
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((k: any) => (
                    <tr key={k.id} className="hover:bg-white/[0.01]">
                      <td className="px-3 py-2 font-medium text-[#f0f4fa]">{k.name}</td>
                      <td className="px-3 py-2 font-mono text-[#14b8a6]">
                        {k.key.substring(0, 6)}...{k.key.substring(k.key.length - 4)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => revokeApiKey(k.id)}
                          className="text-red-400/70 hover:text-red-400 transition underline underline-offset-4"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
