import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FileText, Loader, Download, Calendar, TrendingUp, IndianRupee
} from "lucide-react";

interface TaxItem {
  category: string;
  description: string;
  amount: number;
  type: "income" | "deduction" | "capital_gain";
}

const SAMPLE_TAX_DATA: TaxItem[] = [
  { category: "Salary", description: "Gross salary income", amount: 1200000, type: "income" },
  { category: "Rental Income", description: "Property rental income", amount: 180000, type: "income" },
  { category: "Interest", description: "Savings & FD interest", amount: 35000, type: "income" },
  { category: "Short-term Capital Gains", description: "Equity sold within 1 year", amount: 45000, type: "capital_gain" },
  { category: "Long-term Capital Gains", description: "Equity sold after 1 year", amount: 78000, type: "capital_gain" },
  { category: "Section 80C", description: "PPF, ELSS, LIC", amount: 150000, type: "deduction" },
  { category: "Section 80D", description: "Health insurance premium", amount: 25000, type: "deduction" },
  { category: "HRA Exemption", description: "House rent allowance", amount: 120000, type: "deduction" },
  { category: "Standard Deduction", description: "Flat deduction on salary", amount: 50000, type: "deduction" },
];

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

function TaxReports() {
  const { authState } = useAuth();
  const [taxData] = useState<TaxItem[]>(SAMPLE_TAX_DATA);
  const [financialYear] = useState("2025-26");

  const totalIncome = taxData.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalCapitalGains = taxData.filter(t => t.type === "capital_gain").reduce((s, t) => s + t.amount, 0);
  const totalDeductions = taxData.filter(t => t.type === "deduction").reduce((s, t) => s + t.amount, 0);
  const taxableIncome = totalIncome + totalCapitalGains - totalDeductions;

  // Simple new regime tax calculation
  const calculateTax = (income: number) => {
    if (income <= 300000) return 0;
    if (income <= 700000) return (income - 300000) * 0.05;
    if (income <= 1000000) return 20000 + (income - 700000) * 0.1;
    if (income <= 1200000) return 50000 + (income - 1000000) * 0.15;
    if (income <= 1500000) return 80000 + (income - 1200000) * 0.2;
    return 140000 + (income - 1500000) * 0.3;
  };

  const estimatedTax = calculateTax(taxableIncome);

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Tax Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">FY {financialYear} • Tax-ready summaries with capital gains & deductions</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
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

      {/* Income Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Income & Capital Gains</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {taxData.filter(t => t.type !== "deduction").map((t, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.category}</div>
                  <div className="text-xs text-gray-400">{t.description}</div>
                </div>
                <span className={`text-sm font-semibold ${t.type === "capital_gain" ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  +{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Deductions</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {taxData.filter(t => t.type === "deduction").map((t, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.category}</div>
                  <div className="text-xs text-gray-400">{t.description}</div>
                </div>
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">−{fmt(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tax Computation Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Tax Computation Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Gross Income</span><span className="font-medium text-gray-800 dark:text-gray-100">{fmt(totalIncome)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Capital Gains</span><span className="font-medium text-sky-600">+{fmt(totalCapitalGains)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total Deductions</span><span className="font-medium text-violet-600">−{fmt(totalDeductions)}</span></div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Taxable Income</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{fmt(taxableIncome)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-red-600 dark:text-red-400">Estimated Tax (New Regime)</span>
            <span className="font-bold text-red-600 dark:text-red-400">{fmt(estimatedTax)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxReports;
