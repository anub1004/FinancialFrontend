import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminNavbar from "./AdminNavbar";
import toast from "react-hot-toast";
import { User, Mail, Shield, Globe, Lock, CheckCircle2 } from "lucide-react";
import { ApiConfig } from "../../config/apiconfig";

/**
 * AdminAccount
 * Route: /admin/account (and /admin/settings)
 *
 * Full-featured Account Settings for Administrators:
 * - Admin profile with customizable avatar and role badge
 * - Personal details (display name & email)
 * - Financial & regional defaults (currency, fiscal year, tax regime)
 * - Read-only elevated admin privileges matrix
 * - Security notice with link to reset password
 * - Full parity with user Account Settings (myaccount.tsx) + admin enhancements
 */

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899",
  "#f43f5e", "#f59e0b", "#10b981",
  "#0ea5e9", "#64748b",
];

export default function AdminAccount() {
  const { authState } = useAuth();
  const id = authState.userId;

  // Form states matching user Account Settings
  const [displayName, setDisplayName] = useState(authState.user || "Admin");
  const [email, setEmail] = useState(authState.email || "");
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("setting_currency") || "INR"
  );
  const [defaultFY, setDefaultFY] = useState(
    () => localStorage.getItem("setting_defaultFY") || "2025-26"
  );
  const [preferredRegime, setPreferredRegime] = useState(
    () => localStorage.getItem("setting_taxRegime") || "New"
  );
  const [avatarColor, setAvatarColor] = useState(
    () => localStorage.getItem("setting_avatarColor") || "#6366f1"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current admin settings on mount
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${ApiConfig.Api_Base_Url}api/User/settings/${id}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.warn(`Settings fetch failed: ${response.status}`);
          return;
        }

        const data = await response.json();
        if (data) {
          setDisplayName(data.name || authState.user || "Admin");
          setEmail(data.email || authState.email || "");
          setCurrency(data.currency || "INR");
          setDefaultFY(data.defaultFy || data.defaultFY || "2025-26");
          setPreferredRegime(data.preferredRegime || "New");
          setAvatarColor(data.avatarColor || "#6366f1");
        }
      } catch (err) {
        console.error("Error fetching admin settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [id, authState.user, authState.email]);

  // Save admin settings
  const handleSave = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();

    if (!id) {
      toast.error("Admin session not ready. Please refresh or log in.");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("token");

    const updatePayload = {
      email,
      name: displayName.trim(),
      currency,
      defaultFy: defaultFY,
      preferredRegime,
      avatarColor,
    };

    try {
      const response = await fetch(
        `${ApiConfig.Api_Base_Url}api/User/update/settings/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (response.ok) {
        // Persist preferences locally for instant cross-component rendering
        localStorage.setItem("setting_avatarColor", avatarColor);
        localStorage.setItem("setting_currency", currency);
        localStorage.setItem("setting_defaultFY", defaultFY);
        localStorage.setItem("setting_taxRegime", preferredRegime);
        toast.success("Admin account settings updated successfully!");
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.message || "Failed to update settings. Please try again.");
      }
    } catch (error) {
      console.error("Error saving admin settings:", error);
      toast.error("An error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <AdminNavbar />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-44 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Admin Account Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your administrator profile, financial defaults, and platform permissions.
        </p>
      </div>

      {/* Admin Navigation Bar */}
      <AdminNavbar />

      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-md shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: avatarColor }}
              >
                {(displayName || "A")[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {displayName}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {authState.role || "Admin"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {email || "admin@system.local"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Full platform access &bull; All administrative panels unlocked
                </p>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div className="flex flex-col sm:items-end">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Avatar Color
              </span>
              <div className="flex items-center gap-1.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    title={c}
                    className={`w-6 h-6 rounded-full transition-all ${
                      avatarColor === c
                        ? "ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-gray-800 scale-110"
                        : "hover:scale-105 opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-500" /> Personal Details
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Your name appears across system audit logs and administrator actions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your admin display name"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Email is bound to your login credentials.
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Regional Defaults Card (matching AccountSetting) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-500" /> Financial & Regional Defaults
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Default currency, tax regime, and reporting fiscal year for your dashboards, calculators, and system analytics.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Default Financial Year
              </label>
              <select
                value={defaultFY}
                onChange={(e) => setDefaultFY(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
              >
                <option value="2025-26">FY 2025-26 (Current)</option>
                <option value="2024-25">FY 2024-25</option>
                <option value="2023-24">FY 2023-24</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Preferred Tax Regime
              </label>
              <select
                value={preferredRegime}
                onChange={(e) => setPreferredRegime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
              >
                <option value="New">New Regime (Standard 115BAC)</option>
                <option value="Old">Old Regime (With Exemptions)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Elevated Admin Privileges Matrix */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" /> Admin Privileges & System Scope
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Your account possesses elevated administrative capabilities. These permissions apply system-wide.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "User Management", desc: "View, edit, search, ban, and delete any user account" },
              { label: "Plan Management", desc: "Create, price, and modify tiered subscription plans" },
              { label: "Feature Flags", desc: "Configure global features and subscription plan gating" },
              { label: "Subscription Control", desc: "Monitor customer billing, status, and manual overrides" },
              { label: "Audit & CSV Export", desc: "Download full user, security, and transaction audit trails" },
              { label: "Role Management", desc: "Assign administrator status and control platform access" },
            ].map((priv) => (
              <div
                key={priv.label}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700"
              >
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{priv.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{priv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice Card */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700/50 shadow-sm p-5 flex items-start gap-4">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Security Notice
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              To update your administrator password or multi-factor authentication, use the{" "}
              <a
                href="/reset-password"
                className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
              >
                Reset Password
              </a>{" "}
              management panel. All administrator credential events are recorded in the security audit trail.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Saving...
              </>
            ) : (
              "Save Admin Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
