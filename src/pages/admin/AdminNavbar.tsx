import { NavLink } from "react-router-dom";
import {
  Users,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Settings,
  Bell,
} from "lucide-react";

/**
 * AdminNavbar
 * Horizontal tab-bar rendered at the top of every Admin page.
 * Mirrors the same design pattern as user SettingsNav.
 */
export default function AdminNavbar() {
  const tabs = [
    { to: "/admin/users",         label: "User Management",    icon: Users },
    { to: "/admin/plans",         label: "Plan Management",    icon: Sparkles },
    { to: "/admin/features",      label: "Feature Flags",      icon: ShieldCheck },
    { to: "/admin/subscriptions", label: "Subscriptions",      icon: CreditCard },
    { to: "/admin/notifications", label: "Notifications",      icon: Bell },
    { to: "/admin/account",       label: "Admin Account",      icon: Settings },
  ];

  return (
    <div className="mb-8">
      <div className="flex border-b border-gray-200 dark:border-gray-700/60 overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-2 pb-3.5 px-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
