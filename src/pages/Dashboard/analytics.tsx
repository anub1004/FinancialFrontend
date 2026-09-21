import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import { exportToCsv } from "../../utils/csvExport";
import {
  Chart, BarController, BarElement, LinearScale, CategoryScale,
  DoughnutController, ArcElement, LineController, LineElement, PointElement,
  Tooltip, Legend, Filler, PieController,
} from "chart.js";
import {
  TrendingUp, TrendingDown, Wallet, Briefcase, Activity, Loader,
  RefreshCw, Download, ChevronDown, Target, PieChart, BarChart3,
  ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Smartphone,
  Building2, WalletCards, FileText, AlertTriangle, X, Filter as FilterIcon,
  Sparkles, Repeat, Store, Flame, RotateCcw, Info, Calendar as CalendarIcon,
} from "lucide-react";

Chart.register(
  BarController, BarElement, LinearScale, CategoryScale,
  DoughnutController, ArcElement, LineController, LineElement, PointElement,
  PieController, Tooltip, Legend, Filler,
);

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

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
}

interface InvestmentSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  overallReturnPercentage: number;
  activeCount: number;
  totalCount: number;
  currency: string;
  byType: { investmentType: string; totalInvested: number; totalCurrentValue: number; count: number }[];
}

interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  overallReturnPercentage: number;
  assetCount: number;
  currency: string;
  byType: { assetType: string; totalInvested: number; totalCurrentValue: number; allocationPercentage: number; count: number }[];
}

interface GoalItem {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string;
  status: string;
}

interface BudgetItem {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  estimated?: boolean;
}

const CHART_COLORS = [
  "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#6366f1", "#84cc16", "#f97316",
];

const GRADIENT_COLORS = {
  income: { start: "rgba(16,185,129,0.3)", end: "rgba(16,185,129,0.02)" },
  expense: { start: "rgba(239,68,68,0.3)", end: "rgba(239,68,68,0.02)" },
  savings: { start: "rgba(139,92,246,0.35)", end: "rgba(139,92,246,0.02)" },
  networth: { start: "rgba(14,165,233,0.3)", end: "rgba(14,165,233,0.02)" },
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  Cash: <Banknote className="w-4 h-4" />,
  UPI: <Smartphone className="w-4 h-4" />,
  Card: <CreditCard className="w-4 h-4" />,
  NetBanking: <Building2 className="w-4 h-4" />,
  Wallet: <WalletCards className="w-4 h-4" />,
  Cheque: <FileText className="w-4 h-4" />,
};

const PAYMENT_COLORS: Record<string, string> = {
  UPI: "#8b5cf6",
  Card: "#0ea5e9",
  Cash: "#10b981",
  NetBanking: "#f59e0b",
  Wallet: "#ec4899",
  Cheque: "#6366f1",
};

