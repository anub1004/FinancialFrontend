import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Transition from "../../utils/Transition.jsx";
import { IoNotificationsOutline } from "react-icons/io5";
import { CheckCheck, Bell, Loader2 } from "lucide-react";

const API_BASE = "https://localhost:7085/";

const TYPE_ICON = {
  AdminBroadcast: "📢",
  SubscriptionRenewal: "🔄",
  SubscriptionExpired: "⚠️",
  TrialEnding: "⏳",
  PlanChanged: "📋",
  PaymentFailed: "❌",
  PaymentSuccess: "✅",
  SystemAlert: "🔔",
};

function DropdownNotifications({ align }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const trigger = useRef(null);
  const dropdown = useRef(null);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}api/notification/unread-count`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}api/notification?page=1&pageSize=15`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}api/notification/${id}/read`, { method: "PUT", headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await fetch(`${API_BASE}api/notification/read-all`, { method: "PUT", headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
    finally { setMarkingAll(false); }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (dropdownOpen) fetchNotifications();
  }, [dropdownOpen, fetchNotifications]);

  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdown.current) return;
      if (!dropdownOpen || dropdown.current.contains(target) || trigger.current.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const relativeTime = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative inline-flex" data-tour="Notifications">
      <button
        ref={trigger}
        className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ${dropdownOpen && "bg-gray-200 dark:bg-gray-800"}`}
        aria-haspopup="true"
        onClick={() => setDropdownOpen((o) => !o)}
        aria-expanded={dropdownOpen}
      >
        <span className="sr-only">Notifications</span>
        <IoNotificationsOutline size={20} className="text-gray-500/80 dark:text-gray-400/80" />
        {unreadCount > 0 ? (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-gray-100 dark:border-gray-900 rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </div>
        ) : (
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 border-2 border-gray-100 dark:border-gray-900 rounded-full" />
        )}
      </button>

      <Transition
        className={`origin-top-right z-10 absolute top-full -mr-48 sm:mr-0 min-w-80 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-xl shadow-lg overflow-hidden mt-1 ${align === "right" ? "right-0" : "left-0"}`}
        show={dropdownOpen}
        enter="transition ease-out duration-200 transform"
        enterStart="opacity-0 -translate-y-2"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
      >
        <div ref={dropdown} onFocus={() => setDropdownOpen(true)} onBlur={() => setDropdownOpen(false)}>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase pt-1.5 pb-2 px-4 border-b border-gray-100 dark:border-gray-700/50">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold normal-case">
                  {unreadCount} unread
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 normal-case transition-colors disabled:opacity-50"
              >
                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
            {loading ? (
              <li className="py-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </li>
            ) : notifications.length === 0 ? (
              <li className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
                <Bell className="w-8 h-8 opacity-30" />
                <span>All caught up!</span>
              </li>
            ) : (
              notifications.map((item) => (
                <li key={item.id} className={`last:border-0 ${!item.isRead ? "bg-violet-50/40 dark:bg-violet-900/10" : ""}`}>
                  <div
                    className="block py-2.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                    onClick={() => { if (!item.isRead) markAsRead(item.id); }}
                  >
                    <span className="block text-xs mb-1">
                      <span className="mr-1">{TYPE_ICON[item.type] ?? "🔔"}</span>
                      <span className={`font-semibold ${!item.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                        {item.title}
                      </span>
                      {!item.isRead && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-violet-500 align-middle" />}
                    </span>
                    <span className="block text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-1 line-clamp-2">{item.message}</span>
                    <span className="block text-[10px] font-medium text-gray-400 dark:text-gray-500">{relativeTime(item.createdAt)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="pt-1.5 pb-1 px-4 border-t border-gray-100 dark:border-gray-700/50">
            <Link
              className="block text-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              to="/notifications"
              onClick={() => setDropdownOpen(false)}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      </Transition>
    </div>
  );
}

export default DropdownNotifications;