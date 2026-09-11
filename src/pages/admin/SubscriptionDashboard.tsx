import { useState, useEffect, useCallback } from "react";
import AdminNavbar from "./AdminNavbar";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";

interface Stats {
  totalActive: number;
  totalTrial: number;
  totalExpired: number;
  totalCancelled: number;
  totalPastDue: number;
  totalSuspended: number;
  subscriptionsByPlan: { planName: string; activeCount: number }[];
  recentSubscriptions30d: number;
  asOf: string;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

interface PageResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Subscription[];
}

export default function SubscriptionDashboard({ embedded = false }: { embedded?: boolean } = {}) {
  const { authState } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [subs, setSubs] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/subscriptions/stats", { credentials: "include", headers });
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSubs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/subscriptions?${params}`, { credentials: "include", headers });
      if (res.ok) setSubs(await res.json());
    } catch { /* ignore */ }
  }, [page, statusFilter]);

  useEffect(() => { fetchStats().finally(() => setLoading(false)); }, []);
  useEffect(() => { fetchSubs(); }, [page, statusFilter]);

  if (authState.role !== "Admin") return <div className="p-8 text-center text-red-500 font-semibold">Admin access required</div>;
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  );

  const statCards = stats ? [
    { label: "Active", value: stats.totalActive, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
    { label: "Trial", value: stats.totalTrial, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: "Cancelled", value: stats.totalCancelled, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
    { label: "Expired", value: stats.totalExpired, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800" },
    { label: "Past Due", value: stats.totalPastDue, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30" },
    { label: "Last 30 days", value: stats.recentSubscriptions30d, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30" },
  ] : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Subscription Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of all user subscriptions</p>
      </div>

      {!embedded && <AdminNavbar />}

     
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl ${s.bg} p-4 text-center border border-gray-100 dark:border-gray-700`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

     
      {stats && stats.subscriptionsByPlan.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Active Subscriptions by Plan</h2>
          <div className="flex flex-wrap gap-4">
            {stats.subscriptionsByPlan.map((bp) => (
              <div key={bp.planName} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{bp.planName}</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full">{bp.activeCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

     
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Subscriptions</h2>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-1.5">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
            <option value="PastDue">Past Due</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cycle</th>
                <th className="px-5 py-3">Start</th>
                <th className="px-5 py-3">End</th>
                <th className="px-5 py-3">Auto-Renew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {subs?.items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">{s.planName}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      s.status === "Active" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                      s.status === "Trial" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" :
                      s.status === "Cancelled" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                      "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.billingCycle}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(s.startDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(s.endDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{s.autoRenew ? "âœ“" : "â€”"}</td>
                </tr>
              ))}
              {(!subs || subs.items.length === 0) && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No subscriptions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

     
        {subs && subs.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {subs.page} of {subs.totalPages} ({subs.total} total)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40">â† Prev</button>
              <button disabled={page >= subs.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40">Next â†’</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



