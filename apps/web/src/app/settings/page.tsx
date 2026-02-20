"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import PasswordInput from "../components/PasswordInput";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";

function SettingsContent() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "api");
  const [profile, setProfile] = useState<any>(null);
  const [googleConfig, setGoogleConfig] = useState<any>({
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    enabled: false,
  });
  const [googleSaving, setGoogleSaving] = useState(false);
  const [googleSaveSuccess, setGoogleSaveSuccess] = useState(false);
  const [googleTesting, setGoogleTesting] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarConnectUrl, setCalendarConnectUrl] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailVerified, setGmailVerified] = useState(false);
  const [gmailConnectUrl, setGmailConnectUrl] = useState<string | null>(null);
  const [gmailTesting, setGmailTesting] = useState(false);
  const [gmailTestResult, setGmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [gmailClientId, setGmailClientId] = useState("");
  const [gmailClientSecret, setGmailClientSecret] = useState("");
  const [gmailCredentialsSaving, setGmailCredentialsSaving] = useState(false);
  const [gmailCredentialsResult, setGmailCredentialsResult] = useState<{ success: boolean; message: string } | null>(null);

  // Tenant Google Config State
  const [tenantGoogleConfig, setTenantGoogleConfig] = useState<any>({
    clientId: "",
    clientSecret: "",
    geminiApiKey: "",
    hasConfig: false,
  });
  const [tenantConfigLoading, setTenantConfigLoading] = useState(false);
  const [tenantConfigSaving, setTenantConfigSaving] = useState(false);
  const [tenantConfigMessage, setTenantConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Twilio State
  const [twilioConfig, setTwilioConfig] = useState<any>({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });
  const [twilioLoading, setTwilioLoading] = useState(false);
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [twilioMessage, setTwilioMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // System Email State
  const [systemEmailConfig, setSystemEmailConfig] = useState<any>({
    username: "",
    password: "",
    imapServer: "",
    imapPort: "",
    imapSecurity: "SSL",
    smtpServer: "",
    smtpPort: "",
    smtpSecurity: "SSL",
    pop3Server: "",
    pop3Port: "",
    pop3Security: "SSL",
  });
  const [systemEmailLoading, setSystemEmailLoading] = useState(false);
  const [systemEmailSaving, setSystemEmailSaving] = useState(false);
  const [systemEmailMessage, setSystemEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemEmailTesting, setSystemEmailTesting] = useState(false);
  const [systemEmailTestResult, setSystemEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [systemTestEmailTarget, setSystemTestEmailTarget] = useState("");

  const [stripeConnectConfig, setStripeConnectConfig] = useState({
    clientId: "",
    enabled: false,
    minimumPayout: 100,
  });
  const [stripeConnectSaving, setStripeConnectSaving] = useState(false);
  const [stripeConnectMessage, setStripeConnectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [stripeConnectTesting, setStripeConnectTesting] = useState(false);
  const [stripeConnectTestResult, setStripeConnectTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const tokenLoaded = useTokenFromUrl();

  const isAdmin =
    profile?.role === "ADMIN" ||
    profile?.isAdmin ||
    profile?.username === "Oadmin" ||
    profile?.email === "admin@orbisvoice.app" ||
    tokenEmail === "admin@orbisvoice.app";

  useEffect(() => {
    fetchApiKeys();
    fetchProfile();
    checkCalendarConnection();
    checkGmailConnection();
    fetchGmailCredentials();
    fetchGmailCredentials();
    fetchGmailCredentials();
    fetchTenantGoogleConfig();
    fetchTwilioConfig();
    fetchSystemEmailConfig();
    fetchStripeConnectConfig();
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        setTokenEmail(payload?.email || null);
      } catch {
        setTokenEmail(null);
      }
    }
  }, [tokenLoaded]);

  const fetchGmailCredentials = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/gmail/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.gmailClientId) {
          setGmailClientId(data.data.gmailClientId);
          setGmailClientSecret(data.data.gmailClientSecret || "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch Gmail credentials:", err);
    }
  };


  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchGoogleConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/google-auth/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleConfig({
          clientId: data.data.clientId || "",
          clientSecret: data.data.clientSecret || "",
          redirectUri: data.data.redirectUri || "",
          enabled: !!data.data.enabled,
        });
      }
    } catch (err) {
      console.error("Failed to fetch Google config:", err);
    }

  };

  const fetchTenantGoogleConfig = async () => {
    try {
      setTenantConfigLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/google-config?include_secrets=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setTenantGoogleConfig({
            clientId: data.data.clientId || "",
            clientSecret: data.data.clientSecret || "",
            geminiApiKey: data.data.geminiApiKey || "",
            hasConfig: !!data.data.hasConfig,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch tenant Google config:", err);
    } finally {
      setTenantConfigLoading(false);
    }
  };

  const saveTenantGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantConfigSaving(true);
    setTenantConfigMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/google-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: tenantGoogleConfig.clientId,
          clientSecret: tenantGoogleConfig.clientSecret,
          geminiApiKey: tenantGoogleConfig.geminiApiKey,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTenantConfigMessage({ type: 'success', text: 'Configuration saved successfully' });
        fetchTenantGoogleConfig();
        setTimeout(() => setTenantConfigMessage(null), 3000);
      } else {
        setTenantConfigMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
      }
    } catch (err) {
      console.error("Failed to save tenant config:", err);
      setTenantConfigMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setTenantConfigSaving(false);
    }
  };

  const deleteTenantGoogleConfig = async () => {
    if (!confirm("Are you sure? This will revert to platform default credentials.")) return;

    setTenantConfigSaving(true);
    setTenantConfigMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/google-config`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTenantConfigMessage({ type: 'success', text: 'Configuration removed. Using platform defaults.' });
        setTenantGoogleConfig({
          clientId: "",
          clientSecret: "",
          geminiApiKey: "",
          hasConfig: false,
        });
        setTimeout(() => setTenantConfigMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete tenant config:", err);
    } finally {
      setTenantConfigSaving(false);
    }
  };

  const fetchTwilioConfig = async () => {
    try {
      setTwilioLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/twilio/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setTwilioConfig({
            accountSid: data.data.accountSid || "",
            authToken: data.data.authToken || "",
            phoneNumber: data.data.phoneNumber || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch Twilio config:", err);
    } finally {
      setTwilioLoading(false);
    }
  };

  const saveTwilioConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwilioSaving(true);
    setTwilioMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/twilio/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(twilioConfig),
      });

      if (res.ok) {
        setTwilioMessage({ type: 'success', text: 'Twilio configuration saved successfully' });
        setTimeout(() => setTwilioMessage(null), 3000);
      } else {
        const data = await res.json();
        setTwilioMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
      }
    } catch (err) {
      console.error("Failed to save Twilio config:", err);
      setTwilioMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setTwilioSaving(false);
    }
  };

  const fetchSystemEmailConfig = async () => {
    try {
      setSystemEmailLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-email`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSystemEmailConfig({
            username: data.data.username || "",
            password: data.data.password || "",
            imapServer: data.data.imapServer || "",
            imapPort: data.data.imapPort || "",
            imapSecurity: data.data.imapSecurity || "SSL",
            smtpServer: data.data.smtpServer || "",
            smtpPort: data.data.smtpPort || "",
            smtpSecurity: data.data.smtpSecurity || "SSL",
            pop3Server: data.data.pop3Server || "",
            pop3Port: data.data.pop3Port || "",
            pop3Security: data.data.pop3Security || "SSL",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch System Email config:", err);
    } finally {
      setSystemEmailLoading(false);
    }
  };

  const saveSystemEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemEmailSaving(true);
    setSystemEmailMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(systemEmailConfig),
      });

      if (res.ok) {
        setSystemEmailMessage({ type: 'success', text: 'System Email configuration saved successfully' });
        setTimeout(() => setSystemEmailMessage(null), 3000);
      } else {
        const data = await res.json();
        setSystemEmailMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
      }
    } catch (err) {
      console.error("Failed to save System Email config:", err);
      setSystemEmailMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSystemEmailSaving(false);
    }
  };

  const testSystemEmailConfig = async (forceDevMode = false) => {
    if (!systemTestEmailTarget) {
      setSystemEmailTestResult({ success: false, message: "Please enter a test email address" });
      return;
    }

    setSystemEmailTesting(true);
    setSystemEmailTestResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-email/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testEmail: systemTestEmailTarget, forceDevMode }),
      });

      const data = await res.json();
      if (res.ok) {
        setSystemEmailTestResult({ success: true, message: data.message || "Test email sent successfully!" });
      } else {
        setSystemEmailTestResult({ success: false, message: data.message || "Failed to send test email" });
      }
    } catch (err: any) {
      console.error("Test email connection failed:", err);
      setSystemEmailTestResult({ success: false, message: `Connection failed: ${err.message || "Unknown error"}` });
    } finally {
      setSystemEmailTesting(false);
    }
  };

  const fetchStripeConnectConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stripe-connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setStripeConnectConfig(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Stripe Connect config:", err);
    }
  };

  const saveStripeConnectConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeConnectSaving(true);
    setStripeConnectMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stripe-connect`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...stripeConnectConfig,
          minimumPayout: Number(stripeConnectConfig.minimumPayout) || 100
        }),
      });

      if (res.ok) {
        setStripeConnectMessage({ type: 'success', text: 'Stripe Connect configuration saved successfully' });
        setTimeout(() => setStripeConnectMessage(null), 3000);
      } else {
        const data = await res.json();
        setStripeConnectMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
      }
    } catch (err) {
      console.error("Failed to save Stripe Connect config:", err);
      setStripeConnectMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setStripeConnectSaving(false);
    }
  };

  const testStripeConnectConnection = async () => {
    setStripeConnectTesting(true);
    setStripeConnectTestResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stripe-connect/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setStripeConnectTestResult({
          success: true,
          message: data.message,
          data: data.data
        });
      } else {
        setStripeConnectTestResult({
          success: false,
          message: data.message || "Failed to connect to Stripe"
        });
      }
    } catch (err) {
      console.error("Failed to test Stripe connection:", err);
      setStripeConnectTestResult({
        success: false,
        message: "Network error occurred while testing connection"
      });
    } finally {
      setStripeConnectTesting(false);
    }
  };

  const saveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSaving(true);
    setGoogleTestResult(null);
    setGoogleSaveSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/google-auth/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(googleConfig),
      });
      if (res.ok) {
        await fetchGoogleConfig();
        setGoogleSaveSuccess(true);
        setTimeout(() => setGoogleSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save Google config:", err);
    } finally {
      setGoogleSaving(false);
    }
  };

  const testGoogleConnection = async () => {
    setGoogleTesting(true);
    setGoogleTestResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/url`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.data?.url) {
          setGoogleTestResult({
            success: true,
            message: "Configuration is valid! Google OAuth URL generated successfully.",
          });
        } else {
          setGoogleTestResult({
            success: false,
            message: "Configuration returned invalid response.",
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setGoogleTestResult({
          success: false,
          message: errorData.message || `Error: ${res.status} ${res.statusText}`,
        });
      }
    } catch (err: any) {
      setGoogleTestResult({
        success: false,
        message: `Connection failed: ${err.message || "Unknown error"}`,
      });
    } finally {
      setGoogleTesting(false);
    }
  };

  const checkCalendarConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarConnected(!!data.data?.connected);
      }
    } catch (err) {
      console.error("Failed to check calendar connection:", err);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      setCalendarLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/calendar-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.url) {
          setCalendarConnectUrl(data.data.url);
          // Redirect to Google OAuth for calendar access
          window.location.href = data.data.url;
        }
      }
    } catch (err) {
      console.error("Failed to get calendar connect URL:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("Are you sure you want to disconnect your calendar?")) return;

    try {
      setCalendarLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/calendar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCalendarConnected(false);
      }
    } catch (err) {
      console.error("Failed to disconnect calendar:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const checkGmailConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/gmail/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGmailConnected(!!data.data?.gmailEmail);
        setGmailEmail(data.data?.gmailEmail || null);
        setGmailVerified(data.data?.verified || false);
      }
    } catch (err) {
      console.error("Failed to check Gmail connection:", err);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setGmailLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/gmail-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.url) {
          setGmailConnectUrl(data.data.url);
          // Redirect to Google OAuth for Gmail access
          window.location.href = data.data.url;
        }
      }
    } catch (err) {
      console.error("Failed to get Gmail connect URL:", err);
    } finally {
      setGmailLoading(false);
    }
  };

  const handleVerifyGmail = async () => {
    setGmailTesting(true);
    setGmailTestResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/gmail/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setGmailTestResult({
          success: true,
          message: `Gmail connection verified! Email: ${data.data?.gmailEmail}`,
        });
        setGmailVerified(true);
        setGmailEmail(data.data?.gmailEmail);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setGmailTestResult({
          success: false,
          message: errorData.message || "Verification failed",
        });
      }
    } catch (err: any) {
      setGmailTestResult({
        success: false,
        message: `Verification failed: ${err.message || "Unknown error"}`,
      });
    } finally {
      setGmailTesting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect your Gmail account?")) return;

    try {
      setGmailLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/gmail/disconnect`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setGmailConnected(false);
        setGmailEmail(null);
        setGmailVerified(false);
      }
    } catch (err) {
      console.error("Failed to disconnect Gmail:", err);
    } finally {
      setGmailLoading(false);
    }
  };



  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowNewKey(data.data.key);
        setNewKeyName("");
        await fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys/${keyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  return (
    <DashboardShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f4fa]">Settings</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">Manage API keys and integrations</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveTab("api");
              router.replace("/settings?tab=api");
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "api"
              ? "bg-[#14b8a6]/15 text-[#14b8a6]"
              : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
              }`}
          >
            API Keys
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab("google");
                  router.replace("/settings?tab=google");
                  fetchGoogleConfig();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "google"
                  ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                  : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
                  }`}
              >
                Google Config
              </button>
            </>
          )}
          <button
            onClick={() => {
              setActiveTab("integrations");
              router.replace("/settings?tab=integrations");
              fetchTenantGoogleConfig();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "integrations"
              ? "bg-[#14b8a6]/15 text-[#14b8a6]"
              : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
              }`}
          >
            Integrations
          </button>
          <button
            onClick={() => {
              setActiveTab("calendar");
              router.replace("/settings?tab=calendar");
              checkCalendarConnection();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "calendar"
              ? "bg-[#14b8a6]/15 text-[#14b8a6]"
              : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
              }`}
          >
            Calendar
          </button>
          <button
            onClick={() => {
              setActiveTab("gmail");
              router.replace("/settings?tab=gmail");
              checkGmailConnection();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "gmail"
              ? "bg-[#14b8a6]/15 text-[#14b8a6]"
              : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
              }`}
          >
            Gmail
          </button>
          <button
            onClick={() => {
              setActiveTab("twilio");
              router.replace("/settings?tab=twilio");
              fetchTwilioConfig();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "twilio"
              ? "bg-[#14b8a6]/15 text-[#14b8a6]"
              : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
              }`}
          >
            Twilio
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab("system-email");
                  router.replace("/settings?tab=system-email");
                  fetchSystemEmailConfig();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "system-email"
                  ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                  : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
                  }`}
              >
                System Email
              </button>
              <button
                onClick={() => {
                  setActiveTab("affiliates");
                  router.replace("/settings?tab=affiliates");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "affiliates"
                  ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                  : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
                  }`}
              >
                Affiliates
              </button>
              <button
                onClick={() => {
                  setActiveTab("referrals");
                  router.replace("/settings?tab=referrals");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "referrals"
                  ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                  : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
                  }`}
              >
                Referrals
              </button>
              <button
                onClick={() => {
                  setActiveTab("stripe-connect");
                  router.replace("/settings?tab=stripe-connect");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === "stripe-connect"
                  ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                  : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
                  }`}
              >
                Stripe Connect
              </button>
            </>
          )}
        </div>

        {/* New key banner */}
        {showNewKey && (
          <div className="mb-6 rounded-xl border border-[#14b8a6]/30 bg-[#14b8a6]/10 p-5">
            <p className="mb-3 text-sm text-[#f0f4fa]">Your new API key — copy it now, you won't see it again:</p>
            <div className="mb-4 rounded-lg border border-white/[0.08] bg-[#05080f] p-4 font-mono text-sm break-all text-[#14b8a6]">
              {showNewKey}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(showNewKey); }}
                className="btn-primary text-sm"
              >
                Copy to Clipboard
              </button>
              <button onClick={() => setShowNewKey(null)} className="btn-secondary text-sm">Done</button>
            </div>
          </div>
        )}

        {/* API Keys Section */}
        {activeTab === "api" && (
          <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">API Keys</h2>

            <form onSubmit={handleCreateKey} className="mb-5 flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production API)"
                className="flex-1 rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
              />
              <button
                type="submit"
                disabled={loading || !newKeyName}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create Key"}
              </button>
            </form>

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-[rgba(240,244,250,0.4)]">No API keys yet.</p>
              ) : apiKeys.map((key: any) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#05080f] px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#f0f4fa]">{key.name}</p>
                    <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.35)]">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1.5 text-xs text-[#f97316] transition hover:bg-[#f97316]/25"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stripe Connect Section */}
        {activeTab === "stripe-connect" && isAdmin && (
          <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Stripe Connect Configuration</h2>
            <p className="mb-5 text-sm text-[rgba(240,244,250,0.45)]">
              Configure Stripe Connect to automate agent payouts securely.
            </p>

            <form onSubmit={saveStripeConnectConfig} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Client ID</label>
                <input
                  type="text"
                  value={stripeConnectConfig.clientId}
                  onChange={(e) => setStripeConnectConfig({ ...stripeConnectConfig, clientId: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="ca_1234567890abcdef"
                />
                <p className="mt-1.5 text-[11px] text-[rgba(240,244,250,0.4)]">
                  Found in your Stripe Dashboard under Settings {'->'} Connect settings.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Minimum Payout Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stripeConnectConfig.minimumPayout}
                  onChange={(e) => setStripeConnectConfig({ ...stripeConnectConfig, minimumPayout: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="100"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[rgba(240,244,250,0.65)] mt-6">
                <input
                  type="checkbox"
                  checked={stripeConnectConfig.enabled}
                  onChange={(e) => setStripeConnectConfig({ ...stripeConnectConfig, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-white/[0.2] bg-[#05080f]"
                />
                Enable Stripe Connect Onboarding
              </label>

              {stripeConnectMessage && (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${stripeConnectMessage.type === "success"
                    ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                    : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                    }`}
                >
                  {stripeConnectMessage.type === "success" ? "✓ " : "⚠️ "}{stripeConnectMessage.text}
                </div>
              )}

              {stripeConnectTestResult && (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${stripeConnectTestResult.success
                    ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                    : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                    }`}
                >
                  <p className="font-semibold">{stripeConnectTestResult.success ? "✓ Connected successfully!" : "⚠️ Connection failed"}</p>
                  <p className="mt-1 opacity-80">{stripeConnectTestResult.message}</p>
                  {stripeConnectTestResult.data && (
                    <div className="mt-2 text-xs opacity-75 font-mono">
                      Connected to: {stripeConnectTestResult.data.name} ({stripeConnectTestResult.data.email})
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={stripeConnectSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {stripeConnectSaving ? "Saving…" : "Save Configuration"}
                </button>
                <button
                  type="button"
                  onClick={testStripeConnectConnection}
                  disabled={stripeConnectTesting}
                  className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-5 py-2 text-sm font-medium text-[#f0f4fa] hover:bg-white/[0.1] disabled:opacity-50 transition"
                >
                  {stripeConnectTesting ? "Testing..." : "Test Connection"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Google Config Section */}
        {activeTab === "google" && isAdmin && (
          <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Google Auth Configuration</h2>
            <p className="mb-5 text-sm text-[rgba(240,244,250,0.45)]">
              Configure Google OAuth for sign-in only. These values are used by the auth service.
            </p>

            <form onSubmit={saveGoogleConfig} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Client ID</label>
                <input
                  type="text"
                  value={googleConfig.clientId}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, clientId: e.target.value });
                    setGoogleSaveSuccess(false);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="GOOGLE_CLIENT_ID"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Client Secret</label>
                <PasswordInput
                  value={googleConfig.clientSecret}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, clientSecret: e.target.value });
                    setGoogleSaveSuccess(false);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="GOOGLE_CLIENT_SECRET"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Redirect URI</label>
                <input
                  type="text"
                  value={googleConfig.redirectUri}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, redirectUri: e.target.value });
                    setGoogleSaveSuccess(false);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="https://app.yourdomain.com/auth/google/callback"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[rgba(240,244,250,0.65)]">
                <input
                  type="checkbox"
                  checked={googleConfig.enabled}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, enabled: e.target.checked });
                    setGoogleSaveSuccess(false);
                  }}
                  className="h-4 w-4 rounded border-white/[0.2] bg-[#05080f]"
                />
                Enable Google Auth
              </label>

              {googleSaveSuccess && (
                <div className="rounded-lg border border-[#14b8a6]/30 bg-[#14b8a6]/10 px-4 py-3 text-sm text-[#14b8a6]">
                  ✓ Configuration saved successfully!
                </div>
              )}

              {googleTestResult && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${googleTestResult.success
                    ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                    : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                    }`}
                >
                  {googleTestResult.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={googleSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {googleSaving ? "Saving…" : "Save Configuration"}
                </button>
                <button
                  type="button"
                  onClick={testGoogleConnection}
                  disabled={googleTesting}
                  className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 py-2 text-sm text-[rgba(240,244,250,0.75)] transition hover:border-white/[0.25] hover:bg-white/[0.05] disabled:opacity-50"
                >
                  {googleTesting ? "Testing…" : "Test Connection"}
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-6 rounded-lg border border-white/[0.06] bg-[#05080f]/50 p-4">
                <h4 className="mb-3 text-xs font-semibold text-[#f0f4fa]">How to get your Google OAuth credentials:</h4>
                <ol className="space-y-3 text-xs text-[rgba(240,244,250,0.55)]">
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">1.</span>
                    <span>
                      Go to{" "}
                      <a
                        href="https://console.cloud.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#14b8a6] hover:underline"
                      >
                        Google Cloud Console
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">2.</span>
                    <span>Create a new project or select an existing one</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">3.</span>
                    <span>
                      Enable the{" "}
                      <a
                        href="https://console.cloud.google.com/apis/library/gmail.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#14b8a6] hover:underline"
                      >
                        Gmail API
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#14b8a6] hover:underline"
                      >
                        Google Calendar API
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">4.</span>
                    <span>
                      Go to "Credentials" and click{" "}
                      <span className="text-[#14b8a6]">Create Credentials → OAuth 2.0 Client ID</span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">5.</span>
                    <span>
                      Choose "Web application" as the application type
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">6.</span>
                    <span>
                      Add Authorized redirect URIs:
                      <div className="mt-1 space-y-1 ml-3">
                        <div className="font-mono text-[#14b8a6]">http://localhost:3000/auth/google/callback</div>
                        <div className="font-mono text-[#14b8a6]">https://yourdomain.com/auth/google/callback</div>
                      </div>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">7.</span>
                    <span>
                      Click "Create" and copy the Client ID and Client Secret to the fields above
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">8.</span>
                    <span>
                      Go to{" "}
                      <a
                        href="https://console.cloud.google.com/auth/audience"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#14b8a6] hover:underline"
                      >
                        OAuth consent screen
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">9.</span>
                    <span>Scroll to <strong>Test users</strong> section</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">10.</span>
                    <span>Click <strong>+ ADD USERS</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">11.</span>
                    <span>Enter your Gmail address (e.g., onbrandcopywriter@gmail.com)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#14b8a6] font-semibold">12.</span>
                    <span>Click <strong>Save</strong></span>
                  </li>
                </ol>
              </div>
            </form>
          </div>
        )}


        {/* Widget embed */}
        {activeTab === "calendar" && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Calendar Connection</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Connect your Google Calendar to allow Voice Automation to check availability and book appointments automatically.
            </p>

            <div className="rounded-xl border border-white/[0.07] bg-[#05080f] p-5">
              {calendarConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#14b8a6]" />
                    <span className="text-sm text-[rgba(240,244,250,0.75)]">Calendar is connected</span>
                  </div>
                  <button
                    onClick={handleDisconnectCalendar}
                    disabled={calendarLoading}
                    className="w-full rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-2.5 text-sm font-medium text-[#ef4444] transition hover:border-[#ef4444]/50 hover:bg-[#ef4444]/15 disabled:opacity-50"
                  >
                    {calendarLoading ? "Disconnecting…" : "Disconnect Calendar"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[rgba(240,244,250,0.55)]">
                    No calendar connected yet. Click the button below to authorize access to your Google Calendar.
                  </p>
                  <button
                    onClick={handleConnectCalendar}
                    disabled={calendarLoading}
                    className="w-full btn-primary text-sm disabled:opacity-50"
                  >
                    {calendarLoading ? "Connecting…" : "Connect Google Calendar"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#05080f] p-4">
              <p className="text-xs font-medium text-[rgba(240,244,250,0.55)] mb-2">What this enables:</p>
              <ul className="space-y-2 text-xs text-[rgba(240,244,250,0.45)]">
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Voice AI checks your calendar availability before booking appointments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Automatically adds confirmed appointments to your calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Prevents double-booking by checking real-time availability</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Gmail Connection */}
        {activeTab === "gmail" && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Gmail Account</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Connect your Gmail account to enable voice automation to send emails and manage your inbox.
            </p>

            {/* Gmail Connection Section */}
            <div className="rounded-xl border border-white/[0.07] bg-[#05080f] p-5 mb-6">
              <h3 className="mb-4 text-xs font-semibold text-[#f0f4fa]">Gmail Account</h3>
              <p className="mb-4 text-xs text-[rgba(240,244,250,0.45)]">
                Connect your personal Gmail account to send emails from the platform.
              </p>

              {gmailConnected && gmailEmail ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-3 w-3 rounded-full bg-[#14b8a6]" />
                      <span className="text-sm font-medium text-[#14b8a6]">Gmail Connected</span>
                    </div>
                    <p className="text-xs text-[rgba(240,244,250,0.65)] ml-6">{gmailEmail}</p>
                  </div>

                  <button
                    onClick={handleDisconnectGmail}
                    disabled={gmailLoading}
                    className="w-full rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-2.5 text-sm font-medium text-[#ef4444] transition hover:border-[#ef4444]/50 hover:bg-[#ef4444]/15 disabled:opacity-50"
                  >
                    {gmailLoading ? "Disconnecting…" : "Disconnect Gmail"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[rgba(240,244,250,0.55)]">
                    No Gmail account connected. You'll be able to send emails from your Gmail address once connected.
                  </p>
                  <button
                    onClick={handleConnectGmail}
                    disabled={gmailLoading}
                    className="w-full btn-primary text-sm disabled:opacity-50"
                  >
                    {gmailLoading ? "Connecting…" : "Connect Gmail Account"}
                  </button>
                </div>
              )}
            </div>



            <div className="rounded-xl border border-white/[0.07] bg-[#05080f] p-4">
              <p className="text-xs font-medium text-[rgba(240,244,250,0.55)] mb-2">What this enables:</p>
              <ul className="space-y-2 text-xs text-[rgba(240,244,250,0.45)]">
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Voice AI can send emails on your behalf</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Automatic email responses and follow-ups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Read and process incoming emails for automation</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Integrations Section */}
        {activeTab === "integrations" && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Google Cloud & Gemini Integration</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Configure your own Google Cloud Project credentials and Gemini API Key (Bring Your Own Key).
              This allows you to control quotas and use your custom branding for authentication screens.
            </p>

            <form onSubmit={saveTenantGoogleConfig} className="space-y-4">
              <div className="rounded-xl border border-white/[0.07] bg-[#05080f] p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-[#f0f4fa]">Custom Credentials</h3>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${tenantGoogleConfig.hasConfig ? "bg-[#14b8a6]" : "bg-[#64748b]"}`} />
                    <span className="text-xs text-[rgba(240,244,250,0.55)]">
                      {tenantGoogleConfig.hasConfig ? "Active" : "Using Platform Defaults"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Google Client ID</label>
                    <input
                      type="text"
                      value={tenantGoogleConfig.clientId}
                      onChange={(e) => setTenantGoogleConfig({ ...tenantGoogleConfig, clientId: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="Your Google Cloud Client ID"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Google Client Secret</label>
                    <PasswordInput
                      value={tenantGoogleConfig.clientSecret}
                      onChange={(e) => setTenantGoogleConfig({ ...tenantGoogleConfig, clientSecret: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder={tenantGoogleConfig.hasConfig && !tenantGoogleConfig.clientSecret ? "********" : "Your Google Cloud Client Secret"}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Gemini API Key</label>
                    <PasswordInput
                      value={tenantGoogleConfig.geminiApiKey}
                      onChange={(e) => setTenantGoogleConfig({ ...tenantGoogleConfig, geminiApiKey: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder={tenantGoogleConfig.hasConfig && !tenantGoogleConfig.geminiApiKey ? "********" : "Your Gemini API Key (AI Studio)"}
                    />
                    <p className="mt-1 text-xs text-[rgba(240,244,250,0.35)]">
                      Required for the Voice Agent. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] hover:underline">Google AI Studio</a>.
                    </p>
                  </div>
                </div>
              </div>

              {tenantConfigMessage && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${tenantConfigMessage.type === 'success'
                  ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                  : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                  }`}>
                  {tenantConfigMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={tenantConfigSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {tenantConfigSaving ? "Saving..." : "Save Configuration"}
                </button>
                {tenantGoogleConfig.hasConfig && (
                  <button
                    type="button"
                    onClick={deleteTenantGoogleConfig}
                    className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-2 text-sm font-medium text-[#ef4444] transition hover:border-[#ef4444]/50 hover:bg-[#ef4444]/15"
                  >
                    Revert to Default
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 rounded-lg border border-white/[0.06] bg-[#05080f]/50 p-4">
                <h4 className="mb-3 text-xs font-semibold text-[#f0f4fa]">Setup Instructions:</h4>
                <ol className="space-y-3 text-xs text-[rgba(240,244,250,0.55)]">
                  <li className="flex gap-2">
                    <span className="text-[#14b8a6]">1.</span>
                    <span>
                      Create a project in the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] hover:underline">Google Cloud Console</a>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#14b8a6]">2.</span>
                    <span>
                      Create OAuth credentials (Client ID & Secret) and add the following redirect URIs:
                    </span>
                  </li>
                  <li className="ml-5 font-mono text-[#14b8a6]">
                    https://[your-domain]/auth/google/gmail/callback
                  </li>
                  <li className="ml-5 font-mono text-[#14b8a6]">
                    https://[your-domain]/auth/google/calendar/callback
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#14b8a6]">3.</span>
                    <span>
                      Get your Gemini API Key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] hover:underline">Google AI Studio</a>.
                    </span>
                  </li>
                </ol>
              </div>
            </form>
          </div>
        )}

        {/* Twilio Section */}
        {activeTab === "twilio" && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Twilio Configuration</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Configure your Twilio credentials to enable SMS and phone call capabilities.
            </p>

            <form onSubmit={saveTwilioConfig} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Account SID</label>
                <input
                  type="text"
                  value={twilioConfig.accountSid}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="AC..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Auth Token</label>
                <PasswordInput
                  value={twilioConfig.authToken}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="Your Twilio Auth Token"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Phone Number</label>
                <input
                  type="text"
                  value={twilioConfig.phoneNumber}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="+1234567890"
                />
              </div>

              {twilioMessage && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${twilioMessage.type === 'success'
                  ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                  : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                  }`}>
                  {twilioMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={twilioSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {twilioSaving ? "Saving..." : "Save Configuration"}
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-6 rounded-lg border border-white/[0.06] bg-[#05080f]/50 p-4">
                <h4 className="mb-3 text-xs font-semibold text-[#f0f4fa]">Setup Instructions:</h4>
                <ol className="space-y-3 text-xs text-[rgba(240,244,250,0.55)]">
                  <li className="flex gap-2">
                    <span className="text-[#14b8a6]">1.</span>
                    <span>
                      Log in to the <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] hover:underline">Twilio Console</a>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#14b8a6]">2.</span>
                    <span>
                      Copy your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard (under "Account Info").
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#14b8a6]">3.</span>
                    <span>
                      Go to <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/active" target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] hover:underline">Phone Numbers &gt; Manage &gt; Active numbers</a> to get your phone number.
                    </span>
                  </li>
                </ol>
              </div>
            </form>
          </div>
        )}

        {/* Widget embed */}
        {activeTab === "api" && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-3 text-sm font-semibold text-[#f0f4fa]">Embedded Widget</h2>
            <p className="mb-4 text-sm text-[rgba(240,244,250,0.45)]">Add this script tag to any website to embed the MyOrbisVoice widget:</p>
            <div className="overflow-auto rounded-xl border border-white/[0.07] bg-[#05080f] p-4 font-mono text-sm text-[#14b8a6]">
              {`<script src="https://app.myorbisvoice.com/widget.js"`}<br />
              {`  data-agent-id="YOUR_AGENT_ID"`}<br />
              {`  data-api-key="YOUR_API_KEY"></script>`}
            </div>
            <p className="mt-3 text-xs text-[rgba(240,244,250,0.35)]">
              Replace YOUR_AGENT_ID and YOUR_API_KEY with your values. Add <code className="text-[#14b8a6]">data-position="bottom-left"</code> to change widget position.
            </p>
          </div>
        )}

        {/* System Email Section */}
        {activeTab === "system-email" && isAdmin && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">System Email Configuration</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Configure the global email settings used to send transactional emails for the SaaS.
            </p>

            <form onSubmit={saveSystemEmailConfig} className="space-y-6">
              {/* Account Information */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-[rgba(240,244,250,0.8)] border-b border-white/[0.07] pb-2">Account information</h3>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Username</label>
                    <input
                      type="text"
                      value={systemEmailConfig.username}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, username: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="talk@myorbisvoice.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Password</label>
                    <PasswordInput
                      value={systemEmailConfig.password}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, password: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="use your password for this email account"
                    />
                  </div>
                </div>
              </div>

              {/* IMAP */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-[rgba(240,244,250,0.8)] border-b border-white/[0.07] pb-2">IMAP (Incoming)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Incoming server name</label>
                    <input
                      type="text"
                      value={systemEmailConfig.imapServer}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, imapServer: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="mail.spacemail.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Incoming port</label>
                    <input
                      type="text"
                      value={systemEmailConfig.imapPort}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, imapPort: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="993"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Type of Security</label>
                    <select
                      value={systemEmailConfig.imapSecurity}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, imapSecurity: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                    >
                      <option value="SSL">SSL</option>
                      <option value="TLS">TLS</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SMTP */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-[rgba(240,244,250,0.8)] border-b border-white/[0.07] pb-2">SMTP (Outgoing)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Outgoing server name</label>
                    <input
                      type="text"
                      value={systemEmailConfig.smtpServer}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, smtpServer: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="mail.spacemail.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Outgoing port</label>
                    <input
                      type="text"
                      value={systemEmailConfig.smtpPort}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, smtpPort: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="465 or 587"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Type of Security</label>
                    <select
                      value={systemEmailConfig.smtpSecurity}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, smtpSecurity: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                    >
                      <option value="SSL">SSL</option>
                      <option value="TLS">TLS</option>
                      <option value="STARTTLS">STARTTLS</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* POP3 */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-[rgba(240,244,250,0.8)] border-b border-white/[0.07] pb-2">POP3 (Alternative Incoming)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Incoming server name</label>
                    <input
                      type="text"
                      value={systemEmailConfig.pop3Server}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, pop3Server: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="mail.spacemail.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Incoming port</label>
                    <input
                      type="text"
                      value={systemEmailConfig.pop3Port}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, pop3Port: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      placeholder="995"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Type of Security</label>
                    <select
                      value={systemEmailConfig.pop3Security}
                      onChange={(e) => setSystemEmailConfig({ ...systemEmailConfig, pop3Security: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                    >
                      <option value="SSL">SSL</option>
                      <option value="TLS">TLS</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {systemEmailMessage && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${systemEmailMessage.type === 'success'
                  ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                  : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                  }`}>
                  {systemEmailMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={systemEmailSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {systemEmailSaving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-white/[0.07] pt-6">
              <h3 className="mb-3 text-xs font-semibold text-[#f0f4fa]">Test Configuration</h3>
              <p className="mb-4 text-xs text-[rgba(240,244,250,0.55)]">
                Send a test email to verify your SMTP settings are correct. Ensure you save your configuration first.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <input
                  type="email"
                  value={systemTestEmailTarget}
                  onChange={(e) => setSystemTestEmailTarget(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full sm:w-64 rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                />
                <button
                  type="button"
                  onClick={() => testSystemEmailConfig(false)}
                  disabled={systemEmailTesting || !systemTestEmailTarget}
                  className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 py-2 text-sm text-[rgba(240,244,250,0.75)] transition hover:border-white/[0.25] hover:bg-white/[0.05] disabled:opacity-50 shrink-0"
                >
                  {systemEmailTesting ? "Sending..." : "Send Test Email"}
                </button>
                {process.env.NODE_ENV !== "production" && (
                  <button
                    type="button"
                    onClick={() => testSystemEmailConfig(true)}
                    disabled={systemEmailTesting || !systemTestEmailTarget}
                    className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-2 text-sm text-[#f59e0b] transition hover:border-[#f59e0b]/50 hover:bg-[#f59e0b]/20 disabled:opacity-50 shrink-0"
                    title="Force Ethereal Email test in development mode"
                  >
                    Development Testing
                  </button>
                )}
              </div>

              {systemEmailTestResult && (
                <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${systemEmailTestResult.success
                  ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                  : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                  }`}>
                  {systemEmailTestResult.message}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Affiliates Section (Blank for now) */}
        {activeTab === "affiliates" && isAdmin && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Affiliates Settings</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Settings for the affiliate program will be available here.
            </p>
          </div>
        )}

        {/* Referrals Section (Blank for now) */}
        {activeTab === "referrals" && isAdmin && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Referrals Settings</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Settings for the referrals program will be available here.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
