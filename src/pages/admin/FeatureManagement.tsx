import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import AdminNavbar from "./AdminNavbar";

interface Feature {
  id: string;
  featureKey: string;
  displayName: string;
  description?: string;
  category?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const emptyFeature = {
  featureKey: "",
  displayName: "",
  description: "",
  category: "General",
  sortOrder: 0,
  isActive: true,
};

export default function FeatureManagement({ embedded = false }: { embedded?: boolean } = {}) {
  const { authState } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [form, setForm] = useState(emptyFeature);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/features", { credentials: "include", headers });
      if (res.ok) setFeatures(await res.json());
    } catch {  } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeatures(); }, []);

  const openCreate = () => {
    setEditingFeature(null);
    setForm(emptyFeature);
    setShowModal(true);
  };

  const openEdit = (f: Feature) => {
    setEditingFeature(f);
    setForm({
      featureKey: f.featureKey,
      displayName: f.displayName,
      description: f.description ?? "",
      category: f.category ?? "General",
      sortOrder: f.sortOrder,
      isActive: f.isActive,
    });
    setShowModal(true);
  };

  const saveFeature = async () => {
    try {
      const url = editingFeature
        ? ApiConfig.Api_Base_Url + `api/admin/features/${editingFeature.id}`
        : ApiConfig.Api_Base_Url + "api/admin/features";
      const method = editingFeature ? "PUT" : "POST";
      const res = await fetch(url, { method, credentials: "include", headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save feature");
      toast.success(editingFeature ? "Feature updated" : "Feature created");
      setShowModal(false);
      fetchFeatures();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleFeature = async (id: string) => {
    if (!confirm("Toggle this feature's active status?")) return;
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/features/${id}/toggle`, { method: "PATCH", credentials: "include", headers });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Feature toggled");
      fetchFeatures();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteFeature = async (id: string) => {
    if (!confirm("Are you sure? This will soft-delete the feature.")) return;
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + `api/admin/features/${id}`, { method: "DELETE", credentials: "include", headers });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Feature deleted");
      fetchFeatures();
    } catch (e: any) { toast.error(e.message); }
  };

  const filteredFeatures = features.filter((f) => {
    if (filter === "active") return f.isActive;
    if (filter === "inactive") return !f.isActive;
    return true;
  });

  if (authState.role !== "Admin") return <div className="p-8 text-center text-red-500 font-semibold">Admin access required</div>;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Feature Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription features and capabilities</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2">
            <option value="all">All ({features.length})</option>
            <option value="active">Active ({features.filter(f => f.isActive).length})</option>
            <option value="inactive">Inactive ({features.filter(f => !f.isActive).length})</option>
          </select>
          <button onClick={openCreate} className="btn bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            + New Feature
          </button>
        </div>
      </div>

      {/* ── Admin Navigation ── */}
      {!embedded && <AdminNavbar />}

  
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-5 py-3">Feature Key</th>
                <th className="px-5 py-3">Display Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredFeatures.map((f) => (
                <tr key={f.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!f.isActive ? "opacity-60" : ""}`}>
                  <td className="px-5 py-3">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{f.featureKey}</code>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">{f.displayName}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{f.category || "â€”"}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{f.sortOrder}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleFeature(f.id)} className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${f.isActive
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200"
                      : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200"
                      }`}>
                      {f.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(f)} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">Edit</button>
                      <button onClick={() => deleteFeature(f.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">No features found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

     
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                {editingFeature ? "Edit Feature" : "New Feature"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feature Key *</label>
                  <input
                    value={form.featureKey}
                    onChange={(e) => setForm({ ...form, featureKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="export_pdf"
                    disabled={!!editingFeature}
                  />
                  <p className="text-xs text-gray-400 mt-1">Lowercase, underscores only. Cannot be changed after creation.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name *</label>
                  <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Export to PDF" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                    <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featureActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300 text-violet-600" />
                  <label htmlFor="featureActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
                <button onClick={saveFeature} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm">{editingFeature ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

