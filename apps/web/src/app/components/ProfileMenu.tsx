"use client";

import { useState, useEffect } from "react";

import PasswordInput from "./PasswordInput";
import { API_BASE } from "@/lib/api";

interface ProfileMenuProps {
  onClose?: () => void;
}

export default function ProfileMenu({ onClose }: ProfileMenuProps) {
  const [profile, setProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(!!onClose); // If onClose provided, start open (controlled)
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
        setProfileForm({ name: data.data.name, email: data.data.email });
        // Use uploaded avatar if available, otherwise generate one
        if (data.data.avatar) {
          setAvatar(data.data.avatar);
        } else {
          generateAvatar(data.data.name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const generateAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const colors = ["#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#ec4899"];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='${bgColor.replace("#", "%23")}' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='white' text-anchor='middle' dy='.3em' font-family='system-ui'%3E${initials}%3C/text%3E%3C/svg%3E`;
    setAvatar(svg);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileMessage({ type: "success", text: "Profile updated successfully" });
        fetchProfile();
      } else {
        setProfileMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (err) {
      setProfileMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Password updated successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMessage({ type: "error", text: data.message || "Failed to update password" });
      }
    } catch (err) {
      setPasswordMessage({ type: "error", text: "Failed to update password" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: "error", text: "File size exceeds 5MB limit" });
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setAvatarMessage({ type: "error", text: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" });
      return;
    }

    setAvatarUploading(true);
    setAvatarMessage(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/users/me/avatar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ avatarData: base64Data }),
          });

          const data = await res.json();
          if (res.ok) {
            setAvatarMessage({ type: "success", text: "Avatar updated successfully" });
            fetchProfile();
            // Reset file input
            e.target.value = "";
          } else {
            setAvatarMessage({ type: "error", text: data.message || "Failed to upload avatar" });
          }
        } catch (err) {
          setAvatarMessage({ type: "error", text: "Failed to upload avatar" });
        } finally {
          setAvatarUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setAvatarMessage({ type: "error", text: "Failed to process avatar" });
      setAvatarUploading(false);
    }
  };

  return (
    <>
      {/* Profile Button with Avatar - Only show if not controlled by parent */}
      {!onClose && (
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[rgba(240,244,250,0.4)] hover:text-[rgba(240,244,250,0.7)] transition w-full"
        >
          {avatar && <img src={avatar} alt="Profile" className="w-7 h-7 rounded-full" />}
          <span>Profile</span>
        </button>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#f0f4fa]">Profile Settings</h2>
                <p className="mt-1 text-sm text-[rgba(240,244,250,0.45)]">Manage your account information</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  onClose?.();
                }}
                className="text-[rgba(240,244,250,0.4)] hover:text-[#f0f4fa]"
              >
                ✕
              </button>
            </div>

            {/* Avatar Display */}
            <div className="mt-6 flex flex-col items-center gap-4">
              {avatar && <img src={avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover" />}

              <div className="w-full max-w-xs">
                {avatarMessage && (
                  <div
                    className={`mb-3 rounded-lg p-3 text-sm ${avatarMessage.type === "success"
                      ? "border border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                      : "border border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316]"
                      }`}
                  >
                    {avatarMessage.text}
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[rgba(240,244,250,0.7)] hover:border-[#14b8a6]/30 hover:bg-[#14b8a6]/5 transition">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="hidden"
                  />
                  {avatarUploading ? "Uploading…" : "Upload Photo"}
                </label>
              </div>
            </div>

            {/* Profile Section */}
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Personal Information</h3>

                {profileMessage && (
                  <div
                    className={`mb-4 rounded-lg p-3 text-sm ${profileMessage.type === "success"
                      ? "border border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                      : "border border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316]"
                      }`}
                  >
                    {profileMessage.text}
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm text-[rgba(240,244,250,0.7)]">Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-[rgba(240,244,250,0.7)]">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {profileSaving ? "Saving…" : "Save Profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Section */}
              <div className="border-t border-white/[0.07] pt-6">
                <h3 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Change Password</h3>

                {passwordMessage && (
                  <div
                    className={`mb-4 rounded-lg p-3 text-sm ${passwordMessage.type === "success"
                      ? "border border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                      : "border border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316]"
                      }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm text-[rgba(240,244,250,0.7)]">Current Password</label>
                    <PasswordInput
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-[rgba(240,244,250,0.7)]">New Password</label>
                    <PasswordInput
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-xs text-[rgba(240,244,250,0.35)]">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-[rgba(240,244,250,0.7)]">Confirm New Password</label>
                    <PasswordInput
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {passwordSaving ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}