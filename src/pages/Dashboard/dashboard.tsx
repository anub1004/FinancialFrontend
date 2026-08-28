import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import { NavLink } from "react-router-dom";
import FeatureGate from "../../Component/FeatureGate";
import {
  Chart, BarController, BarElement, LinearScale, CategoryScale,
  DoughnutController, ArcElement, LineController, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from "chart.js";
import {
  TrendingUp, TrendingDown, Wallet, Target, Briefcase, ArrowUpCircle,
  ArrowDownCircle, Plus, Loader, ArrowRight,
} from "lucide-react";

Chart.register(
  BarController, BarElement, LinearScale, CategoryScale,
  DoughnutController, ArcElement, LineController, LineElement, PointElement,
  Tooltip, Legend, Filler,
);

// ── Types ─────────────────────────────────────────────────────────────
interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  totalInvested: number;
  investmentCurrentValue: number;
  investmentReturns: number;
  activeGoals: number;
  goalsCompleted: number;
  goalsInProgress: number;
  goalsTotalSaved: number;
  goalsTotalTarget: number;
  currency: string;
  month: number;
  year: number;
}

interface MonthlyTrend {
  month: number;
  year: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  icon: string;
  isPositive: boolean;
}

// ── Chart Colors ──────────────────────────────────────────────────────
const CHART_COLORS = [
  "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#6366f1", "#84cc16", "#f97316",
];

