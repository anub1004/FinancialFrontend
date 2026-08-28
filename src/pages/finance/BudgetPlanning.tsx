import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  PiggyBank, Plus, X, Loader, TrendingUp, AlertCircle, ChevronRight
} from "lucide-react";
import FeatureGate from "../../Component/FeatureGate";

interface BudgetCategory {
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

const SAMPLE_BUDGETS: BudgetCategory[] = [
  { name: "Food & Dining", budgeted: 15000, spent: 8200, color: "#ef4444" },
  { name: "Transport", budgeted: 5000, spent: 3400, color: "#f59e0b" },
  { name: "Entertainment", budgeted: 3000, spent: 1800, color: "#8b5cf6" },
  { name: "Shopping", budgeted: 10000, spent: 12500, color: "#ec4899" },
  { name: "Utilities", budgeted: 4000, spent: 3800, color: "#0ea5e9" },
  { name: "Health", budgeted: 2000, spent: 500, color: "#10b981" },
];

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

function BudgetPlanning() {
  const { authState } = useAuth();
  const [budgets] = useState<BudgetCategory[]>(SAMPLE_BUDGETS);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.spent > b.budgeted).length;

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Budget Planning</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set monthly budgets and track spending by category</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Set Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <PiggyBank className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total Budget</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(totalBudgeted)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total Spent</div>
              <div className={`text-lg font-bold ${totalSpent > totalBudgeted ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmt(totalSpent)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Over Budget</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{overBudgetCount} categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category Budgets — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {budgets.map((b) => {
            const pct = Math.min(100, Math.round((b.spent / b.budgeted) * 100));
            const isOver = b.spent > b.budgeted;
            return (
              <div key={b.name} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${isOver ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}>
                      {fmt(b.spent)} / {fmt(b.budgeted)}
                    </span>
                    {isOver && <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">OVER</span>}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : ""}`}
                    style={{ width: `${pct}%`, backgroundColor: isOver ? undefined : b.color }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{pct}% used</span>
                  <span className="text-xs text-gray-400">{fmt(Math.max(0, b.budgeted - b.spent))} remaining</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Budget Usage</span>
          <span className={`text-sm font-bold ${totalSpent > totalBudgeted ? "text-red-600" : "text-emerald-600"}`}>
            {Math.round((totalSpent / totalBudgeted) * 100)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${totalSpent > totalBudgeted ? "bg-red-500" : "bg-violet-500"}`}
            style={{ width: `${Math.min(100, Math.round((totalSpent / totalBudgeted) * 100))}%` }} />
        </div>
      </div>
    </div>
  );
}

export default BudgetPlanning;
