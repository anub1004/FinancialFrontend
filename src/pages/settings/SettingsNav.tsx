import { NavLink } from "react-router-dom";
import { User, Bell, KeyRound, Sparkles, CreditCard, MessageSquare } from "lucide-react";

export default function SettingsNav() {
  const tabs = [
    { to: "/myaccount", label: "My Account", icon: User },
    { to: "/settings/notifications", label: "Notification Prefs", icon: Bell },
    { to: "/reset-password", label: "Reset Password", icon: KeyRound },
    { to: "/plans", label: "Plans", icon: Sparkles },
    { to: "/billing", label: "Billing & Invoices", icon: CreditCard },
    { to: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  return (
    <div className="mb-8">
      {/* Sub Navigation Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700/60 overflow-x-auto no-scrollbar gap-1">
        {tabs.map(tab => {
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
