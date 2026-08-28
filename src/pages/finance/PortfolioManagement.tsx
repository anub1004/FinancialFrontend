import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Briefcase, Loader, TrendingUp, TrendingDown, PieChart,
  BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface PortfolioAsset {
  name: string;
  type: string;
  invested: number;
  currentValue: number;
  allocation: number;
  color: string;
}

const SAMPLE_PORTFOLIO: PortfolioAsset[] = [
  { name: "Nifty 50 Index Fund", type: "Mutual Fund", invested: 200000, currentValue: 248000, allocation: 35, color: "#6366f1" },
  { name: "HDFC Bank", type: "Equity", invested: 80000, currentValue: 95000, allocation: 15, color: "#0ea5e9" },
  { name: "Sovereign Gold Bond", type: "Gold", invested: 50000, currentValue: 62000, allocation: 10, color: "#f59e0b" },
  { name: "PPF", type: "Fixed Income", invested: 150000, currentValue: 168000, allocation: 25, color: "#10b981" },
  { name: "US Equity Fund", type: "International", invested: 60000, currentValue: 55000, allocation: 10, color: "#ef4444" },
  { name: "Fixed Deposit", type: "Fixed Income", invested: 30000, currentValue: 32400, allocation: 5, color: "#8b5cf6" },
];

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

function PortfolioManagement() {
  const { authState } = useAuth();
  const [assets] = useState<PortfolioAsset[]>(SAMPLE_PORTFOLIO);

  const totalInvested = assets.reduce((s, a) => s + a.invested, 0);
  const totalCurrent = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalReturns = totalCurrent - totalInvested;
  const returnsPct = ((totalReturns / totalInvested) * 100).toFixed(1);

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Portfolio Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Advanced portfolio analysis with allocation & rebalancing</p>
        </div>
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
              <div className={`text-lg font-bold ${totalReturns >= 0 ? "text-emerald-600" : "text-red-600"}`}>{totalReturns >= 0 ? "+" : ""}{returnsPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Chart (visual bars) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Asset Allocation</h2>
        <div className="flex h-6 rounded-full overflow-hidden mb-4">
          {assets.map(a => (
            <div key={a.name} style={{ width: `${a.allocation}%`, backgroundColor: a.color }}
              className="transition-all duration-500 first:rounded-l-full last:rounded-r-full" title={`${a.type}: ${a.allocation}%`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {assets.map(a => (
            <div key={a.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{a.type} ({a.allocation}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Holdings</h2>
        </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {assets.map(a => {
                const pl = a.currentValue - a.invested;
                const plPct = ((pl / a.invested) * 100).toFixed(1);
                const isPositive = pl >= 0;
                return (
                  <tr key={a.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{a.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 text-right">{fmt(a.invested)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-100 text-right">{fmt(a.currentValue)}</td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      <span className="inline-flex items-center gap-1">
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isPositive ? "+" : ""}{fmt(pl)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {isPositive ? "+" : ""}{plPct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PortfolioManagement;
