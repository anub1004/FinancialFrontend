import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";

interface CurrentSub {
  id: string;
  planId: string;
  planName: string;
  planSlug: string;
  statusName: string;
  billingCycleName: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  scheduledPlanName?: string;
}

interface HistoryItem {
  id: string;
  action: string;
  fromPlanName?: string;
  toPlanName?: string;
  reason?: string;
  createdAt: string;
}

export default function Billing() {
  const { authState } = useAuth();
  const { subscription, refreshFeatures } = useSubscription();
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchData = useCallback(async () => {
    try {
      const [subRes, histRes] = await Promise.all([
        fetch(ApiConfig.Api_Base_Url + "api/subscription/current", { credentials: "include", headers }),
        fetch(ApiConfig.Api_Base_Url + "api/subscription/history", { credentials: "include", headers }),
      ]);
      if (subRes.ok) setCurrent(await subRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const cancelSubscription = async () => {
    if (!confirm("Cancel your subscription? You'll retain access until the end of the current billing period.")) return;
    setCancelling(true);
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/subscription/cancel", {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ reason: "User cancelled from billing page" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Cancel failed");
      toast.success("Subscription cancelled");
      await fetchData();
      await refreshFeatures();
    } catch (e: any) { toast.error(e.message); } finally { setCancelling(false); }
  };

  const reactivateSubscription = async () => {
    setReactivating(true);
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/subscription/reactivate", {
        method: "POST", credentials: "include", headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Reactivation failed");
      toast.success("Subscription reactivated!");
      await fetchData();
      await refreshFeatures();
    } catch (e: any) { toast.error(e.message); } finally { setReactivating(false); }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
      Trial: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      Cancelled: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      Expired: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      PastDue: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
      Suspended: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.Expired}`}>{status}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Billing & Subscription</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and view billing history</p>
      </div>

      {/* Cancel-until-deadline banner */}
      {current && current.statusName === "Cancelled" && new Date(current.endDate) > new Date() && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Your subscription has been cancelled
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              You'll continue to have full access to all features until{" "}
              <span className="font-semibold">
                {new Date(current.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>. After this date, your account will revert to the free plan.
            </p>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      {current ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Current Subscription</h2>
            {statusBadge(current.statusName)}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Plan</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{current.planName}</div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">/{current.planSlug}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Billing Cycle</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{current.billingCycleName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Start Date</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(current.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">End Date</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(current.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Auto-Renew</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{current.autoRenew ? "Yes" : "No"}</div>
              </div>
              {current.scheduledPlanName && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Scheduled Change</div>
                  <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">→ {current.scheduledPlanName}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
              <NavLink to="/plans" className="px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                Change Plan
              </NavLink>

              {(current.statusName === "Active" || current.statusName === "Trial") && (
                <button
                  onClick={cancelSubscription}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              )}

              {(current.statusName === "Cancelled" || current.statusName === "Expired") && (
                <button
                  onClick={reactivateSubscription}
                  disabled={reactivating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {reactivating ? "Reactivating..." : "Reactivate"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 p-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No Active Subscription</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a plan to get started with premium features.</p>
          <NavLink to="/plans" className="inline-flex px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
            View Plans
          </NavLink>
        </div>
      )}

      {/* Subscription History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Subscription History</h2>
        </div>
        {history.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {history.map((h) => (
              <div key={h.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {h.action}
                    {h.fromPlanName && h.toPlanName && (
                      <span className="text-gray-400 font-normal"> — {h.fromPlanName} → {h.toPlanName}</span>
                    )}
                    {!h.fromPlanName && h.toPlanName && (
                      <span className="text-gray-400 font-normal"> — {h.toPlanName}</span>
                    )}
                  </div>
                  {h.reason && <div className="text-xs text-gray-400 mt-0.5">{h.reason}</div>}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No subscription history yet
          </div>
        )}
      </div>
    </div>
  );
}