function Dashboard() {
  const { authState } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartInstance = useRef<Chart | null>(null);
  const catChartRef = useRef<HTMLCanvasElement>(null);
  const catChartInstance = useRef<Chart | null>(null);

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, catRes, actRes] = await Promise.all([
        fetch(`${ApiConfig.Api_Base_Url}api/dashboard/summary`, { credentials: "include", headers }),
        fetch(`${ApiConfig.Api_Base_Url}api/dashboard/monthly-trend`, { credentials: "include", headers }),
        fetch(`${ApiConfig.Api_Base_Url}api/dashboard/category-breakdown`, { credentials: "include", headers }),
        fetch(`${ApiConfig.Api_Base_Url}api/dashboard/recent-activity`, { credentials: "include", headers }),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (trendRes.ok) setTrends(await trendRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (actRes.ok) setActivities(await actRes.json());
    } catch { /* silently fail */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, []);

  // ── Monthly Trend Chart (Bar) ──────────────────────────────────────
  useEffect(() => {
    if (!trendChartRef.current || trends.length === 0) return;
    if (trendChartInstance.current) trendChartInstance.current.destroy();

    const isDark = document.documentElement.classList.contains("dark");

    trendChartInstance.current = new Chart(trendChartRef.current, {
      type: "bar",
      data: {
        labels: trends.map((t) => t.monthName),
        datasets: [
          {
            label: "Income",
            data: trends.map((t) => t.income),
            backgroundColor: "#10b981",
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: "Expense",
            data: trends.map((t) => t.expense),
            backgroundColor: "#ef4444",
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 12 } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#94a3b8" : "#64748b", font: { size: 11 } } },
          y: { grid: { color: isDark ? "#1e293b" : "#f1f5f9" }, ticks: { color: isDark ? "#94a3b8" : "#64748b", font: { size: 11 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` }, border: { display: false } },
        },
      },
    });
    return () => { trendChartInstance.current?.destroy(); };
  }, [trends]);

  // ── Category Breakdown Chart (Doughnut) ────────────────────────────
  useEffect(() => {
    if (!catChartRef.current || categories.length === 0) return;
    if (catChartInstance.current) catChartInstance.current.destroy();

    const isDark = document.documentElement.classList.contains("dark");

    catChartInstance.current = new Chart(catChartRef.current, {
      type: "doughnut",
      data: {
        labels: categories.map((c) => c.category),
        datasets: [{
          data: categories.map((c) => c.amount),
          backgroundColor: CHART_COLORS.slice(0, categories.length),
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.toLocaleString("en-IN")} (${categories[ctx.dataIndex]?.percentage ?? 0}%)` },
          },
        },
      },
    });
    return () => { catChartInstance.current?.destroy(); };
  }, [categories]);

  const fmt = (amount: number, currency: string = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (authState.loading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-violet-500 w-10 h-10" />
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Unauthorized Access</h1>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8" data-tour="dashboard-header">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, <span className="font-medium text-gray-700 dark:text-gray-200">{authState.user}</span>
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <NavLink to="/transaction" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Transaction
          </NavLink>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div data-tour="dashboard-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} iconBg="bg-emerald-100 dark:bg-emerald-900/30" label="Income" value={fmt(summary?.totalIncome ?? 0, summary?.currency)} valueColor="text-emerald-600 dark:text-emerald-400" />
        <SummaryCard icon={<TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />} iconBg="bg-red-100 dark:bg-red-900/30" label="Expenses" value={fmt(summary?.totalExpense ?? 0, summary?.currency)} valueColor="text-red-600 dark:text-red-400" />
        <SummaryCard icon={<Wallet className="w-5 h-5 text-violet-600 dark:text-violet-400" />} iconBg="bg-violet-100 dark:bg-violet-900/30" label="Net Balance"
          value={fmt(summary?.netBalance ?? 0, summary?.currency)}
          valueColor={(summary?.netBalance ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} />
        <FeatureGate feature="investment_tracking" fallback={
          <SummaryCard icon={<Briefcase className="w-5 h-5 text-gray-400" />} iconBg="bg-gray-100 dark:bg-gray-700" label="Investments"
            value="🔒 Basic+" valueColor="text-gray-400 dark:text-gray-500" />
        }>
          <SummaryCard icon={<Briefcase className="w-5 h-5 text-sky-600 dark:text-sky-400" />} iconBg="bg-sky-100 dark:bg-sky-900/30" label="Investments"
            value={fmt(summary?.investmentCurrentValue ?? 0, summary?.currency)}
            subtext={`${(summary?.investmentReturns ?? 0) >= 0 ? "+" : ""}${fmt(summary?.investmentReturns ?? 0)} returns`}
            subtextColor={(summary?.investmentReturns ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"} />
        </FeatureGate>
      </div>

      {/* ── Goals Quick Stats ── */}
      {(summary?.activeGoals ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30"><Target className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Active Goals</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{summary?.activeGoals ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Saved Toward Goals</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(summary?.goalsTotalSaved ?? 0)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30"><Target className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Goal Progress</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {((summary?.goalsTotalTarget ?? 0) > 0) ? Math.round(((summary?.goalsTotalSaved ?? 0) / (summary?.goalsTotalTarget ?? 1)) * 100) : 0}%
                  </div>
                </div>
              </div>
              <NavLink to="/goals" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></NavLink>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Monthly Income vs Expense Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Income vs Expenses</h2>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <div className="p-4" style={{ height: 320 }}>
            {trends.length > 0 ? (
              <canvas ref={trendChartRef} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No data yet. Add transactions to see trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Doughnut */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Spending by Category</h2>
          </div>
          <div className="p-4">
            {categories.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <canvas ref={catChartRef} />
                </div>
                {/* Legend */}
                <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto">
                  {categories.slice(0, 6).map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{c.category}</span>
                      </div>
                      <span className="text-gray-400 font-medium">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                <Wallet className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No expense data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Recent Activity</h2>
          <NavLink to="/transaction" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></NavLink>
        </div>
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {activities.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${
                    a.type === "Transaction"
                      ? (a.isPositive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30")
                      : a.type === "Investment"
                        ? "bg-sky-100 dark:bg-sky-900/30"
                        : "bg-violet-100 dark:bg-violet-900/30"
                  }`}>
                    {a.type === "Transaction" ? (
                      a.isPositive ? <ArrowUpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : a.type === "Investment" ? (
                      <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.title}</div>
                    <div className="text-xs text-gray-400">{a.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${a.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {a.isPositive ? "+" : "−"}{fmt(Math.abs(a.amount))}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No recent activity. Start adding transactions, investments, or goals!
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction to="/transaction" icon={<Wallet className="w-5 h-5" />} title="Transactions" desc="Track income & expenses" color="violet" />
        <FeatureGate feature="investment_tracking" fallback={
          <QuickAction to="/plans" icon={<Briefcase className="w-5 h-5" />} title="Investments 🔒" desc="Upgrade to Basic+ to unlock" color="sky" />
        }>
          <QuickAction to="/investment-monitoring" icon={<Briefcase className="w-5 h-5" />} title="Investments" desc="Monitor your portfolio" color="sky" />
        </FeatureGate>
        <QuickAction to="/goals" icon={<Target className="w-5 h-5" />} title="Goals" desc="Manage savings goals" color="emerald" />
      </div>
    </div>
  );
}

// ── Reusable Sub-Components ──────────────────────────────────────────

function SummaryCard({ icon, iconBg, label, value, valueColor, subtext, subtextColor }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; valueColor?: string;
  subtext?: string; subtextColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>{icon}</div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
          <div className={`text-lg font-bold ${valueColor || "text-gray-800 dark:text-gray-100"}`}>{value}</div>
          {subtext && <div className={`text-xs mt-0.5 ${subtextColor || "text-gray-400"}`}>{subtext}</div>}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, title, desc, color }: {
  to: string; icon: React.ReactNode; title: string; desc: string; color: string;
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/20",
    sky: "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20",
  };
  return (
    <NavLink to={to} className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${colors[color] || colors.violet}`}>
      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs opacity-70">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
    </NavLink>
  );
}

export default Dashboard;
