import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import {
  PiggyBank, Plus, X, Loader, TrendingUp, AlertTriangle, ChevronRight,
  Pencil, Trash2, Calendar, CheckCircle2, Download, RefreshCw,
  Sparkles, DollarSign, ArrowUpRight, Filter, Wallet, Receipt, CreditCard, ChevronDown
} from "lucide-react";

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  color: string;
  thresholdPct: number; // e.g. 80 for 80%
  notes?: string;
}

interface TransactionItem {
  transactionId: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  transactionType: number | string;
  paymentMethod?: string;
}

const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "1", name: "Food & Dining", budgeted: 15000, color: "#ef4444", thresholdPct: 80 },
  { id: "2", name: "Transport & Fuel", budgeted: 5000, color: "#f59e0b", thresholdPct: 80 },
  { id: "3", name: "Entertainment & Leisure", budgeted: 3500, color: "#8b5cf6", thresholdPct: 80 },
  { id: "4", name: "Shopping & Lifestyle", budgeted: 10000, color: "#ec4899", thresholdPct: 80 },
  { id: "5", name: "Utilities & Bills", budgeted: 6000, color: "#0ea5e9", thresholdPct: 90 },
  { id: "6", name: "Health & Medical", budgeted: 3000, color: "#10b981", thresholdPct: 80 },
  { id: "7", name: "Groceries & Essentials", budgeted: 12000, color: "#14b8a6", thresholdPct: 85 },
];

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#14b8a6", "#0ea5e9", "#6366f1", "#8b5cf6",
  "#ec4899", "#64748b"
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PAYMENT_METHODS = ["UPI", "Card", "Cash", "NetBanking", "Wallet", "Cheque"];

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function BudgetPlanning() {
  const { authState } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  
  const storageKey = `budget_plan_${authState.userId || "guest"}_${selectedYear}_${selectedMonth}`;
  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : DEFAULT_BUDGET_CATEGORIES;
  });

 
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setBudgets(JSON.parse(saved));
    } else {
      setBudgets(DEFAULT_BUDGET_CATEGORIES);
    }
  }, [storageKey]);

  const saveBudgetsToStorage = (newBudgets: BudgetCategory[]) => {
    setBudgets(newBudgets);
    localStorage.setItem(storageKey, JSON.stringify(newBudgets));
  };


  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "Food & Dining", "Transport & Fuel", "Entertainment & Leisure",
    "Shopping & Lifestyle", "Utilities & Bills", "Health & Medical",
    "Groceries & Essentials", "Education", "Rent & Housing", "Travel", "Investments"
  ]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  
  const fetchMonthlyExpenses = useCallback(async () => {
    setLoadingTx(true);
    try {
      const start = new Date(Date.UTC(selectedYear, selectedMonth, 1)).toISOString();
      const end = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0, 23, 59, 59)).toISOString();

      const url = `${ApiConfig.Api_Base_Url}api/transactions?fromDate=${encodeURIComponent(start)}&toDate=${encodeURIComponent(end)}&pageSize=500`;
      const res = await fetch(url, { credentials: "include", headers: getAuthHeaders() });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.items || []);
      }
    } catch {
   
    } finally {
      setLoadingTx(false);
    }
  }, [selectedMonth, selectedYear]);


  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/transactions/categories`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((c: { name: string }) => c.name);
          setCategoriesList(Array.from(new Set([...categoriesList, ...names])));
        }
      }
    } catch {
     
    }
  }, []);

  useEffect(() => {
    fetchMonthlyExpenses();
    fetchCategories();
  }, [fetchMonthlyExpenses, fetchCategories]);


  const isExpense = (t: TransactionItem) =>
    t.transactionType === "Expense" ||
    t.transactionType === 2 ||
    String(t.transactionType) === "2" ||
    String(t.transactionType).toLowerCase() === "expense";

  const getCategoryExpenses = (categoryName: string) => {
    const term = categoryName.toLowerCase().trim();
    const primaryWord = term.split(/[ &,/]/)[0];

    return transactions.filter(t => {
      if (!isExpense(t)) return false;
      const cat = (t.category || "").toLowerCase().trim();
      return cat === term || cat.includes(primaryWord) || term.includes(cat);
    });
  };


  const enrichedBudgets = useMemo(() => {
    return budgets.map(b => {
      const matchingExpenses = getCategoryExpenses(b.name);
      const spent = matchingExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      return {
        ...b,
        spent,
        expenseCount: matchingExpenses.length,
      };
    });
  }, [budgets, transactions]);

  const totalBudgeted = useMemo(() => enrichedBudgets.reduce((s, b) => s + b.budgeted, 0), [enrichedBudgets]);
  const totalSpent = useMemo(() => enrichedBudgets.reduce((s, b) => s + b.spent, 0), [enrichedBudgets]);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overBudgetCategories = useMemo(() => enrichedBudgets.filter(b => b.spent > b.budgeted), [enrichedBudgets]);
  const overallPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;

 
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  const [modalCategory, setModalCategory] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalColor, setModalColor] = useState(PRESET_COLORS[0]);
  const [modalThreshold, setModalThreshold] = useState(80);
  const [modalNotes, setModalNotes] = useState("");

  const openCreateBudget = () => {
    setEditingBudget(null);
    setModalCategory(categoriesList[0] || "Food & Dining");
    setModalAmount("5000");
    setModalColor(PRESET_COLORS[budgets.length % PRESET_COLORS.length]);
    setModalThreshold(80);
    setModalNotes("");
    setShowBudgetModal(true);
  };

  const openEditBudget = (b: BudgetCategory) => {
    setEditingBudget(b);
    setModalCategory(b.name);
    setModalAmount(String(b.budgeted));
    setModalColor(b.color);
    setModalThreshold(b.thresholdPct || 80);
    setModalNotes(b.notes || "");
    setShowBudgetModal(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(modalAmount);
    if (!modalCategory || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please provide a valid category and budget limit amount.");
      return;
    }

    if (editingBudget) {
      const updated = budgets.map(b =>
        b.id === editingBudget.id
          ? {
              ...b,
              name: modalCategory,
              budgeted: amountNum,
              color: modalColor,
              thresholdPct: modalThreshold,
              notes: modalNotes,
            }
          : b
      );
      saveBudgetsToStorage(updated);
      toast.success(`Updated budget for ${modalCategory}`);
    } else {
      if (budgets.some(b => b.name.toLowerCase() === modalCategory.toLowerCase())) {
        toast.error(`A budget for "${modalCategory}" already exists.`);
        return;
      }
      const newBudget: BudgetCategory = {
        id: Date.now().toString(),
        name: modalCategory,
        budgeted: amountNum,
        color: modalColor,
        thresholdPct: modalThreshold,
        notes: modalNotes,
      };
      saveBudgetsToStorage([...budgets, newBudget]);
      toast.success(`Created budget for ${modalCategory}`);
    }

    setShowBudgetModal(false);
  };

  const handleDeleteBudget = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the budget for "${name}"?`)) return;
    const updated = budgets.filter(b => b.id !== id);
    saveBudgetsToStorage(updated);
    toast.success(`Removed budget for ${name}`);
  };

  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("UPI");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const openAddExpenseForCategory = (catName: string) => {
    setExpenseCategory(catName);
    setExpenseAmount("");
    setExpenseDesc("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpensePaymentMethod("UPI");
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!expenseCategory || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid expense amount and category.");
      return;
    }

    setSubmittingExpense(true);
    try {
      const body = {
        amount: amountNum,
        category: expenseCategory,
        description: expenseDesc.trim() || `Expense for ${expenseCategory}`,
        transactionDate: new Date(expenseDate).toISOString(),
        transactionType: "Expense",
        currency: "INR",
        paymentMethod: expensePaymentMethod,
        isRecurring: false,
      };

      const res = await fetch(`${ApiConfig.Api_Base_Url}api/transactions`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to log expense");
      }

      toast.success(`₹${amountNum.toLocaleString("en-IN")} expense added to ${expenseCategory}!`);
      setShowExpenseModal(false);
      
      await fetchMonthlyExpenses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record expense");
    } finally {
      setSubmittingExpense(false);
    }
  };

  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleExportCSV = () => {
    const headers = ["Category", "Budgeted (INR)", "Spent (INR)", "Remaining (INR)", "% Used", "Status"];
    const rows = enrichedBudgets.map(b => [
      `"${b.name}"`,
      b.budgeted,
      b.spent,
      Math.max(0, b.budgeted - b.spent),
      `${Math.round((b.spent / b.budgeted) * 100)}%`,
      b.spent > b.budgeted ? "OVER BUDGET" : "NORMAL",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Budget_Plan_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Budget plan exported to CSV!");
  };

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-violet-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-6">
     
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Budget Planning
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set monthly category limits and log expenses directly to monitor spending in real-time.
          </p>
        </div>

      
        <div className="flex flex-wrap items-center gap-3">
          {/* Month & Year Picker */}
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-xs">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-transparent text-sm font-semibold border-0 text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx} className="bg-white dark:bg-gray-800">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-transparent text-sm font-semibold  border-0 text-gray-800 dark:text-gray-200 border-l border-gray-200 dark:border-gray-700 outline-none cursor-pointer"
            >
              {[2026, 2025, 2024, 2023].map(y => (
                <option key={y} value={y} className="bg-white dark:bg-gray-800">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            onClick={() => openAddExpenseForCategory(categoriesList[0] || "Food & Dining")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/50 shadow-xs transition-all"
          >
            <Receipt className="w-4 h-4" /> + Log Expense
          </button>

          <button
            onClick={openCreateBudget}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Set New Budget
          </button>
        </div>
      </div>

    
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Budget</div>
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">{fmt(totalBudgeted)}</div>
          <p className="text-xs text-gray-400 mt-1">{enrichedBudgets.length} allocated categories</p>
        </div>

       
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Spent</div>
            <div className={`p-2 rounded-xl ${totalSpent > totalBudgeted ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold mt-2 ${totalSpent > totalBudgeted ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>
            {fmt(totalSpent)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {overallPct}% spent ({transactions.filter(isExpense).length} logged expenses)
          </p>
        </div>

       
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Safe To Spend</div>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{fmt(totalRemaining)}</div>
          <p className="text-xs text-gray-400 mt-1">Remaining budget for {MONTH_NAMES[selectedMonth]}</p>
        </div>

    
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Budget Health</div>
            <div className={`p-2 rounded-xl ${overBudgetCategories.length > 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold mt-2 ${overBudgetCategories.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {overBudgetCategories.length > 0 ? `${overBudgetCategories.length} Over Limit` : "On Track"}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {overBudgetCategories.length > 0
              ? `${overBudgetCategories.map(c => c.name).join(", ")}`
              : "All categories within allocated limits"}
          </p>
        </div>
      </div>

    
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Monthly Budget Utilization ({MONTH_NAMES[selectedMonth]} {selectedYear})
            </span>
            {totalSpent > totalBudgeted && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                Budget Exceeded
              </span>
            )}
          </div>
          <span className={`text-sm font-bold ${totalSpent > totalBudgeted ? "text-red-600 dark:text-red-400" : "text-violet-600 dark:text-violet-400"}`}>
            {fmt(totalSpent)} of {fmt(totalBudgeted)} ({overallPct}%)
          </span>
        </div>

        <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              totalSpent > totalBudgeted ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-gradient-to-r from-violet-600 to-indigo-600"
            }`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

 
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-100">
              Category Budgets & Real-Time Tracking
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Click <strong>"+ Add Expense"</strong> to log money spent in any category, or click the row to view recorded expenses.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {enrichedBudgets.length} Categories
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
          {enrichedBudgets.map(b => {
            const spent = b.spent;
            const pct = b.budgeted > 0 ? Math.round((spent / b.budgeted) * 100) : 0;
            const isOver = spent > b.budgeted;
            const isWarning = !isOver && pct >= (b.thresholdPct || 80);
            const remaining = Math.max(0, b.budgeted - spent);
            const catExpenses = getCategoryExpenses(b.name);
            const isExpanded = expandedCategory === b.id;

            return (
              <div key={b.id} className="transition-colors">
                <div className="px-6 py-4.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 
                  <div
                    className="flex-1 space-y-2 cursor-pointer"
                    onClick={() => setExpandedCategory(isExpanded ? null : b.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: b.color }} />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{b.name}</span>
                        {isOver && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
                            OVER LIMIT
                          </span>
                        )}
                        {isWarning && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            NEAR LIMIT ({pct}%)
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold ${isOver ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200"}`}>
                          {fmt(spent)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">/ {fmt(b.budgeted)}</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : ""
                        }`}
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: isOver || isWarning ? undefined : b.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{pct}% utilized ({catExpenses.length} expense transactions)</span>
                      <span>{isOver ? `${fmt(spent - b.budgeted)} over budget` : `${fmt(remaining)} remaining`}</span>
                    </div>
                  </div>

                 
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pl-2">
                   
                    <button
                      onClick={() => openAddExpenseForCategory(b.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-xl border border-violet-200 dark:border-violet-800/60 shadow-2xs transition-all"
                      title={`Add expense to ${b.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Expense</span>
                    </button>

                    <button
                      onClick={() => openEditBudget(b)}
                      className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                      title="Edit category budget limit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteBudget(b.id, b.name)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title="Delete category budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : b.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-transform"
                      title="View recorded expenses"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

         
                {isExpanded && (
                  <div className="
                  dark:bg-gray-500 px-8 py-3.5 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-black uppercase tracking-wider">
                      <span>Logged Expenses for {b.name} ({catExpenses.length})</span>
                      <button
                        onClick={() => openAddExpenseForCategory(b.name)}
                        className="text-violet-800 hover:underline flex items-center gap-1 font-semibold normal-case"
                      >
                        <Plus className="w-3 h-3" /> Add new expense
                      </button>
                    </div>

                    {catExpenses.length === 0 ? (
                      <p className="text-xs text-black py-2">
                        No expenses logged for this category in {MONTH_NAMES[selectedMonth]} {selectedYear} yet. Click "+ Add Expense" to record a spend.
                      </p>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        {catExpenses.map(t => (
                          <div
                            key={t.transactionId}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <Receipt className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{t.description || b.name}</span>
                                <span className="text-[11px] text-gray-400 ml-2">
                                  {new Date(t.transactionDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {t.paymentMethod && (
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                                  {t.paymentMethod}
                                </span>
                              )}
                              <span className="font-bold text-red-600 dark:text-red-400">
                                -{fmt(Number(t.amount))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

     
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Log Expense
                  </h3>
                  <p className="text-xs text-gray-400">Category: {expenseCategory}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
            
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Budget Category *
                </label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                  required
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

         
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Expense Amount (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    placeholder="e.g. 850"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>

          
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description / Merchant
                </label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Dinner with friends, Petrol fill, Groceries"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

         
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={expensePaymentMethod}
                    onChange={e => setExpensePaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingExpense ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

   
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingBudget ? "Edit Category Budget Limit" : "Set New Category Budget"}
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
           
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Category Name *
                </label>
                <select
                  value={modalCategory}
                  onChange={e => setModalCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

           
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Monthly Budget Limit (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={modalAmount}
                    onChange={e => setModalAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                    required
                  />
                </div>
              </div>

     
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Warning Threshold Percentage
                  </label>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    {modalThreshold}% of budget
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={modalThreshold}
                  onChange={e => setModalThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>50% (Early warning)</span>
                  <span>80% (Recommended)</span>
                  <span>100% (Limit)</span>
                </div>
              </div>

      
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setModalColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        modalColor === c
                          ? "ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-gray-800 scale-110"
                          : "hover:scale-105 opacity-80"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

            
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  placeholder="e.g. Includes weekend dining and groceries"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {editingBudget ? "Save Changes" : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
