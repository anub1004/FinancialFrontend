import { useState, useEffect } from "react";
import { Users, Sparkles, ShieldCheck, CreditCard, Bell } from "lucide-react";
import PlanManagement from "./PlanManagement";
import FeatureManagement from "./FeatureManagement";
import SubscriptionDashboard from "./SubscriptionDashboard";
import AdminUserManagement from "./AdminUserManagement";
import AdminNotifications from "./AdminNotifications";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

type AdminTab = "users" | "plans" | "features" | "subscriptions" | "notifications";

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "users",         label: "User Management",   icon: Users },
  { id: "plans",         label: "Plan Management",   icon: Sparkles },
  { id: "features",      label: "Feature Flags",     icon: ShieldCheck },
  { id: "subscriptions", label: "Subscriptions",     icon: CreditCard },
  { id: "notifications", label: "Notifications",     icon: Bell },
];

/**
 * AdminHub — a single-page admin console that renders all 5 admin sections
 * inside a unified tab navigation, mirroring the Settings page pattern.
 */
export default function AdminHub() {
  const { authState } = useAuth();
  const location = useLocation();

  const getInitialTab = (): AdminTab => {
    if (location.pathname.includes("plans")) return "plans";
    if (location.pathname.includes("features")) return "features";
    if (location.pathname.includes("subscriptions")) return "subscriptions";
    if (location.pathname.includes("notifications")) return "notifications";
    return "users";
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab);

  // Sync tab if pathname changes
  useEffect(() => {
    if (location.pathname.includes("plans")) setActiveTab("plans");
    else if (location.pathname.includes("features")) setActiveTab("features");
    else if (location.pathname.includes("subscriptions")) setActiveTab("subscriptions");
    else if (location.pathname.includes("notifications")) setActiveTab("notifications");
    else if (location.pathname.includes("users")) setActiveTab("users");
  }, [location.pathname]);

  // Guard: only admins may access this page
  if (authState.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* ─── Shared Admin Tab Navigation ─── */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200 dark:border-gray-700/60 overflow-x-auto no-scrollbar gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3.5 px-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Panels (each child component handles its own data & modals) ─── */}
      <div className="tab-panel">
        {activeTab === "users"         && <AdminUserManagement    embedded />}
        {activeTab === "plans"         && <PlanManagement         embedded />}
        {activeTab === "features"      && <FeatureManagement      embedded />}
        {activeTab === "subscriptions" && <SubscriptionDashboard  embedded />}
        {activeTab === "notifications" && <AdminNotifications     embedded />}
      </div>
    </div>
  );
}
