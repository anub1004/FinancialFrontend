import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";

interface PlanFeature {
  id: string;
  featureKey: string;
  displayName: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  trialDays: number;
  features: PlanFeature[];
}

export default function Plans() {
  const { authState } = useAuth();
  const { subscription, refreshFeatures } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/plans", { credentials: "include", headers });
      if (res.ok) {
        const data: Plan[] = await res.json();
        setPlans(data.filter((p) => p.isActive).sort((a, b) => a.monthlyPrice - b.monthlyPrice));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/subscription/subscribe", {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ planId, billingCycle: billing === "annual" ? "Annual" : "Monthly" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Subscription failed");
      toast.success("Subscribed successfully!");
      await refreshFeatures();
    } catch (e: any) { toast.error(e.message); } finally { setSubscribing(null); }
  };

  const handleUpgrade = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/subscription/upgrade", {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ newPlanId: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Upgrade failed");
      toast.success("Plan upgraded!");
      await refreshFeatures();
    } catch (e: any) { toast.error(e.message); } finally { setSubscribing(null); }
  };

  const handleDowngrade = async (planId: string) => {
    if (!confirm("Downgrade will be scheduled at the end of your current billing period. Continue?")) return;
    setSubscribing(planId);
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/subscription/downgrade", {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ newPlanId: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Downgrade failed");
      toast.success("Downgrade scheduled!");
      await refreshFeatures();
    } catch (e: any) { toast.error(e.message); } finally { setSubscribing(null); }
  };

  // Gather all unique features for the comparison matrix
  const allFeatures = Array.from(
    new Map(plans.flatMap((p) => p.features).map((f) => [f.id, f])).values()
  );

  const isCurrentPlan = (planId: string) => subscription.planId === planId;

  const getPlanAction = (plan: Plan) => {
    if (!subscription.planId || subscription.status === "none") return "subscribe";
    if (isCurrentPlan(plan.id)) return "current";
    const currentPlan = plans.find((p) => p.id === subscription.planId);
    if (!currentPlan) return "subscribe";
    return plan.monthlyPrice > currentPlan.monthlyPrice ? "upgrade" : "downgrade";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Choose Your Plan</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          Select the plan that fits your needs. Upgrade or downgrade anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>Monthly</span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === "annual" ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${billing === "annual" ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm font-medium ${billing === "annual" ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>
            Annual
            <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-medium">Save ~17%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => {
          const action = getPlanAction(plan);
          const isCurrent = action === "current";
          const price = billing === "annual" && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice;
          const period = billing === "annual" ? "/year" : "/month";

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all overflow-hidden
                ${isCurrent
                  ? "border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.02]"
                  : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600"
                }`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-bl-xl">
                  Current Plan
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 min-h-[2.5rem]">
                  {plan.description || "Standard plan"}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                    {plan.currency === "INR" ? "₹" : plan.currency} {price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">{period}</span>
                </div>

                {plan.trialDays > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-4">
                    {plan.trialDays}-day free trial included
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f.displayName}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {action === "current" && (
                  <button disabled className="w-full py-2.5 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default">
                    Current Plan
                  </button>
                )}
                {action === "subscribe" && (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    className="w-full py-2.5 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    {subscribing === plan.id ? "Subscribing..." : "Subscribe"}
                  </button>
                )}
                {action === "upgrade" && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={subscribing === plan.id}
                    className="w-full py-2.5 text-sm font-medium rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    {subscribing === plan.id ? "Upgrading..." : "Upgrade"}
                  </button>
                )}
                {action === "downgrade" && (
                  <button
                    onClick={() => handleDowngrade(plan.id)}
                    disabled={subscribing === plan.id}
                    className="w-full py-2.5 text-sm font-medium rounded-xl border border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                  >
                    {subscribing === plan.id ? "Scheduling..." : "Downgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      {allFeatures.length > 0 && plans.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-6 py-3">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className={`px-6 py-3 text-center ${isCurrentPlan(p.id) ? "text-violet-600 dark:text-violet-400" : ""}`}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {allFeatures.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{f.displayName}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="px-6 py-3 text-center">
                        {p.features.some((pf) => pf.id === f.id) ? (
                          <svg className="w-5 h-5 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No plans available</p>
          <p className="text-sm mt-1">Plans will appear here once configured by an administrator.</p>
        </div>
      )}
    </div>
  );
}