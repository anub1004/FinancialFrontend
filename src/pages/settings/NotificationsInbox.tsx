import React, { useState, useEffect, useCallback } from "react";
import {
  Bell, CheckCheck, Loader2, RefreshCw, Filter, Inbox,
  AlertTriangle, CreditCard, Clock, CheckCircle2, Megaphone, Zap, X
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = "https://localhost:7085/";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  typeLabel: string;
  isRead: boolean;
  isGlobal: boolean;
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
}

interface PagedResponse {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  AdminBroadcast:     { icon: Megaphone,      color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-100 dark:bg-violet-900/40" },
  SubscriptionRenewal:{ icon: RefreshCw,      color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-900/40" },
  SubscriptionExpired:{ icon: AlertTriangle,  color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/40" },
  TrialEnding:        { icon: Clock,          color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-900/40" },
  PlanChanged:        { icon: Zap,            color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/40" },
  PaymentFailed:      { icon: X,              color: "text-red-600 dark:text-red-400",       bg: "bg-red-100 dark:bg-red-900/40" },
  PaymentSuccess:     { icon: CheckCircle2,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
  SystemAlert:        { icon: Bell,           color: "text-gray-600 dark:text-gray-400",     bg: "bg-gray-100 dark:bg-gray-700/60" },
};

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const [data, setData] = useState<PagedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  const fetchNotifications = useCallback(async (pg = page, unreadOnly = onlyUnread) => {
    setLoading(true);
    try {
      const url = `${API_BASE}api/notification?page=${pg}&pageSize=20${unreadOnly ? "&onlyUnread=true" : ""}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load");
      const json: PagedResponse = await res.json();
      setData(json);
      setPage(pg);
    } catch {
      toast.error("Could not load notifications. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }, [page, onlyUnread]);

  useEffect(() => {
    fetchNotifications(1, onlyUnread);
  }, [onlyUnread]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}api/notification/${id}/read`, { method: "PUT", headers: authHeaders() });
      setData((prev) => prev ? {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map((n) => n.id === id ? { ...n, isRead: true } : n),
      } : prev);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await fetch(`${API_BASE}api/notification/read-all`, { method: "PUT", headers: authHeaders() });
      setData((prev) => prev ? {
        ...prev,
        unreadCount: 0,
        items: prev.items.map((n) => ({ ...n, isRead: true })),
      } : prev);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchNotifications(newPage, onlyUnread);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Bell className="w-5 h-5" />
            </div>
            Notifications
            {(data?.unreadCount ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                {data?.unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            Stay on top of your subscription renewals, payments, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2 ml-11 sm:ml-0">
          {/* Filter toggle */}
          <button
            onClick={() => setOnlyUnread((u) => !u)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyUnread
                ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {onlyUnread ? "Unread only" : "All"}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchNotifications(page, onlyUnread)}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Mark all read */}
          {(data?.unreadCount ?? 0) > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 transition-all disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading notifications…</span>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Inbox className="w-12 h-12 opacity-30" />
            <span className="text-sm font-medium">
              {onlyUnread ? "No unread notifications." : "You're all caught up! No notifications yet."}
            </span>
            {onlyUnread && (
              <button
                onClick={() => setOnlyUnread(false)}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {data.items.map((item) => {
              const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.SystemAlert;
              const Icon = cfg.icon;
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-4 p-4 sm:p-5 transition-colors ${
                    !item.isRead
                      ? "bg-violet-50/30 dark:bg-violet-900/10 hover:bg-violet-50/50 dark:hover:bg-violet-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/20"
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 p-2.5 rounded-xl ${cfg.bg} mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${!item.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                        {item.title}
                        {!item.isRead && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-violet-500 align-middle" />
                        )}
                      </p>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                        {relativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {item.typeLabel}
                      </span>
                      {item.isGlobal && (
                        <span className="text-[10px] font-medium text-gray-400">Broadcast</span>
                      )}
                      {!item.isRead && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {data.page} of {data.totalPages} · {data.totalCount} total
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page <= 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}