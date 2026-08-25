import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";

interface Feature {
  id: string;
  featureKey: string;
  displayName: string;
  description?: string;
  category?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  trialDays: number;
  maxUsers?: number;
  features: { id: string; featureKey: string; displayName: string }[];
}

const emptyPlan = {
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  annualPrice: 0,
  currency: "INR",
  sortOrder: 0,
  isActive: true,
  trialDays: 0,
  maxUsers: undefined as number | undefined,
};

export default function PlanManagement() {
  const { authState } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyPlan);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingPlanId, setPricingPlanId] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState({ monthlyPrice: 0, annualPrice: 0, currency: "INR" });

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/plans?includeInactive=true", { credentials: "include", headers });
      if (res.ok) setPlans(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/features", { credentials: "include", headers });
      if (res.ok) setFeatures(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchFeatures()]).finally(() => setLoading(false));
  }, []);

  // ── Create / Update ──────────────────────────────────────────────

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setSelectedFeatures([]);
    setShowModal(true);
  };

  const openEdit = (p: Plan) => {
    setEditingPlan(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.annualPrice ?? 0,
      currency: p.currency,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      trialDays: p.trialDays,
      maxUsers: p.maxUsers,
    });
    setSelectedFeatures(p.features.map((f) => f.id));
    setShowModal(true);
  };

  const savePlan = async () => {
    try {
      const url = editingPlan
        ? ApiConfig.Api_Base_Url + `api/admin/plans/${editingPlan.id}`
        : ApiConfig.Api_Base_Url + "api/admin/plans";
      const method = editingPlan ? "PUT" : "POST";

      const body: any = { ...form };
      if (!editingPlan) {
        body.monthlyPrice = Number(form.monthlyPrice);
        body.annualPrice = Number(form.annualPrice) || null;
      }

      const res = await fetch(url, { method, credentials: "include", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan");

      toast.success(editingPlan ? "Plan updated" : "Plan created");
      setShowModal(false);
      await fetchPlans();

      // Sync feature assignments
      if (!editingPlan) {
        for (const fid of selectedFeatures) {
          await fetch(ApiConfig.Api_Base_Url + `api/admin/plans/${data.id}/features`, {
            method: "POST", credentials: "include", headers,
            body: JSON.stringify({ featureId: fid }),
          });
        }
        await fetchPlans();
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure? This will soft-delete the plan.")) return;
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/plans/${id}`, { method: "DELETE", credentials: "include", headers });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Plan deleted");
      fetchPlans();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Feature assignment ───────────────────────────────────────────

  const assignFeature = async (planId: string, featureId: string) => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/plans/${planId}/features`, {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ featureId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Feature assigned");
      fetchPlans();
    } catch (e: any) { toast.error(e.message); }
  };

  const removeFeature = async (planId: string, featureId: string) => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/plans/${planId}/features/${featureId}`, {
        method: "DELETE", credentials: "include", headers,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Feature removed");
      fetchPlans();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Pricing ──────────────────────────────────────────────────────

  const openPricing = (p: Plan) => {
    setPricingPlanId(p.id);
    setPricingForm({ monthlyPrice: p.monthlyPrice, annualPrice: p.annualPrice ?? 0, currency: p.currency });
    setShowPricingModal(true);
  };

  const savePricing = async () => {
    if (!pricingPlanId) return;
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/plans/${pricingPlanId}/pricing`, {
        method: "PUT", credentials: "include", headers,
        body: JSON.stringify({ monthlyPrice: Number(pricingForm.monthlyPrice), annualPrice: Number(pricingForm.annualPrice) || null, currency: pricingForm.currency }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Pricing updated");
      setShowPricingModal(false);
      fetchPlans();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Guard ────────────────────────────────────────────────────────

  if (authState.role !== "Admin") return <div className="p-8 text-center text-red-500 font-semibold">Admin access required</div>;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Plan Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create, edit, and manage subscription plans</p>
        </div>
        <button onClick={openCreate} className="mt-4 sm:mt-0 btn bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
          + New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-xl border ${p.isActive ? "border-gray-200 dark:border-gray-700" : "border-red-200 dark:border-red-800 opacity-70"} shadow-sm overflow-hidden`}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{p.name}</h3>
                  <span className="text-xs text-gray-400 font-mono">/{p.slug}</span>
                </div>
                <div className="flex gap-1">
                  {p.isDefault && <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">Default</span>}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.isActive ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{p.description || "No description"}</p>

              {/* Pricing */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{p.currency} {p.monthlyPrice}</span>
                <span className="text-sm text-gray-400">/month</span>
                {p.annualPrice != null && p.annualPrice > 0 && (
                  <span className="text-xs text-gray-400 ml-2">({p.currency} {p.annualPrice}/year)</span>
                )}
              </div>

              {/* Features */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Features ({p.features.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {p.features.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
                      {f.displayName}
                      <button onClick={() => removeFeature(p.id, f.id)} className="ml-0.5 text-violet-400 hover:text-red-500" title="Remove">×</button>
                    </span>
                  ))}
                  {p.features.length === 0 && <span className="text-xs text-gray-400 italic">No features assigned</span>}
                </div>
              </div>

              {/* Assign Feature */}
              <div className="mb-4">
                <select
                  className="w-full text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-2 py-1.5"
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) assignFeature(p.id, e.target.value); e.target.value = ""; }}
                >
                  <option value="" disabled>+ Assign feature...</option>
                  {features.filter((f) => f.isActive && !p.features.some((pf) => pf.id === f.id)).map((f) => (
                    <option key={f.id} value={f.id}>{f.displayName}</option>
                  ))}
                </select>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>Order: {p.sortOrder}</span>
                <span>Trial: {p.trialDays}d</span>
                {p.maxUsers && <span>Max users: {p.maxUsers}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => openEdit(p)} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">Edit</button>
              <button onClick={() => openPricing(p)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Pricing</button>
              {!p.isDefault && (
                <button onClick={() => deletePlan(p.id)} className="text-xs font-medium text-red-500 hover:underline ml-auto">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No plans yet</p>
          <p className="text-sm mt-1">Create your first subscription plan to get started.</p>
        </div>
      )}

      {/* ── Create/Edit Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                {editingPlan ? "Edit Plan" : "New Plan"}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Pro Plan" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug *</label>
                    <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="pro" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" rows={2} />
                </div>

                {!editingPlan && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price *</label>
                      <input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Price</label>
                      <input type="number" value={form.annualPrice} onChange={(e) => setForm({ ...form, annualPrice: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                      <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                    <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trial Days</label>
                    <input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Users</label>
                    <input type="number" value={form.maxUsers ?? ""} onChange={(e) => setForm({ ...form, maxUsers: e.target.value ? Number(e.target.value) : undefined })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300 text-violet-600" />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                <button onClick={savePlan} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm">{editingPlan ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pricing Modal ─────────────────────────────────────────── */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Update Pricing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price</label>
                  <input type="number" value={pricingForm.monthlyPrice} onChange={(e) => setPricingForm({ ...pricingForm, monthlyPrice: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Price</label>
                  <input type="number" value={pricingForm.annualPrice} onChange={(e) => setPricingForm({ ...pricingForm, annualPrice: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setShowPricingModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
                <button onClick={savePricing} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Update Pricing</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
