import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import {
  Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, Trash2, Pencil, X,
  ChevronLeft, ChevronRight, Loader, TrendingUp, TrendingDown, Wallet, Calendar, Download
} from "lucide-react";
import FeatureGate from "../../Component/FeatureGate";
import UpgradePrompt from "../../Component/UpgradePrompt";

interface TransactionItem {
  transactionId: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  transactionType: number | string;
  transactionTypeName: string;
  currency: string;
  paymentMethod: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  currency: string;
  month: number;
  year: number;
}

interface CategoryItem {
  name: string;
  type: string;
  icon: string;
  isCustom: boolean;
}

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "NetBanking", "Wallet", "Cheque"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"];

// Helper: normalize enum value to "Income" or "Expense" regardless of API format (string or int)
const isIncome = (type: number | string): boolean => {
  if (typeof type === "string") return type === "Income" || type === "1";
  return type === 1;
};

function Transaction() {
  const { authState } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    transactionDate: new Date().toISOString().split("T")[0],
    transactionType: "Expense" as string, // Use string to match JsonStringEnumConverter
    currency: "INR",
    paymentMethod: "",
    isRecurring: false,
  });

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: "TransactionDate",
        sortOrder: "desc",
      });
      if (filterCategory) params.append("category", filterCategory);
      if (filterType) params.append("type", filterType);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(
        `${ApiConfig.Api_Base_Url}api/transactions?${params}`,
        { credentials: "include", headers }
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterType, searchQuery]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(
        `${ApiConfig.Api_Base_Url}api/transactions/summary`,
        { credentials: "include", headers }
      );
      if (res.ok) setSummary(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(
        `${ApiConfig.Api_Base_Url}api/transactions/categories`,
        { credentials: "include", headers }
      );
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchTransactions(); fetchSummary(); }, [page, filterCategory, filterType, searchQuery]);

  const resetForm = () => {
    setFormData({
      amount: "",
      category: "",
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
      transactionType: "Expense",
      currency: "INR",
      paymentMethod: "",
      isRecurring: false,
    });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (t: TransactionItem) => {
    setFormData({
      amount: t.amount.toString(),
      category: t.category,
      description: t.description,
      transactionDate: t.transactionDate.split("T")[0],
      transactionType: isIncome(t.transactionType) ? "Income" : "Expense",
      currency: t.currency,
      paymentMethod: t.paymentMethod || "",
      isRecurring: t.isRecurring,
    });
    setEditingId(t.transactionId);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      toast.error("Amount and category are required");
      return;
    }
    try {
      const url = editingId
        ? `${ApiConfig.Api_Base_Url}api/transactions/${editingId}`
        : `${ApiConfig.Api_Base_Url}api/transactions`;

      // Send enum as string ("Income"/"Expense") to match backend JsonStringEnumConverter
      const body = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        transactionDate: formData.transactionDate,
        transactionType: formData.transactionType,
        currency: formData.currency,
        paymentMethod: formData.paymentMethod || null,
        isRecurring: formData.isRecurring,
      };

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.title || "Failed");
      toast.success(editingId ? "Transaction updated!" : "Transaction added!");
      setShowModal(false);
      resetForm();
      fetchTransactions();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/transactions/${id}`, {
        method: "DELETE", credentials: "include", headers,
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Transaction deleted");
      fetchTransactions();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-violet-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your income and expenses</p>
        </div>
        <button
          onClick={openCreate}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Income</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalIncome, summary.currency)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Expense</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.totalExpense, summary.currency)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <Wallet className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Net Balance</div>
                <div className={`text-lg font-bold ${summary.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(summary.netBalance, summary.currency)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Transactions</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{summary.transactionCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters
                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-600 dark:text-violet-400"
                : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 flex flex-wrap gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
            {(filterType || filterCategory || searchQuery) && (
              <button
                onClick={() => { setFilterType(""); setFilterCategory(""); setSearchQuery(""); setPage(1); }}
                className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            All Transactions
          </h2>
          <span className="text-xs text-gray-400">{totalCount} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader className="animate-spin text-violet-500 w-8 h-8" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-6 py-3 text-left font-medium">Type</th>
                    <th className="px-6 py-3 text-left font-medium">Category</th>
                    <th className="px-6 py-3 text-left font-medium">Description</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Method</th>
                    <th className="px-6 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.map((t) => (
                    <tr key={t.transactionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        {isIncome(t.transactionType) ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <ArrowUpCircle className="w-4 h-4" /> Income
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                            <ArrowDownCircle className="w-4 h-4" /> Expense
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-800 dark:text-gray-100">{t.category}</span>
                        {t.isRecurring && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {t.description || "—"}
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold text-right ${
                        isIncome(t.transactionType)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {isIncome(t.transactionType) ? "+" : "−"}{formatCurrency(t.amount, t.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(t.transactionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.paymentMethod || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t.transactionId)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Page {page} of {totalPages} ({totalCount} items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4">
              <Wallet className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No transactions yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start tracking your income and expenses.</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
              <Plus className="w-4 h-4" />
              Add Your First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Export CSV — requires 'export_csv' (Basic+) */}
      <FeatureGate feature="export_csv" fallback={null}>
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              const csv = ["Type,Category,Description,Amount,Date,Method,Recurring",
                ...transactions.map(t => `${isIncome(t.transactionType) ? "Income" : "Expense"},${t.category},"${t.description}",${t.amount},${t.transactionDate.split("T")[0]},${t.paymentMethod || ""},${t.isRecurring}`)].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </FeatureGate>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type Toggle */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, transactionType: "Income" }))}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      formData.transactionType === "Income"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4 inline mr-1.5" />Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, transactionType: "Expense" }))}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      formData.transactionType === "Expense"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4 inline mr-1.5" />Expense
                  </button>
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select category...</option>
                  {categories
                    .filter((c) => c.type === "Both" || c.type === formData.transactionType)
                    .map((c) => (
                      <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g., Lunch at restaurant"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.transactionDate}
                    onChange={(e) => setFormData((f) => ({ ...f, transactionDate: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Payment</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Recurring — requires 'recurring_transactions' (Basic+) */}
              <FeatureGate feature="recurring_transactions" fallback={
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-sm text-gray-400 dark:text-gray-500">🔒 Recurring transactions</span>
                  <UpgradePrompt compact feature="recurring_transactions" />
                </div>
              }>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData((f) => ({ ...f, isRecurring: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">This is a recurring transaction</span>
                </label>
              </FeatureGate>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingId ? "Update Transaction" : "Add Transaction"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transaction;