const fmt = (amount: number, currency: string = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const isExpenseTxn = (t: TransactionItem) => {
  const name = (t.transactionTypeName || "").toLowerCase();
  if (name) return name.includes("expense");
  return String(t.transactionType) === "1";
};

/* ═══════════════════════════════════════════════════════════════════════
   HEALTH SCORE (reuse from dashboard)
   ═══════════════════════════════════════════════════════════════════════ */

function computeHealthScore(s: DashboardSummary | null) {
  if (!s) return { score: 0, label: "N/A", color: "#9ca3af" };
  const savingsScore = (Math.min(Math.max(s.savingsRate, 0), 50) / 50) * 100;
  const netScore = s.netBalance >= 0
    ? Math.min(100, 60 + (s.totalIncome > 0 ? (s.netBalance / s.totalIncome) * 40 : 0))
    : Math.max(0, 30 + (s.totalExpense > 0 ? (s.netBalance / s.totalExpense) * 30 : 0));
  let investScore = 0;
  if (s.totalInvested > 0) {
    investScore = 60;
    if (s.investmentReturns > 0) investScore += Math.min(40, (s.investmentReturns / s.totalInvested) * 200);
    else if (s.investmentReturns < 0) investScore = Math.max(20, 60 + (s.investmentReturns / s.totalInvested) * 100);
  }
  const goalScore = (s.goalsTotalTarget ?? 0) > 0
    ? Math.min(100, ((s.goalsTotalSaved ?? 0) / (s.goalsTotalTarget ?? 1)) * 100)
    : (s.activeGoals ?? 0) > 0 ? 30 : 0;
  const score = Math.round(savingsScore * 0.35 + netScore * 0.25 + investScore * 0.20 + goalScore * 0.20);
  const clamped = Math.min(100, Math.max(0, score));
  const label = clamped >= 80 ? "Excellent" : clamped >= 60 ? "Good" : clamped >= 40 ? "Fair" : "Poor";
  const color = clamped >= 80 ? "#10b981" : clamped >= 60 ? "#22c55e" : clamped >= 40 ? "#f59e0b" : "#ef4444";
  return { score: clamped, label, color };
}

/* ═══════════════════════════════════════════════════════════════════════
   FORECAST HELPER (simple linear regression)
   ═══════════════════════════════════════════════════════════════════════ */

function linearForecast(values: number[], periodsAhead: number): number[] {
  const n = values.length;
  if (n < 2) return Array(periodsAhead).fill(values[0] ?? 0);
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const out: number[] = [];
  for (let i = 0; i < periodsAhead; i++) {
    const x = n + i;
    out.push(Math.max(0, Math.round(slope * x + intercept)));
  }
  return out;
}

function nextMonthNames(lastMonth: number, lastYear: number, count: number): string[] {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const out: string[] = [];
  let m = lastMonth, y = lastYear;
  for (let i = 0; i < count; i++) {
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    out.push(`${names[m - 1]}`);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════════════════ */

function useAnimatedValue(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

function Analytics() {
  const { authState } = useAuth();
  
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

 
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[] | null>(null);
  const [comparisonTrends, setComparisonTrends] = useState<MonthlyTrend[] | null>(null);

  // Filter / interaction state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showForecast, setShowForecast] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Chart refs
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartInstance = useRef<Chart | null>(null);
  const catChartRef = useRef<HTMLCanvasElement>(null);
  const catChartInstance = useRef<Chart | null>(null);
  const savingsChartRef = useRef<HTMLCanvasElement>(null);
  const savingsChartInstance = useRef<Chart | null>(null);
  const paymentChartRef = useRef<HTMLCanvasElement>(null);
  const paymentChartInstance = useRef<Chart | null>(null);
  const investAllocRef = useRef<HTMLCanvasElement>(null);
  const investAllocInstance = useRef<Chart | null>(null);
  const investPerfRef = useRef<HTMLCanvasElement>(null);
  const investPerfInstance = useRef<Chart | null>(null);
  const budgetChartRef = useRef<HTMLCanvasElement>(null);
  const budgetChartInstance = useRef<Chart | null>(null);
  const recurringChartRef = useRef<HTMLCanvasElement>(null);
  const recurringChartInstance = useRef<Chart | null>(null);
  const comparisonChartRef = useRef<HTMLCanvasElement>(null);
  const comparisonChartInstance = useRef<Chart | null>(null);
  const netWorthChartRef = useRef<HTMLCanvasElement>(null);
  const netWorthChartInstance = useRef<Chart | null>(null);

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
 let id=authState.userId;

  /* ─── FETCH ──────────────────────────────────────────────────────── */

  const fetchAll = useCallback(async (isRefresh = false) => {

    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError(null);
    try {
      const base = ApiConfig.Api_Base_Url;
      const [sumRes, trendRes, catRes, txRes, invRes, portRes, goalRes, budgetRes, cmpRes] = await Promise.all([
        fetch(`${base}api/dashboard/summary`, { credentials: "include", headers }),
        fetch(`${base}api/dashboard/monthly-trend?months=${months}`, { credentials: "include", headers }),
        fetch(`${base}api/dashboard/category-breakdown`, { credentials: "include", headers }),
        fetch(`${base}api/transactions?page=1&pageSize=200&sortBy=TransactionDate&sortOrder=desc`, { credentials: "include", headers }),
        fetch(`${base}api/investments/summary`, { credentials: "include", headers }).catch(() => null),
        fetch(`${base}api/portfolio/summary`, { credentials: "include", headers }).catch(() => null),
        fetch(`${base}api/goals`, { credentials: "include", headers }).catch(() => null),
        fetch(`${base}api/Budget/${id}`, { credentials: "include", headers }).catch(() => null),
        fetch(`${base}api/dashboard/monthly-trend?months=${months * 2}`, { credentials: "include", headers }).catch(() => null),
      ]);
      
     

      if (!sumRes.ok || !trendRes.ok) {
        setFetchError("We couldn't load some of your analytics data. Please try refreshing.");
      }

      if (sumRes.ok) setSummary(await sumRes.json());
      if (trendRes.ok) setTrends(await trendRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.items || []); }
      if (invRes?.ok) setInvestmentSummary(await invRes.json());
      if (portRes?.ok) setPortfolioSummary(await portRes.json());
      if (goalRes?.ok) {
        const gd = await goalRes.json();
       
        setGoals(Array.isArray(gd) ? gd : gd.items || []);
      }
      if (budgetRes?.ok) {
        const bd = await budgetRes.json();
   
        setBudgets(Array.isArray(bd) ? bd : bd.items || null);
      } else {
        setBudgets(null); // signals "no real budget API" -> fallback derived later
      }
      if (cmpRes?.ok) {
        const cd: MonthlyTrend[] = await cmpRes.json();
        setComparisonTrends(cd);
      } else {
        setComparisonTrends(null);
      }
    } catch {
      setFetchError("Something went wrong loading your analytics. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [months]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── FILTERED TRANSACTIONS (drives drilldown + client-side widgets) ─ */

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedPayment && (t.paymentMethod || "Other") !== selectedPayment) return false;
      if (customStart && new Date(t.transactionDate) < new Date(customStart)) return false;
      if (customEnd && new Date(t.transactionDate) > new Date(customEnd + "T23:59:59")) return false;
      return true;
    });
  }, [transactions, selectedCategory, selectedPayment, customStart, customEnd]);

  const hasActiveFilters = !!(selectedCategory || selectedPayment || customStart || customEnd);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedPayment(null);
    setCustomStart("");
    setCustomEnd("");
  };

  /* ─── DERIVED DATA ───────────────────────────────────────────────── */

  // Previous month comparison (from trends)
  const currentMonth = trends.length > 0 ? trends[trends.length - 1] : null;
  const prevMonth = trends.length > 1 ? trends[trends.length - 2] : null;

  const incomeChange = prevMonth && prevMonth.income > 0
    ? ((( currentMonth?.income ?? 0) - prevMonth.income) / prevMonth.income * 100) : 0;
  const expenseChange = prevMonth && prevMonth.expense > 0
    ? (((currentMonth?.expense ?? 0) - prevMonth.expense) / prevMonth.expense * 100) : 0;

  // Payment method breakdown (respects category/date filters, not its own filter)
  const paymentScopedTx = useMemo(
    () => transactions.filter(t => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (customStart && new Date(t.transactionDate) < new Date(customStart)) return false;
      if (customEnd && new Date(t.transactionDate) > new Date(customEnd + "T23:59:59")) return false;
      return true;
    }),
    [transactions, selectedCategory, customStart, customEnd]
  );
  const paymentBreakdown = paymentScopedTx.reduce<Record<string, number>>((acc, t) => {
    const method = t.paymentMethod || "Other";
    acc[method] = (acc[method] || 0) + t.amount;
    return acc;
  }, {});
  const paymentMethods = Object.entries(paymentBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const paymentTotal = paymentMethods.reduce((s, [, v]) => s + v, 0);

  // Daily average
  const daysInMonth = new Date(summary?.year ?? new Date().getFullYear(), summary?.month ?? new Date().getMonth() + 1, 0).getDate();
  const dailyAvgExpense = (summary?.totalExpense ?? 0) / Math.max(daysInMonth, 1);

  // Investment data for charts
  const invByType = investmentSummary?.byType ?? portfolioSummary?.byType?.map(b => ({
    investmentType: b.assetType,
    totalInvested: b.totalInvested,
    totalCurrentValue: b.totalCurrentValue,
    count: b.count,
  })) ?? [];

  // Health score
  const health = computeHealthScore(summary);

  // Recurring vs one-time spend
  const recurringSplit = useMemo(() => {
    const expenseTx = filteredTransactions.filter(isExpenseTxn);
    const recurring = expenseTx.filter(t => t.isRecurring).reduce((s, t) => s + t.amount, 0);
    const oneTime = expenseTx.filter(t => !t.isRecurring).reduce((s, t) => s + t.amount, 0);
    const total = recurring + oneTime;
    return { recurring, oneTime, total, recurringPct: total > 0 ? (recurring / total) * 100 : 0 };
  }, [filteredTransactions]);

  // Top merchants / descriptions
  const topMerchants = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    filteredTransactions.filter(isExpenseTxn).forEach(t => {
      const key = (t.description || "Unknown").trim() || "Unknown";
      const cur = map.get(key) || { amount: 0, count: 0 };
      cur.amount += t.amount;
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [filteredTransactions]);

  // Expense heatmap (current summary month, respects filters)
  const heatmapData = useMemo(() => {
    const year = summary?.year ?? new Date().getFullYear();
    const month = summary?.month ?? new Date().getMonth() + 1;
    const daysCount = new Date(year, month, 0).getDate();
    const totals = new Array(daysCount + 1).fill(0);
    filteredTransactions.filter(isExpenseTxn).forEach(t => {
      const d = new Date(t.transactionDate);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        totals[d.getDate()] += t.amount;
      }
    });
    const max = Math.max(1, ...totals.slice(1));
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    return { totals, max, daysCount, firstDayOfWeek, year, month };
  }, [filteredTransactions, summary?.year, summary?.month]);

  // Anomalies: transactions unusually large relative to their category
  const anomalies = useMemo(() => {
    const byCategory = new Map<string, number[]>();
    filteredTransactions.filter(isExpenseTxn).forEach(t => {
      const arr = byCategory.get(t.category) || [];
      arr.push(t.amount);
      byCategory.set(t.category, arr);
    });
    const flagged: TransactionItem[] = [];
    filteredTransactions.filter(isExpenseTxn).forEach(t => {
      const arr = byCategory.get(t.category) || [];
      if (arr.length < 4) return;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
      const std = Math.sqrt(variance);
      if (std > 0 && t.amount > mean + 2 * std) flagged.push(t);
    });
    return flagged.sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [filteredTransactions]);

  // Budgets: use real API data if present, else derive a suggested budget per category
  const effectiveBudgets: BudgetItem[] = useMemo(() => {
    if (budgets && budgets.length > 0) return budgets;
    return categories.slice(0, 8).map(c => ({
      category: c.category,
      spentAmount: c.amount,
      budgetAmount: Math.round(c.amount * 1.15),
      estimated: true,
    }));
  }, [budgets, categories]);
  const usingEstimatedBudgets = !budgets || budgets.length === 0;

  // Forecast (next 3 months, based on trailing trend)
  const forecastMonths = 3;
  const forecast = useMemo(() => {
    if (trends.length < 3) return null;
    const incomeForecast = linearForecast(trends.map(t => t.income), forecastMonths);
    const expenseForecast = linearForecast(trends.map(t => t.expense), forecastMonths);
    const last = trends[trends.length - 1];
    const labels = nextMonthNames(last.month, last.year, forecastMonths);
    return { incomeForecast, expenseForecast, labels };
  }, [trends]);

  // Period comparison (current window vs the window immediately before it)
  const periodComparison = useMemo(() => {
    if (!comparisonTrends || comparisonTrends.length < months * 2) return null;
    const prior = comparisonTrends.slice(0, comparisonTrends.length - months);
    const current = comparisonTrends.slice(comparisonTrends.length - months);
    const sum = (arr: MonthlyTrend[], key: "income" | "expense" | "net") => arr.reduce((s, t) => s + t[key], 0);
    return {
      prior: { income: sum(prior, "income"), expense: sum(prior, "expense"), net: sum(prior, "net") },
      current: { income: sum(current, "income"), expense: sum(current, "expense"), net: sum(current, "net") },
    };
  }, [comparisonTrends, months]);

  // Net worth trend (cumulative savings + current investment value; investment value assumed flat historically)
  const netWorthTrend = useMemo(() => {
    let cumulative = 0;
    const investVal = summary?.investmentCurrentValue ?? 0;
    return trends.map(t => {
      cumulative += t.net;
      return { label: t.monthName, savings: cumulative, investments: investVal, total: cumulative + investVal };
    });
  }, [trends, summary?.investmentCurrentValue]);

  // Auto-generated insights
  const insights = useMemo(() => {
    const list: { icon: React.ReactNode; text: string; tone: "positive" | "negative" | "neutral" }[] = [];
    if (prevMonth && Math.abs(expenseChange) > 5) {
      list.push({
        icon: expenseChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />,
        text: `Spending is ${expenseChange > 0 ? "up" : "down"} ${Math.abs(expenseChange).toFixed(0)}% vs last month`,
        tone: expenseChange > 0 ? "negative" : "positive",
      });
    }
    if (summary && summary.savingsRate < 20) {
      list.push({ icon: <AlertTriangle className="w-3.5 h-3.5" />, text: `Savings rate is ${summary.savingsRate.toFixed(0)}%, below the 20% target`, tone: "negative" });
    } else if (summary && summary.savingsRate >= 20) {
      list.push({ icon: <Sparkles className="w-3.5 h-3.5" />, text: `Savings rate of ${summary.savingsRate.toFixed(0)}% is on track`, tone: "positive" });
    }
    if (categories.length > 0) {
      const top = categories[0];
      list.push({ icon: <PieChart className="w-3.5 h-3.5" />, text: `${top.category} is your top spend at ${top.percentage}% of expenses`, tone: "neutral" });
    }
    if (recurringSplit.total > 0 && recurringSplit.recurringPct > 40) {
      list.push({ icon: <Repeat className="w-3.5 h-3.5" />, text: `${recurringSplit.recurringPct.toFixed(0)}% of spend is recurring/subscriptions`, tone: "neutral" });
    }
    if (anomalies.length > 0) {
      list.push({ icon: <AlertTriangle className="w-3.5 h-3.5" />, text: `${anomalies.length} unusually large transaction${anomalies.length > 1 ? "s" : ""} detected`, tone: "negative" });
    }
    const soonGoal = goals.find(g => {
      if (!g.deadline || g.status === "Completed") return false;
      const days = (new Date(g.deadline).getTime() - Date.now()) / 86400000;
      return days > 0 && days <= 30 && g.
currentAmount < g.targetAmount;
    });
    if (soonGoal) {
      list.push({ icon: <Target className="w-3.5 h-3.5" />, text: `"${soonGoal.name}" goal is due within 30 days`, tone: "negative" });
    }
    return list.slice(0, 6);
  }, [prevMonth, expenseChange, summary, categories, recurringSplit, anomalies, goals]);

  /* ─── CHART: Income vs Expense Trend (+ forecast overlay) ────────── */

  useEffect(() => {
    if (!trendChartRef.current || trends.length === 0) return;
    if (trendChartInstance.current) trendChartInstance.current.destroy();

    const ctx = trendChartRef.current.getContext("2d")!;
    const isDark = document.documentElement.classList.contains("dark");

    const incomeGrad = ctx.createLinearGradient(0, 0, 0, 320);
    incomeGrad.addColorStop(0, GRADIENT_COLORS.income.start);
    incomeGrad.addColorStop(1, GRADIENT_COLORS.income.end);
    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 320);
    expenseGrad.addColorStop(0, GRADIENT_COLORS.expense.start);
    expenseGrad.addColorStop(1, GRADIENT_COLORS.expense.end);

    const useForecast = showForecast && forecast;
    const labels = useForecast ? [...trends.map(t => t.monthName), ...forecast!.labels] : trends.map(t => t.monthName);
    const pad = (arr: number[]) => useForecast ? [...arr, ...Array(forecastMonths).fill(null)] : arr;
    const padFront = (arr: (number | null)[]) => useForecast ? [...Array(trends.length - 1).fill(null), trends[trends.length - 1].income, ...arr] : arr;

    const datasets: any[] = [
      {
        label: "Income",
        data: pad(trends.map(t => t.income)),
        borderColor: "#10b981",
        backgroundColor: incomeGrad,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: isDark ? "#1f2937" : "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
      {
        label: "Expenses",
        data: pad(trends.map(t => t.expense)),
        borderColor: "#ef4444",
        backgroundColor: expenseGrad,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: isDark ? "#1f2937" : "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ];

    if (useForecast) {
      datasets.push({
        label: "Income (forecast)",
        data: [...Array(trends.length - 1).fill(null), trends[trends.length - 1].income, ...forecast!.incomeForecast],
        borderColor: "#10b981",
        borderDash: [6, 4],
        borderWidth: 2,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: "#10b981",
        tension: 0.3,
      });
      datasets.push({
        label: "Expenses (forecast)",
        data: [...Array(trends.length - 1).fill(null), trends[trends.length - 1].expense, ...forecast!.expenseForecast],
        borderColor: "#ef4444",
        borderDash: [6, 4],
        borderWidth: 2,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: "#ef4444",
        tension: 0.3,
      });
    }

    trendChartInstance.current = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: true, position: "top", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 20, font: { size: 12, weight: "500" } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ctx.parsed.y == null ? "" : ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 11 } } },
          y: {
            grid: { color: isDark ? "#1e293b" : "#f1f5f9" },
            ticks: {
              color: isDark ? "#64748b" : "#94a3b8",
              font: { size: 11 },
              callback: (v: any) => `₹${(v / 1000).toFixed(0)}k`,
            },
          },
        },
      },
    });
    return () => { trendChartInstance.current?.destroy(); };
  }, [trends, showForecast, forecast]);

  /* ─── CHART: Category Doughnut (clickable for drilldown) ─────────── */

  useEffect(() => {
    if (!catChartRef.current || categories.length === 0) return;
    if (catChartInstance.current) catChartInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    catChartInstance.current = new Chart(catChartRef.current, {
      type: "doughnut",
      data: {
        labels: categories.map(c => c.category),
        datasets: [{
          data: categories.map(c => c.amount),
          backgroundColor: categories.map((c, i) =>
            selectedCategory && c.category !== selectedCategory ? `${CHART_COLORS[i % CHART_COLORS.length]}40` : CHART_COLORS[i % CHART_COLORS.length]
          ),
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        onClick: (_evt, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            const cat = categories[idx]?.category;
            setSelectedCategory(prev => prev === cat ? null : cat);
            setDrawerOpen(true);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.toLocaleString("en-IN")} (${categories[ctx.dataIndex]?.percentage ?? 0}%)` },
          },
        },
      },
    });
    return () => { catChartInstance.current?.destroy(); };
  }, [categories, selectedCategory]);

  /* ─── CHART: Monthly Net Savings (Area) ──────────────────────────── */

  useEffect(() => {
    if (!savingsChartRef.current || trends.length === 0) return;
    if (savingsChartInstance.current) savingsChartInstance.current.destroy();
    const ctx = savingsChartRef.current.getContext("2d")!;
    const isDark = document.documentElement.classList.contains("dark");

    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, GRADIENT_COLORS.savings.start);
    grad.addColorStop(1, GRADIENT_COLORS.savings.end);

    // Cumulative savings
    let cumulative = 0;
    const cumulativeData = trends.map(t => { cumulative += t.net; return cumulative; });

    savingsChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: trends.map(t => t.monthName),
        datasets: [{
          label: "Cumulative Savings",
          data: cumulativeData,
          borderColor: "#8b5cf6",
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: "#8b5cf6",
          pointBorderColor: isDark ? "#1f2937" : "#fff",
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 } } },
          y: {
            grid: { color: isDark ? "#1e293b" : "#f1f5f9" },
            ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` },
          },
        },
      },
    });
    return () => { savingsChartInstance.current?.destroy(); };
  }, [trends]);

  /* ─── CHART: Payment Method Bar (clickable for drilldown) ─────────── */

  useEffect(() => {
    if (!paymentChartRef.current || paymentMethods.length === 0) return;
    if (paymentChartInstance.current) paymentChartInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    paymentChartInstance.current = new Chart(paymentChartRef.current, {
      type: "bar",
      data: {
        labels: paymentMethods.map(([m]) => m),
        datasets: [{
          label: "Amount",
          data: paymentMethods.map(([, v]) => v),
          backgroundColor: paymentMethods.map(([m]) =>
            selectedPayment && m !== selectedPayment ? `${PAYMENT_COLORS[m] || "#6366f1"}40` : (PAYMENT_COLORS[m] || "#6366f1")
          ),
          borderRadius: 8,
          barPercentage: 0.6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        onClick: (_evt, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            const m = paymentMethods[idx]?.[0];
            setSelectedPayment(prev => prev === m ? null : m);
            setDrawerOpen(true);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.x.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: {
            grid: { color: isDark ? "#1e293b" : "#f1f5f9" },
            ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` },
          },
          y: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 11 } } },
        },
      },
    });
    return () => { paymentChartInstance.current?.destroy(); };
  }, [paymentMethods.length, transactions.length, selectedPayment]);

  /* ─── CHART: Investment Allocation Pie ────────────────────────────── */

  useEffect(() => {
    if (!investAllocRef.current || invByType.length === 0) return;
    if (investAllocInstance.current) investAllocInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    investAllocInstance.current = new Chart(investAllocRef.current, {
      type: "pie",
      data: {
        labels: invByType.map(i => i.investmentType),
        datasets: [{
          data: invByType.map(i => i.totalInvested),
          backgroundColor: CHART_COLORS.slice(0, invByType.length),
          borderWidth: 2,
          borderColor: isDark ? "#1f2937" : "#fff",
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.toLocaleString("en-IN")}` },
          },
        },
      },
    });
    return () => { investAllocInstance.current?.destroy(); };
  }, [invByType.length]);

  /* ─── CHART: Investment Performance (Grouped Bar) ────────────────── */

  useEffect(() => {
    if (!investPerfRef.current || invByType.length === 0) return;
    if (investPerfInstance.current) investPerfInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    investPerfInstance.current = new Chart(investPerfRef.current, {
      type: "bar",
      data: {
        labels: invByType.map(i => i.investmentType),
        datasets: [
          {
            label: "Invested",
            data: invByType.map(i => i.totalInvested),
            backgroundColor: "#8b5cf6",
            borderRadius: 6,
            barPercentage: 0.7,
          },
          {
            label: "Current Value",
            data: invByType.map(i => i.totalCurrentValue),
            backgroundColor: "#0ea5e9",
            borderRadius: 6,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 20, font: { size: 12, weight: "500" } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 11 } } },
          y: {
            grid: { color: isDark ? "#1e293b" : "#f1f5f9" },
            ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 11 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` },
          },
        },
      },
    });
    return () => { investPerfInstance.current?.destroy(); };
  }, [invByType.length]);

  /* ─── CHART: Budget vs Actual ─────────────────────────────────────── */

  useEffect(() => {
    if (!budgetChartRef.current || effectiveBudgets.length === 0) return;
    if (budgetChartInstance.current) budgetChartInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    budgetChartInstance.current = new Chart(budgetChartRef.current, {
      type: "bar",
      data: {
        labels: effectiveBudgets.map(b => b.category),
        datasets: [
          {
            label: "Spent",
            data: effectiveBudgets.map(b => b.spentAmount),
            backgroundColor: effectiveBudgets.map(b => b.spentAmount > b.budgetAmount ? "#ef4444" : "#8b5cf6"),
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: usingEstimatedBudgets ? "Suggested budget" : "Budget",
            data: effectiveBudgets.map(b => b.budgetAmount),
            backgroundColor: isDark ? "#475569" : "#cbd5e1",
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: true, position: "top", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ₹${ctx.parsed.x.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { color: isDark ? "#1e293b" : "#f1f5f9" }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` } },
          y: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 11 } } },
        },
      },
    });
    return () => { budgetChartInstance.current?.destroy(); };
  }, [effectiveBudgets, usingEstimatedBudgets]);

  /* ─── CHART: Recurring vs One-time ────────────────────────────────── */

  useEffect(() => {
    if (!recurringChartRef.current || recurringSplit.total === 0) return;
    if (recurringChartInstance.current) recurringChartInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    recurringChartInstance.current = new Chart(recurringChartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Recurring", "One-time"],
        datasets: [{
          data: [recurringSplit.recurring, recurringSplit.oneTime],
          backgroundColor: ["#f59e0b", "#0ea5e9"],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { position: "bottom", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.toLocaleString("en-IN")}` },
          },
        },
      },
    });
    return () => { recurringChartInstance.current?.destroy(); };
  }, [recurringSplit]);

  /* ─── CHART: Period Comparison ────────────────────────────────────── */

  useEffect(() => {
    if (!comparisonChartRef.current || !showComparison || !periodComparison) return;
    if (comparisonChartInstance.current) comparisonChartInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    comparisonChartInstance.current = new Chart(comparisonChartRef.current, {
      type: "bar",
      data: {
        labels: ["Income", "Expenses", "Net"],
        datasets: [
          {
            label: `Previous ${months}mo`,
            data: [periodComparison.prior.income, periodComparison.prior.expense, periodComparison.prior.net],
            backgroundColor: isDark ? "#475569" : "#cbd5e1",
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: `Current ${months}mo`,
            data: [periodComparison.current.income, periodComparison.current.expense, periodComparison.current.net],
            backgroundColor: "#8b5cf6",
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 11 } } },
          y: {
            grid: { color: isDark ? "#1e293b" : "#f1f5f9" },
            ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` },
          },
        },
      },
    });
    return () => { comparisonChartInstance.current?.destroy(); };
  }, [periodComparison, showComparison, months]);

  /* ─── CHART: Net Worth Trend ──────────────────────────────────────── */

  useEffect(() => {
    if (!netWorthChartRef.current || netWorthTrend.length === 0) return;
    if (netWorthChartInstance.current) netWorthChartInstance.current.destroy();
    const ctx = netWorthChartRef.current.getContext("2d")!;
    const isDark = document.documentElement.classList.contains("dark");

    const grad = ctx.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, GRADIENT_COLORS.networth.start);
    grad.addColorStop(1, GRADIENT_COLORS.networth.end);

    netWorthChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: netWorthTrend.map(p => p.label),
        datasets: [
          {
            label: "Net Worth (approx.)",
            data: netWorthTrend.map(p => p.total),
            borderColor: "#0ea5e9",
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: "#0ea5e9",
            pointBorderColor: isDark ? "#1f2937" : "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Cash Savings",
            data: netWorthTrend.map(p => p.savings),
            borderColor: "#8b5cf6",
            backgroundColor: "transparent",
            borderDash: [5, 4],
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", labels: { color: isDark ? "#cbd5e1" : "#475569", usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } } },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#fff",
            titleColor: isDark ? "#f1f5f9" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1, cornerRadius: 12, padding: 14,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 } } },
          y: {
            grid: { color: isDark ? "#1e293b" : "#f1f5f9" },
            ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { size: 10 }, callback: (v: any) => `₹${(v / 1000).toFixed(0)}k` },
          },
        },
      },
    });
    return () => { netWorthChartInstance.current?.destroy(); };
  }, [netWorthTrend]);

  /* ─── CSV EXPORT ─────────────────────────────────────────────────── */

  const handleExportReport = () => {
    const rows: string[][] = [];
    rows.push(["Metric", "Value"]);
    if (summary) {
      rows.push(["Total Income", fmt(summary.totalIncome, summary.currency)]);
      rows.push(["Total Expenses", fmt(summary.totalExpense, summary.currency)]);
      rows.push(["Net Balance", fmt(summary.netBalance, summary.currency)]);
      rows.push(["Savings Rate", `${summary.savingsRate.toFixed(1)}%`]);
      rows.push(["Transactions", summary.transactionCount.toString()]);
      rows.push(["Investments Value", fmt(summary.investmentCurrentValue, summary.currency)]);
      rows.push(["Investment Returns", fmt(summary.investmentReturns, summary.currency)]);
      rows.push(["Active Goals", (summary.activeGoals ?? 0).toString()]);
      rows.push(["Health Score", `${health.score}/100 (${health.label})`]);
      rows.push(["Recurring Spend %", `${recurringSplit.recurringPct.toFixed(1)}%`]);
    }
    rows.push([]);
    rows.push(["Month", "Income", "Expenses", "Net Savings"]);
    trends.forEach(t => rows.push([t.monthName, t.income.toString(), t.expense.toString(), t.net.toString()]));
    rows.push([]);
    rows.push(["Category", "Amount", "Percentage", "Count"]);
    categories.forEach(c => rows.push([c.category, c.amount.toString(), `${c.percentage}%`, c.count.toString()]));
    rows.push([]);
    rows.push(["Top Merchant", "Amount", "Count"]);
    topMerchants.forEach(m => rows.push([m.name, m.amount.toString(), m.count.toString()]));

    exportToCsv(`analytics_report_${new Date().toISOString().split("T")[0]}.csv`, rows[0], rows.slice(1));
  };

  /* ─── RENDER: SKELETON (initial load only) ───────────────────────── */

  if (authState.loading || loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto animate-pulse">
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <div>
            <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mt-2" />
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 lg:col-span-8 h-[380px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700" />
          <div className="col-span-12 lg:col-span-4 h-[380px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  /* ─── RENDER ─────────────────────────────────────────────────────── */

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

      {/* ═══ ERROR BANNER ═════════════════════════════════════════════ */}
      {fetchError && (
        <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button onClick={() => fetchAll()} className="inline-flex items-center gap-1 font-medium hover:underline flex-shrink-0">
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ═══ HEADER ═══════════════════════════════════════════════════ */}
      <div className="sm:flex sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive financial insights &amp; performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          {/* Period Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm transition-colors"
            >
              Last {months} months <ChevronDown className="w-4 h-4" />
            </button>
            {showPeriodMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                {[3, 6, 12].map(m => (
                  <button key={m} onClick={() => { setMonths(m); setShowPeriodMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${months === m ? "text-violet-600 dark:text-violet-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                    Last {m} months
                  </button>
                ))}
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                <button
                  onClick={() => { setShowCustomRange(v => !v); setShowPeriodMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 inline-flex items-center gap-2"
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Custom range…
                </button>
              </div>
            )}
          </div>
          <button onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ═══ STICKY FILTER BAR ════════════════════════════════════════ */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
            <FilterIcon className="w-3.5 h-3.5" /> Filters
          </div>

          <select
            value={selectedCategory ?? ""}
            onChange={e => { setSelectedCategory(e.target.value || null); if (e.target.value) setDrawerOpen(true); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
          </select>

          <select
            value={selectedPayment ?? ""}
            onChange={e => { setSelectedPayment(e.target.value || null); if (e.target.value) setDrawerOpen(true); }}
            className="text-xs px-7 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All payment methods</option>
            {Object.keys(paymentBreakdown).map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {showCustomRange && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
            </>
          )}

          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 ml-1 cursor-pointer">
            <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)} className="accent-violet-500" />
            Forecast
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={showComparison} onChange={e => setShowComparison(e.target.checked)} className="accent-violet-500" />
            Compare periods
          </label>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="text-xs text-gray-400 mt-2">
            Showing {filteredTransactions.length} of {transactions.length} transactions
            {selectedCategory && <> · category <b className="text-gray-600 dark:text-gray-300">{selectedCategory}</b></>}
            {selectedPayment && <> · payment <b className="text-gray-600 dark:text-gray-300">{selectedPayment}</b></>}
          </div>
        )}
      </div>

      {/* ═══ INSIGHTS STRIP ═══════════════════════════════════════════ */}
      {insights.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
          {insights.map((ins, i) => (
            <div key={i} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border whitespace-nowrap ${
              ins.tone === "positive" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300" :
              ins.tone === "negative" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300" :
              "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}>
              {ins.icon} {ins.text}
            </div>
          ))}
        </div>
      )}

      {/* ═══ ROW 1: KPI CARDS ═════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          label="Total Income"
          value={summary?.totalIncome ?? 0}
          currency={summary?.currency}
          change={incomeChange}
        />
        <KpiCard
          icon={<TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          label="Total Expenses"
          value={summary?.totalExpense ?? 0}
          currency={summary?.currency}
          change={expenseChange}
          invertChange
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          label="Net Savings"
          value={summary?.netBalance ?? 0}
          currency={summary?.currency}
          subtitle={`${(summary?.savingsRate ?? 0).toFixed(1)}% savings rate`}
        />
        <KpiCard
          icon={<Briefcase className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
          iconBg="bg-sky-100 dark:bg-sky-900/30"
          label="Investments"
          value={summary?.investmentCurrentValue ?? 0}
          currency={summary?.currency}
          subtitle={`${(summary?.investmentReturns ?? 0) >= 0 ? "+" : ""}${fmt(summary?.investmentReturns ?? 0)} ROI`}
          subtitleColor={(summary?.investmentReturns ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}
        />
        {/* Health Score Mini Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke={health.color} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - health.score / 100)}
                  transform="rotate(-90 22 22)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{health.score}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Health Score</div>
              <div className="text-lg font-bold" style={{ color: health.color }}>{health.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: PRIMARY CHARTS ════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Income vs Expenses Trend (+ forecast) */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Income vs Expenses</h2>
              {showForecast && forecast && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300">+{forecastMonths}mo forecast</span>
              )}
            </div>
            <span className="text-xs text-gray-400">Last {months} months</span>
          </div>
          <div className="p-4" style={{ height: 340 }}>
            {trends.length > 0 ? (
              <canvas ref={trendChartRef} />
            ) : (
              <EmptyState icon={<BarChart3 className="w-10 h-10" />} text="No trend data yet" />
            )}
          </div>
        </div>

        {/* Category Doughnut */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Spending Breakdown</h2>
            </div>
          </div>
          <div className="p-4">
            {categories.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <canvas ref={catChartRef} />
                </div>
                {/* Legend (clickable for drilldown) */}
               <div className="mt-4 space-y-2 max-h-[140px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {categories.slice(0, 8).map((c, i) => (
                    <button
                      key={c.category}
                      onClick={() => { setSelectedCategory(prev => prev === c.category ? null : c.category); setDrawerOpen(true); }}
                      className={`w-full flex items-center justify-between text-xs rounded-md px-1.5 py-1 -mx-1.5 transition-colors ${selectedCategory === c.category ? "bg-violet-50 dark:bg-violet-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{c.category}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{c.percentage}%</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={<PieChart className="w-10 h-10" />} text="No expense data" />
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: SECONDARY CHARTS ══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cumulative Savings */}
        <ChartCard title="Cumulative Savings" icon={<TrendingUp className="w-4 h-4 text-violet-500" />}>
          {trends.length > 0 ? (
            <div style={{ height: 220 }}>
              <canvas ref={savingsChartRef} />
            </div>
          ) : (
            <EmptyState icon={<TrendingUp className="w-10 h-10" />} text="No savings data" />
          )}
        </ChartCard>

        {/* Payment Methods */}
        <ChartCard title="Payment Methods" icon={<CreditCard className="w-4 h-4 text-violet-500" />}>
          {paymentMethods.length > 0 ? (
            <div style={{ height: 220 }}>
              <canvas ref={paymentChartRef} />
            </div>
          ) : (
            <EmptyState icon={<CreditCard className="w-10 h-10" />} text="No payment data" />
          )}
        </ChartCard>

        {/* Investment Allocation */}
        <ChartCard title="Investment Allocation" icon={<Briefcase className="w-4 h-4 text-violet-500" />}>
          {invByType.length > 0 ? (
            <div style={{ height: 220 }}>
              <canvas ref={investAllocRef} />
            </div>
          ) : (
            <EmptyState icon={<Briefcase className="w-10 h-10" />} text="No investment data" />
          )}
        </ChartCard>
      </div>

      {/* ═══ ROW 4: BUDGET, RECURRING, NET WORTH ══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Budget vs Actual</h2>
            </div>
            {usingEstimatedBudgets && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Info className="w-3 h-3" /> Auto-estimated — connect a budgets API for real targets
              </span>
            )}
          </div>
          <div className="p-4" style={{ height: 280 }}>
            {effectiveBudgets.length > 0 ? (
              <canvas ref={budgetChartRef} />
            ) : (
              <EmptyState icon={<Target className="w-10 h-10" />} text="No budget data" />
            )}
          </div>
        </div>

        <ChartCard title="Recurring vs One-time" icon={<Repeat className="w-4 h-4 text-violet-500" />}>
          {recurringSplit.total > 0 ? (
            <>
              <div style={{ height: 180 }}>
                <canvas ref={recurringChartRef} />
              </div>
              <div className="text-center text-xs text-gray-400 mt-2">
                {recurringSplit.recurringPct.toFixed(0)}% of spend is recurring
              </div>
            </>
          ) : (
            <EmptyState icon={<Repeat className="w-10 h-10" />} text="No spend data" />
          )}
        </ChartCard>
      </div>

      {/* ═══ ROW 5: NET WORTH + PERIOD COMPARISON ═════════════════════ */}
      <div className={`grid grid-cols-1 ${showComparison ? "lg:grid-cols-2" : ""} gap-6 mb-8`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Net Worth Trend</h2>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 ml-1">
                <Info className="w-3 h-3" /> approximate
              </span>
            </div>
          </div>
          <div className="p-4" style={{ height: 260 }}>
            {netWorthTrend.length > 0 ? (
              <canvas ref={netWorthChartRef} />
            ) : (
              <EmptyState icon={<TrendingUp className="w-10 h-10" />} text="No net worth data" />
            )}
          </div>
        </div>

        {showComparison && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Period Comparison</h2>
              </div>
            </div>
            <div className="p-4" style={{ height: 260 }}>
              {periodComparison ? (
                <canvas ref={comparisonChartRef} />
              ) : (
                <EmptyState icon={<BarChart3 className="w-10 h-10" />} text="Not enough history to compare" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ ROW 6: DATA INSIGHTS ═════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Spending Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Top Spending Categories</h2>
            </div>
            <span className="text-xs text-gray-400">This month</span>
          </div>
          <div className="p-5">
            {categories.length > 0 ? (
              <div className="space-y-4">
                {categories.slice(0, 6).map((c, i) => {
                  const maxAmt = categories[0]?.amount || 1;
                  return (
                    <button key={c.category} onClick={() => { setSelectedCategory(prev => prev === c.category ? null : c.category); setDrawerOpen(true); }} className="w-full text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.category}</span>
                          <span className="text-xs text-gray-400">({c.count} txn{c.count !== 1 ? "s" : ""})</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{fmt(c.amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${(c.amount / maxAmt) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<BarChart3 className="w-10 h-10" />} text="No categories yet" />
            )}
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Goal Progress</h2>
            </div>
            <span className="text-xs text-gray-400">{goals.filter(g => g.status === "Active" || g.status === "InProgress").length} active</span>
          </div>
          <div className="p-5">
            {goals.length > 0 ? (
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {goals.slice(0, 8).map(g => {
                  const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
             
                  const isComplete = pct >= 100;
                 

                  return (
                    <div key={g.goalId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{g.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{fmt(g.
currentAmount)} / {fmt(g.targetAmount)}</span>
                          <span className={`text-xs font-semibold ${isComplete ? "text-emerald-500" : "text-violet-500"}`}>{pct.toFixed(0)}%</span>
                          {
                            
                          }
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? "bg-emerald-500" : "bg-violet-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {g.deadline && (
                        <div className="text-xs text-gray-400 mt-1">
                          Due: {new Date(g.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Target className="w-10 h-10" />} text="No goals set yet" />
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROW 7: HEATMAP + TOP MERCHANTS ═══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Spending Heatmap</h2>
            </div>
            <span className="text-xs text-gray-400">{new Date(heatmapData.year, heatmapData.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
          </div>
          <div className="p-5">
            <HeatmapGrid data={heatmapData} />
          </div>
        </div>

        {/* Top Merchants */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Top Merchants</h2>
            </div>
          </div>
          <div className="p-5">
            {topMerchants.length > 0 ? (
              <div className="space-y-3.5">
                {topMerchants.map((m, i) => {
                  const maxAmt = topMerchants[0]?.amount || 1;
                  return (
                    <div key={m.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{m.name}</span>
                        <span className="text-xs text-gray-400">{m.count} txn{m.count !== 1 ? "s" : ""} · {fmt(m.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-violet-400" style={{ width: `${(m.amount / maxAmt) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Store className="w-10 h-10" />} text="No merchant data" />
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROW 8: UNUSUAL ACTIVITY ══════════════════════════════════ */}
      {anomalies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-800/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Unusual Activity</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {anomalies.map(t => (
              <div key={t.transactionId} className="px-6 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">{t.description || t.category}</div>
                  <div className="text-xs text-gray-400">{t.category} · {new Date(t.transactionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(t.amount, t.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ROW 9: INVESTMENT PERFORMANCE ════════════════════════════ */}
      {invByType.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Investment Performance by Type</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Invested
              </span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" /> Current
              </span>
            </div>
          </div>
          <div className="p-4" style={{ height: 320 }}>
            <canvas ref={investPerfRef} />
          </div>
        </div>
      )}

      {/* ═══ ROW 10: QUICK STATS FOOTER ═══════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Daily Avg Expense" value={fmt(dailyAvgExpense)} icon={<Wallet className="w-4 h-4 text-red-500" />} />
        <MiniStat label="Transactions" value={(summary?.transactionCount ?? 0).toString()} icon={<Activity className="w-4 h-4 text-violet-500" />} />
        <MiniStat label="Active Goals" value={(summary?.activeGoals ?? 0).toString()} icon={<Target className="w-4 h-4 text-emerald-500" />} />
        <MiniStat label="Investment Types" value={invByType.length.toString()} icon={<PieChart className="w-4 h-4 text-sky-500" />} />
      </div>

      {/* ═══ DRILLDOWN DRAWER ═════════════════════════════════════════ */}
      {drawerOpen && hasActiveFilters && (
        <TransactionDrawer
          transactions={filteredTransactions}
          onClose={() => setDrawerOpen(false)}
          onClearFilters={clearFilters}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function KpiCard({ icon, iconBg, label, value, currency = "INR", change, invertChange, subtitle, subtitleColor }: {
  icon: React.ReactNode; iconBg: string; label: string; value: number; currency?: string;
  change?: number; invertChange?: boolean; subtitle?: string; subtitleColor?: string;
}) {
  const animated = useAnimatedValue(Math.abs(value));
  const displayValue = value < 0 ? -animated : animated;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
          <div className={`text-lg font-bold truncate ${value >= 0 ? "text-gray-800 dark:text-gray-100" : "text-red-600 dark:text-red-400"}`}>
            {fmt(displayValue, currency)}
          </div>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-0.5 text-xs mt-0.5 ${
              (invertChange ? change <= 0 : change >= 0) ? "text-emerald-500" : "text-red-500"
            }`}>
              {(invertChange ? change <= 0 : change >= 0) ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}% vs last month
            </div>
          )}
          {subtitle && (
            <div className={`text-xs mt-0.5 ${subtitleColor || "text-gray-400"}`}>{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{title}</h2>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700/50">{icon}</div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-base font-bold text-gray-800 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-gray-400 dark:text-gray-500">
      <div className="opacity-30 mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function HeatmapGrid({ data }: { data: { totals: number[]; max: number; daysCount: number; firstDayOfWeek: number } }) {
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < data.firstDayOfWeek; i++) {
    cells.push(<div key={`pad-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= data.daysCount; day++) {
    const amt = data.totals[day] || 0;
    const intensity = amt / data.max;
    const bg = amt === 0
      ? "bg-gray-50 dark:bg-gray-700/40"
      : intensity > 0.75 ? "bg-red-500"
      : intensity > 0.5 ? "bg-orange-400"
      : intensity > 0.25 ? "bg-amber-300"
      : "bg-amber-100 dark:bg-amber-900/40";
    cells.push(
      <div key={day} title={`Day ${day}: ${fmt(amt)}`} className={`aspect-square rounded-md ${bg} flex items-center justify-center text-[9px] font-medium ${amt > 0 && intensity > 0.5 ? "text-white" : "text-gray-400 dark:text-gray-500"}`}>
        {day}
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-gray-400 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">{cells}</div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-gray-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-50 dark:bg-gray-700/40" />
        <div className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-900/40" />
        <div className="w-3 h-3 rounded-sm bg-amber-300" />
        <div className="w-3 h-3 rounded-sm bg-orange-400" />
        <div className="w-3 h-3 rounded-sm bg-red-500" />
        <span>More</span>
      </div>
    </div>
  );
}

function TransactionDrawer({ transactions, onClose, onClearFilters }: {
  transactions: TransactionItem[]; onClose: () => void; onClearFilters: () => void;
}) {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] sm:h-full bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-none shadow-xl max-h-[80vh] sm:max-h-none flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Filtered Transactions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{transactions.length} transactions · {fmt(total)} total</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {transactions.length > 0 ? transactions.map(t => (
            <div key={t.transactionId} className="px-5 py-3 flex items-center justify-between text-sm">
              <div className="min-w-0">
                <div className="font-medium text-gray-700 dark:text-gray-300 truncate">{t.description || t.category}</div>
                <div className="text-xs text-gray-400">{t.category} · {new Date(t.transactionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{t.isRecurring ? " · recurring" : ""}</div>
              </div>
              <span className={`font-semibold flex-shrink-0 ml-3 ${isExpenseTxn(t) ? "text-red-500" : "text-emerald-500"}`}>{fmt(t.amount, t.currency)}</span>
            </div>
          )) : (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No transactions match this filter</div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClearFilters} className="w-full text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
            Clear all filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default Analytics;