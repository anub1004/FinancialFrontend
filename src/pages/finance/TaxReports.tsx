import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { TaxApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import {
  FileText, Loader, Download, Calendar, TrendingUp, IndianRupee,
  Plus, Pencil, Trash2, X, CheckCircle, Scale, ArrowRight
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
interface TaxEntryDto {
  taxEntryId: string;
  financialYear: string;
  category: string;
  description: string;
  amount: number;
  entryType: string;
  section: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaxSlabDetail {
  slab: string;
  rate: number;
  taxableAmount: number;
  tax: number;
}

interface TaxRegimeResult {
  regimeName: string;
  standardDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  stcgTax: number;
  ltcgTax: number;
  surcharge: number;
  healthEducationCess: number;
  rebate87A: number;
  totalTax: number;
  slabBreakdown: TaxSlabDetail[];
}

interface TaxComputationDto {
  financialYear: string;
  grossIncome: number;
  capitalGains: number;
  shortTermCapitalGains: number;
  longTermCapitalGains: number;
  totalDeductions: number;
  entries: TaxEntryDto[];
  newRegime: TaxRegimeResult;
  oldRegime: TaxRegimeResult;
  recommendedRegime: string;
  taxSaved: number;
}

// ── Constants ────────────────────────────────────────────────────────────
const ENTRY_TYPES = [
  { value: "income", label: "Income" },
  { value: "deduction", label: "Deduction" },
  { value: "capital_gain", label: "Capital Gain" },
];

const FY_OPTIONS = ["2025-26", "2024-25", "2023-24"];

const SECTIONS = ["", "80C", "80D", "80E", "80G", "80TTA", "10(14)", "HRA", "24(b)", "16(ia)"];

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

// ── Component ────────────────────────────────────────────────────────────
function TaxReports() {
  const { authState } = useAuth();
  const [entries, setEntries] = useState<TaxEntryDto[]>([]);
  const [computation, setComputation] = useState<TaxComputationDto | null>(null);
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    financialYear: "2025-26", category: "", description: "",
    amount: "", entryType: "income", section: "",
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async (fy: string) => {
    setLoading(true);
    try {
      const res = await fetch(TaxApiConfig.list(fy), { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn("Failed to load tax entries:", err);
      }
    } catch {
      toast.error("Failed to load tax entries");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComputation = useCallback(async (fy: string) => {
    setComputing(true);
    try {
      const res = await fetch(TaxApiConfig.compute(fy), { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setComputation(data);
      }
    } catch {
      /* computation is non-critical */
    } finally {
      setComputing(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(financialYear);
    fetchComputation(financialYear);
  }, [financialYear, fetchEntries, fetchComputation]);

  // ── Form helpers ───────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ financialYear, category: "", description: "", amount: "", entryType: "income", section: "" });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (e: TaxEntryDto) => {
    setFormData({
      financialYear: e.financialYear, category: e.category, description: e.description,
      amount: e.amount.toString(), entryType: e.entryType, section: e.section || "",
    });
    setEditingId(e.taxEntryId);
    setShowModal(true);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      toast.error("Category and amount are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? TaxApiConfig.byId(editingId) : TaxApiConfig.create;
      const body: Record<string, unknown> = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        entryType: formData.entryType,
      };
      if (!editingId) body.financialYear = formData.financialYear;
      if (formData.section) body.section = formData.section;

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
      toast.success(editingId ? "Entry updated!" : "Entry added!");
      setShowModal(false);
      resetForm();
      fetchEntries(financialYear);
      fetchComputation(financialYear);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tax entry?")) return;
    try {
      const res = await fetch(TaxApiConfig.byId(id), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Entry deleted");
      fetchEntries(financialYear);
      fetchComputation(financialYear);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const res = await fetch(TaxApiConfig.report(financialYear), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tax_Report_FY_${financialYear}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────
  const totalIncome = computation?.grossIncome ?? entries.filter(e => e.entryType === "income").reduce((s, e) => s + e.amount, 0);
  const totalCapitalGains = computation?.capitalGains ?? entries.filter(e => e.entryType === "capital_gain").reduce((s, e) => s + e.amount, 0);
  const totalDeductions = computation?.totalDeductions ?? entries.filter(e => e.entryType === "deduction").reduce((s, e) => s + e.amount, 0);
  const estimatedTax = computation?.newRegime?.totalTax ?? 0;

  const entryTypeColor = (type: string) => {
    switch (type) {
      case "income": return "text-emerald-600 dark:text-emerald-400";
      case "deduction": return "text-violet-600 dark:text-violet-400";
      case "capital_gain": return "text-sky-600 dark:text-sky-400";
      default: return "text-gray-600";
    }
  };

  const entryTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      income: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      deduction: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
      capital_gain: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
    };
    const labels: Record<string, string> = { income: "Income", deduction: "Deduction", capital_gain: "Capital Gain" };
    return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${styles[type] || ""}`}>{labels[type] || type}</span>;
  };

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Tax Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">FY {financialYear} • Tax-ready summaries with capital gains & deductions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <select value={financialYear} onChange={e => setFinancialYear(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none">
            {FY_OPTIONS.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
          </select>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
          <button onClick={handleDownloadReport} disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors">
            {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Gross Income</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalIncome)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Capital Gains</div>
              <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{fmt(totalCapitalGains)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Deductions</div>
              <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{fmt(totalDeductions)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Estimated Tax</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(estimatedTax)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income & Capital Gains */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Income & Capital Gains</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader className="animate-spin text-violet-500 w-6 h-6" /></div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {entries.filter(e => e.entryType !== "deduction").length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">No income entries yet</div>
              ) : entries.filter(e => e.entryType !== "deduction").map(e => (
                <div key={e.taxEntryId} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.category}</span>
                      {entryTypeBadge(e.entryType)}
                      {e.section && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">§{e.section}</span>}
                    </div>
                    {e.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{e.description}</div>}
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className={`text-sm font-semibold ${entryTypeColor(e.entryType)}`}>+{fmt(e.amount)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="p-1 text-gray-400 hover:text-violet-600 rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(e.taxEntryId)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deductions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Deductions</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader className="animate-spin text-violet-500 w-6 h-6" /></div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {entries.filter(e => e.entryType === "deduction").length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">No deductions yet</div>
              ) : entries.filter(e => e.entryType === "deduction").map(e => (
                <div key={e.taxEntryId} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.category}</span>
                      {e.section && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">§{e.section}</span>}
                    </div>
                    {e.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{e.description}</div>}
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">−{fmt(e.amount)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="p-1 text-gray-400 hover:text-violet-600 rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(e.taxEntryId)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Side-by-Side Regime Comparison ──────────────────────────────── */}
      {computation && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tax Regime Comparison — FY {financialYear}</h2>
            </div>
            {computation.taxSaved > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Save {fmt(computation.taxSaved)} with {computation.recommendedRegime === "new" ? "New" : "Old"} Regime</span>
              </div>
            )}
          </div>

          {computing ? (
            <div className="flex items-center justify-center py-12"><Loader className="animate-spin text-violet-500 w-6 h-6" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Regime */}
              {[
                { regime: computation.newRegime, label: "New Regime", key: "new" },
                { regime: computation.oldRegime, label: "Old Regime", key: "old" },
              ].map(({ regime, label, key }) => (
                <div key={key} className={`rounded-xl border-2 p-5 transition-all ${computation.recommendedRegime === key ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{label}</h3>
                    {computation.recommendedRegime === key && (
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full uppercase">Recommended</span>
                    )}
                  </div>

                  {/* Slab Breakdown */}
                  {regime.slabBreakdown && regime.slabBreakdown.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      {regime.slabBreakdown.map((slab, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">{slab.slab} @ {slab.rate}%</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{fmt(slab.tax)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Standard Deduction</span>
                      <span className="text-gray-700 dark:text-gray-300">{fmt(regime.standardDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Taxable Income</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{fmt(regime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Income Tax</span>
                      <span className="text-gray-700 dark:text-gray-300">{fmt(regime.incomeTax)}</span>
                    </div>
                    {regime.stcgTax > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">STCG Tax (20%)</span>
                        <span className="text-gray-700 dark:text-gray-300">{fmt(regime.stcgTax)}</span>
                      </div>
                    )}
                    {regime.ltcgTax > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">LTCG Tax (12.5%)</span>
                        <span className="text-gray-700 dark:text-gray-300">{fmt(regime.ltcgTax)}</span>
                      </div>
                    )}
                    {regime.rebate87A > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Rebate u/s 87A</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">−{fmt(regime.rebate87A)}</span>
                      </div>
                    )}
                    {regime.surcharge > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Surcharge</span>
                        <span className="text-gray-700 dark:text-gray-300">{fmt(regime.surcharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Health & Edu Cess (4%)</span>
                      <span className="text-gray-700 dark:text-gray-300">{fmt(regime.healthEducationCess)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Total Tax</span>
                      <span className={`text-sm font-bold ${computation.recommendedRegime === key ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {fmt(regime.totalTax)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tax Computation Summary (fallback when no computation) */}
      {!computation && entries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Tax Computation Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Gross Income</span><span className="font-medium text-gray-800 dark:text-gray-100">{fmt(totalIncome)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Capital Gains</span><span className="font-medium text-sky-600">+{fmt(totalCapitalGains)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total Deductions</span><span className="font-medium text-violet-600">−{fmt(totalDeductions)}</span></div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Taxable Income</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{fmt(totalIncome + totalCapitalGains - totalDeductions)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && entries.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No tax entries for FY {financialYear}. Add income, deductions, and capital gains to compute your tax.</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add First Entry
          </button>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editingId ? "Edit Tax Entry" : "Add Tax Entry"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Entry Type + FY */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entry Type *</label>
                  <select value={formData.entryType} onChange={e => setFormData({ ...formData, entryType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                    {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Financial Year</label>
                  <select value={formData.financialYear} onChange={e => setFormData({ ...formData, financialYear: e.target.value })}
                    disabled={!!editingId}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all disabled:opacity-50">
                    {FY_OPTIONS.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={formData.entryType === "income" ? "e.g. Salary" : formData.entryType === "deduction" ? "e.g. Section 80C" : "e.g. Short-term Capital Gains"} required />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder="e.g. Gross salary income" />
              </div>

              {/* Amount + Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹) *</label>
                  <input type="number" step="0.01" min="0.01" value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="150000" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                  <select value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                    <option value="">None</option>
                    {SECTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
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
                  {editingId ? "Update Entry" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaxReports;
