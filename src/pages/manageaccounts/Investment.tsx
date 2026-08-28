import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import {
  Plus, Pencil, Trash2, X, Loader, TrendingUp, TrendingDown, PieChart,
  ChevronLeft, ChevronRight, BarChart3, Briefcase
} from "lucide-react";

interface InvestmentItem {
  investmentId: string;
  name: string;
  amount: number;
  currentValue: number;
  investmentType: string;
  startDate: string;
  endDate: string | null;
  status: string;
  returns: number | null;
  returnPercentage: number | null;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  overallReturnPercentage: number;
  activeCount: number;
  totalCount: number;
  currency: string;
  byType: { investmentType: string; totalInvested: number; totalCurrentValue: number; count: number }[];
}

const INVESTMENT_TYPES = ["Stocks", "Mutual Funds", "Fixed Deposit", "Gold", "Crypto", "Real Estate", "PPF", "NPS", "Bonds", "ETF", "Other"];
const STATUSES = ["Active", "Matured", "Sold", "Closed"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"];

function Investment() {
  const { authState } = useAuth();
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "", amount: "", currentValue: "", investmentType: "", startDate: new Date().toISOString().split("T")[0],
    endDate: "", currency: "INR", notes: "", status: "Active",
  });

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" };

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString(), sortBy: "CreatedAt", sortOrder: "desc" });
      if (filterType) params.append("investmentType", filterType);
      if (filterStatus) params.append("status", filterStatus);
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/investments?${params}`, { credentials: "include", headers });
      if (res.ok) { const d = await res.json(); setInvestments(d.items); setTotalCount(d.totalCount); setTotalPages(d.totalPages); }
    } catch { toast.error("Failed to load investments"); } finally { setLoading(false); }
  }, [page, filterType, filterStatus]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/investments/summary`, { credentials: "include", headers });
      if (res.ok) setSummary(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchInvestments(); fetchSummary(); }, [page, filterType, filterStatus]);

  const resetForm = () => {
    setFormData({ name: "", amount: "", currentValue: "", investmentType: "", startDate: new Date().toISOString().split("T")[0], endDate: "", currency: "INR", notes: "", status: "Active" });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (inv: InvestmentItem) => {
    setFormData({
      name: inv.name, amount: inv.amount.toString(), currentValue: inv.currentValue.toString(),
      investmentType: inv.investmentType, startDate: inv.startDate.split("T")[0],
      endDate: inv.endDate ? inv.endDate.split("T")[0] : "", currency: inv.currency,
      notes: inv.notes || "", status: inv.status,
    });
    setEditingId(inv.investmentId);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.investmentType) { toast.error("Name, amount, and type are required"); return; }
    try {
      const url = editingId ? `${ApiConfig.Api_Base_Url}api/investments/${editingId}` : `${ApiConfig.Api_Base_Url}api/investments`;
      const body: Record<string, any> = {
        name: formData.name, amount: parseFloat(formData.amount), investmentType: formData.investmentType,
        startDate: formData.startDate, currency: formData.currency, notes: formData.notes || null,
      };
      if (formData.currentValue) body.currentValue = parseFloat(formData.currentValue);
      if (formData.endDate) body.endDate = formData.endDate;
      if (editingId) body.status = formData.status;

      const res = await fetch(url, { method: editingId ? "PUT" : "POST", credentials: "include", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editingId ? "Investment updated!" : "Investment added!");
      setShowModal(false); resetForm(); fetchInvestments(); fetchSummary();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this investment?")) return;
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/investments/${id}`, { method: "DELETE", credentials: "include", headers });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Investment deleted"); fetchInvestments(); fetchSummary();
    } catch (err: any) { toast.error(err.message); }
  };

  const fmt = (amount: number, currency: string = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
      Matured: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      Sold: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      Closed: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.Closed}`}>{status}</span>;
  };

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Investments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your investment portfolio</p>
        </div>
        <button onClick={openCreate} className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Investment
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30"><Briefcase className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Total Invested</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(summary.totalInvested, summary.currency)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30"><BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" /></div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Current Value</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(summary.totalCurrentValue, summary.currency)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${summary.totalReturns >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                {summary.totalReturns >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Total Returns</div>
                <div className={`text-lg font-bold ${summary.totalReturns >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {summary.totalReturns >= 0 ? "+" : ""}{fmt(summary.totalReturns, summary.currency)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30"><PieChart className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Overall ROI</div>
                <div className={`text-lg font-bold ${summary.overallReturnPercentage >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {summary.overallReturnPercentage >= 0 ? "+" : ""}{summary.overallReturnPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type breakdown pills */}
      {summary && summary.byType.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {summary.byType.map((b) => (
            <div key={b.investmentType} className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
              {b.investmentType} <span className="text-gray-400">·</span> {b.count} <span className="text-gray-400">·</span> {fmt(b.totalInvested)}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
          <option value="">All Types</option>
          {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Investments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Portfolio</h2>
          <span className="text-xs text-gray-400">{totalCount} investments</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader className="animate-spin text-violet-500 w-8 h-8" /></div>
        ) : investments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-6 py-3 text-left font-medium">Name</th>
                    <th className="px-6 py-3 text-left font-medium">Type</th>
                    <th className="px-6 py-3 text-right font-medium">Invested</th>
                    <th className="px-6 py-3 text-right font-medium">Current</th>
                    <th className="px-6 py-3 text-right font-medium">Returns</th>
                    <th className="px-6 py-3 text-center font-medium">Status</th>
                    <th className="px-6 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {investments.map((inv) => (
                    <tr key={inv.investmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{inv.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{new Date(inv.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{inv.investmentType}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-100 text-right">{fmt(inv.amount, inv.currency)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-100 text-right">{fmt(inv.currentValue, inv.currency)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-sm font-semibold ${(inv.returns ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {(inv.returns ?? 0) >= 0 ? "+" : ""}{fmt(inv.returns ?? 0, inv.currency)}
                        </div>
                        <div className={`text-xs ${(inv.returnPercentage ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {(inv.returnPercentage ?? 0) >= 0 ? "+" : ""}{(inv.returnPercentage ?? 0).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{statusBadge(inv.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(inv.investmentId)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4"><Briefcase className="w-7 h-7 text-gray-400" /></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No investments yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start tracking your investment portfolio.</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors"><Plus className="w-4 h-4" />Add Your First Investment</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editingId ? "Edit Investment" : "Add Investment"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g., HDFC Equity Fund"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Type</label>
                <select required value={formData.investmentType} onChange={(e) => setFormData(f => ({ ...f, investmentType: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
                  <option value="">Select type...</option>
                  {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Amount Invested</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="0.00"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Current Value <span className="text-gray-300 dark:text-gray-500">(optional)</span></label>
                <input type="number" step="0.01" value={formData.currentValue} onChange={(e) => setFormData(f => ({ ...f, currentValue: e.target.value }))} placeholder="Leave empty to use invested amount"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Start Date</label>
                  <input type="date" required value={formData.startDate} onChange={(e) => setFormData(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">End Date <span className="text-gray-300 dark:text-gray-500">(opt)</span></label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              {editingId && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Notes <span className="text-gray-300 dark:text-gray-500">(optional)</span></label>
                <input type="text" value={formData.notes} onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">{editingId ? "Update" : "Add Investment"}</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Investment;