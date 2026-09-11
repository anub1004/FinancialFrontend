import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import SettingsNav from "./SettingsNav";
import toast from "react-hot-toast";
import { User, Mail, Globe } from "lucide-react";
import { ApiConfig } from "../../config/apiconfig";

export default function MyAccount() {
  const { authState } = useAuth();
  const { subscription } = useSubscription();
  const id = authState.userId;
  const [displayName, setDisplayName] = useState(authState.user || "User");
  const [email, setEmail] = useState(authState.email || "");
  const [currency, setCurrency] = useState(() => localStorage.getItem("setting_currency") || "INR");
  const [defaultFY, setDefaultFY] = useState(() => localStorage.getItem("setting_defaultFY") || "2025-26");
  const [preferredRegime, setPreferredRegime] = useState(() => localStorage.getItem("setting_taxRegime") || "New");
  const [avatarColor, setAvatarColor] = useState(() => localStorage.getItem("setting_avatarColor") || "#6366f1");
  const [isSaving, setIsSaving] = useState(false);

  const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#0ea5e9", "#64748b"];

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${ApiConfig.Api_Base_Url}api/User/settings/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch settings (Status: ${response.status})`);
          return;
        }

        const data = await response.json();
        if (data) {
          console.log("Fetched user settings:", data);
          setCurrency(data.currency || "INR");
          setDefaultFY(data.defaultFy || data.defaultFY || "2025-26");
          setPreferredRegime(data.preferredRegime || "New");
          setAvatarColor(data.avatarColor || "#6366f1");
          setDisplayName(data.name || authState.user || "User");
          setEmail(data.email || authState.Email || "");
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    fetchSettings();
  }, [id, authState.user, authState.Email]);

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!id) {
      toast.error("User session not ready. Please refresh or log in.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("token");
    const userData = {
      email: email,
      name: displayName,
      currency: currency,
      defaultFy: defaultFY,
      preferredRegime: preferredRegime,
      avatarColor: avatarColor,
    };

    try {
      const response = await fetch(`${ApiConfig.Api_Base_Url}api/User/update/settings/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Account settings updated successfully!");
      } else {
        toast.error("Failed to update account settings. Please try again.");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("An error occurred while updating settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Account Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal profile, financial reporting preferences, and contact information.
        </p>
      </div>

      {/* Shared Settings Tabs Navigation */}
      <SettingsNav />

      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-md shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: avatarColor }}
              >
                {(displayName || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                    {authState.role || "User"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {email}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Plan: <span className="font-semibold text-gray-700 dark:text-gray-300">{subscription.planName || "Free Plan"}</span>
                </p>
              </div>
            </div>

            {/* Avatar Theme Selector */}
            <div className="flex flex-col sm:items-end">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Avatar Color</span>
              <div className="flex items-center gap-1.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
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

        {/* Profile Information Controls */}
        <div className="space-y-6">
          {/* Personal Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-500" /> Personal Details
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Your name and contact details used for notifications and reporting headers.
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
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Email is bound to your login credentials.</span>
              </div>
            </div>
          </div>

          {/* Financial & Regional Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-500" /> Financial & Regional Defaults
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Default currency, tax regime, and reporting fiscal year for your dashboards and calculators.
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

          {/* Form Save Button */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "Save Account Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}