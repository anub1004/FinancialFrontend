import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { PortfolioApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import {
  Briefcase, Loader, TrendingUp, TrendingDown, PieChart,
  BarChart3, ArrowUpRight, ArrowDownRight, Plus, Pencil, Trash2, X
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
interface PortfolioAssetDto {
  portfolioAssetId: string;
  name: string;
  assetType: string;
  investedAmount: number;
  currentValue: number;
  allocationPercentage: number;
  profitLoss: number;
  returnPercentage: number;
  color: string;
  notes: string | null;
  purchaseDate: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioSummaryDto {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  overallReturnPercentage: number;
  assetCount: number;
  currency: string;
  byType: { assetType: string; totalInvested: number; totalCurrentValue: number; allocationPercentage: number; count: number }[];
}

// ── Constants ────────────────────────────────────────────────────────────
const ASSET_TYPES = ["Equity", "Mutual Fund", "Gold", "Fixed Income", "International", "Crypto", "Real Estate", "ETF"];
const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const fmt = (amount: number, currency: string = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

// ── Component ────────────────────────────────────────────────────────────
function PortfolioManagement() {
  const { authState } = useAuth();
  const [assets, setAssets] = useState<PortfolioAssetDto[]>([]);
  const [summary, setSummary] = useState<PortfolioSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "", assetType: "Equity", investedAmount: "", currentValue: "",
    color: "#6366f1", notes: "", purchaseDate: "", currency: "INR",
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(PortfolioApiConfig.list, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.items || []);
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn("Failed to load portfolio:", err);
      }
    } catch {
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(PortfolioApiConfig.summary, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      /* summary is non-critical */
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchSummary();
  }, [fetchAssets, fetchSummary]);

  // ── Form helpers ───────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ name: "", assetType: "Equity", investedAmount: "", currentValue: "", color: "#6366f1", notes: "", purchaseDate: "", currency: "INR" });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (a: PortfolioAssetDto) => {
    setFormData({
      name: a.name, assetType: a.assetType,
      investedAmount: a.investedAmount.toString(), currentValue: a.currentValue.toString(),
      color: a.color, notes: a.notes || "", purchaseDate: a.purchaseDate ? a.purchaseDate.split("T")[0] : "", currency: a.currency,
    });
    setEditingId(a.portfolioAssetId);
    setShowModal(true);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.investedAmount || !formData.purchaseDate) {
      toast.error("Name, invested amount, and purchase date are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? PortfolioApiConfig.byId(editingId) : PortfolioApiConfig.list;
      const body: Record<string, unknown> = {
        name: formData.name,
        assetType: formData.assetType,
        investedAmount: parseFloat(formData.investedAmount),
        currentValue: parseFloat(formData.currentValue) || parseFloat(formData.investedAmount),
        color: formData.color,
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
        currency: formData.currency,
      };
      if (formData.notes) body.notes = formData.notes;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).message || "Operation failed");
      }
      toast.success(editingId ? "Asset updated!" : "Asset added!");
      setShowModal(false);
      resetForm();
      fetchAssets();
      fetchSummary();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this portfolio asset?")) return;
    try {
      const res = await fetch(PortfolioApiConfig.byId(id), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Asset deleted");
      fetchAssets();
      fetchSummary();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  // ── Derived values ────────────────────────────────────────────────────
  const totalInvested = summary?.totalInvested ?? assets.reduce((s, a) => s + a.investedAmount, 0);
  const totalCurrent = summary?.totalCurrentValue ?? assets.reduce((s, a) => s + a.currentValue, 0);
  const totalReturns = summary?.totalReturns ?? (totalCurrent - totalInvested);
  const returnsPct = summary?.overallReturnPercentage ?? (totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0);

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Portfolio Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Advanced portfolio analysis with allocation & rebalancing</p>
        </div>
        <button onClick={openCreate}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Briefcase className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total Invested</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(totalInvested)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Current Value</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(totalCurrent)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${totalReturns >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              {totalReturns >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total Returns</div>
              <div className={`text-lg font-bold ${totalReturns >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {totalReturns >= 0 ? "+" : ""}{fmt(totalReturns)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <PieChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Return %</div>
              <div className={`text-lg font-bold ${totalReturns >= 0 ? "text-emerald-600" : "text-red-600"}`}>{totalReturns >= 0 ? "+" : ""}{returnsPct.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Chart */}
      {assets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Asset Allocation</h2>
          <div className="flex h-6 rounded-full overflow-hidden mb-4">
            {assets.map(a => (
              <div key={a.portfolioAssetId} style={{ width: `${a.allocationPercentage || 0}%`, backgroundColor: a.color }}
                className="transition-all duration-500 first:rounded-l-full last:rounded-r-full" title={`${a.assetType}: ${a.allocationPercentage?.toFixed(1)}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {assets.map(a => (
              <div key={a.portfolioAssetId} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{a.name} ({a.allocationPercentage?.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Holdings ({assets.length})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader className="animate-spin text-violet-500 w-8 h-8" /></div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No portfolio assets yet. Click "Add Asset" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-6 py-3 text-left font-medium">Asset</th>
                  <th className="px-6 py-3 text-left font-medium">Type</th>
                  <th className="px-6 py-3 text-right font-medium">Invested</th>
                  <th className="px-6 py-3 text-right font-medium">Current</th>
                  <th className="px-6 py-3 text-right font-medium">P&L</th>
                  <th className="px-6 py-3 text-right font-medium">Return %</th>
                  <th className="px-6 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {assets.map(a => {
                  const pl = a.profitLoss ?? (a.currentValue - a.investedAmount);
                  const plPct = a.returnPercentage ?? (a.investedAmount > 0 ? ((pl / a.investedAmount) * 100) : 0);
                  const isPositive = pl >= 0;
                  return (
                    <tr key={a.portfolioAssetId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                          <div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.name}</span>
                            {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{a.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{a.assetType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 text-right">{fmt(a.investedAmount, a.currency)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-100 text-right">{fmt(a.currentValue, a.currency)}</td>
                      <td className={`px-6 py-4 text-sm font-semibold text-right ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        <span className="inline-flex items-center gap-1">
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? "+" : ""}{fmt(pl, a.currency)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold text-right ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {isPositive ? "+" : ""}{plPct.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(a.portfolioAssetId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editingId ? "Edit Asset" : "Add New Asset"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Nifty 50 Index Fund" required />
              </div>

              {/* Asset Type + Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Type *</label>
                  <select value={formData.assetType} onChange={e => setFormData({ ...formData, assetType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Invested + Current */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invested Amount *</label>
                  <input type="number" step="0.01" min="0.01" value={formData.investedAmount}
                    onChange={e => setFormData({ ...formData, investedAmount: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="200000" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Value</label>
                  <input type="number" step="0.01" min="0" value={formData.currentValue}
                    onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="248000" />
                </div>
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date *</label>
                <input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  required />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  {COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${formData.color === c ? "ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-gray-800 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none"
                  rows={2} placeholder="Optional notes about this asset..." maxLength={500} />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2">
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update Asset" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortfolioManagement;
