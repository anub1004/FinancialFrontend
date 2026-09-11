import { useState } from "react";
import SettingsNav from "./SettingsNav";
import toast from "react-hot-toast";
import {
  Bell, CheckCircle2, Shield, DollarSign, Wallet,
  Calendar, Smartphone, Mail, AlertTriangle, Save, RefreshCw
} from "lucide-react";

export default function Notifications() {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem("setting_notifications");
    return saved
      ? JSON.parse(saved)
      : {
          txAlerts: true,
          largeTxAlerts: true,
          budgetThresholds: true,
          goalMilestones: true,
          billReminders: true,
          securityAlerts: true,
          weeklySummary: false,
          monthlyReport: true,
          emailChannel: true,
          inAppChannel: true,
          pushChannel: false,
          frequency: "instant",
        };
  });

  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setPrefs((prev: Record<string, unknown>) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("setting_notifications", JSON.stringify(prefs));
      setSaving(false);
      toast.success("Notification preferences saved successfully!");
    }, 500);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Notification Preferences
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize which activity alerts, budget reminders, and security notices you receive.
        </p>
      </div>

      {/* Shared Settings Tabs Navigation */}
      <SettingsNav />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Delivery Channels Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-500" /> Delivery Channels
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Choose where notifications should be routed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: "emailChannel", title: "Email Notifications", desc: "Sent to your primary email address", icon: Mail },
              { key: "inAppChannel", title: "In-App Alerts", desc: "Real-time badge & toast notifications", icon: Bell },
              { key: "pushChannel", title: "Browser Push Alerts", desc: "Native operating system notifications", icon: Smartphone },
            ].map(channel => {
              const Icon = channel.icon;
              const isChecked = Boolean(prefs[channel.key]);
              return (
                <div
                  key={channel.key}
                  onClick={() => toggle(channel.key)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "border-violet-500 bg-violet-50/30 dark:bg-violet-900/10 ring-1 ring-violet-500"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isChecked ? "text-violet-600 dark:text-violet-400" : "text-gray-400"}`} />
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{channel.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{channel.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Granular Notification Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-500" /> Alert Categories
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Configure triggers for expenses, budgets, savings goals, and security.
          </p>

          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {[
              {
                key: "txAlerts",
                title: "Transaction Activity Alerts",
                desc: "Instant notification when new income, expenses, or transfers are recorded.",
                icon: DollarSign,
              },
              {
                key: "largeTxAlerts",
                title: "High-Value Transaction Alerts",
                desc: "Special highlighted alert when single expense exceeds ₹10,000.",
                icon: Wallet,
              },
              {
                key: "budgetThresholds",
                title: "Budget Limit Warnings",
                desc: "Receive warnings when spending in any category hits 80% and 100% of defined budget.",
                icon: AlertTriangle,
              },
              {
                key: "goalMilestones",
                title: "Savings Goal Milestones",
                desc: "Celebrate reaching 25%, 50%, 75%, and 100% target amounts.",
                icon: CheckCircle2,
              },
              {
                key: "billReminders",
                title: "Subscription Renewal & Due Dates",
                desc: "Get notified 3 days before any subscription auto-renews or bill payment is due.",
                icon: Calendar,
              },
              {
                key: "securityAlerts",
                title: "Security & Login Activity",
                desc: "Immediate notice when a new login occurs or password/2FA settings are modified.",
                icon: Shield,
              },
              {
                key: "weeklySummary",
                title: "Weekly Financial Health Digest",
                desc: "Comprehensive breakdown of weekly spending, savings, and portfolio returns sent on Sundays.",
                icon: Mail,
              },
            ].map(item => {

              const Icon = item.icon;
              const checked = Boolean(prefs[item.key]);
              return (
                <div key={item.key} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 mt-0.5 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Frequency */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
            Digest Summary Frequency
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            How often would you like recurring summary updates?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "instant", label: "Real-time (Instant)", desc: "Trigger as events happen" },
              { id: "daily", label: "Daily Digest", desc: "Aggregated 8:00 PM summary" },
              { id: "weekly", label: "Weekly Digest", desc: "Every Sunday morning" },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPrefs((prev: Record<string, unknown>) => ({ ...prev, frequency: f.id }))}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  prefs.frequency === f.id
                    ? "border-violet-600 bg-violet-50/40 dark:bg-violet-900/20 ring-1 ring-violet-500"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="text-xs font-bold text-gray-800 dark:text-gray-100">{f.label}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Notification Preferences
          </button>
        </div>
      </form>
    </div>
  );
}