import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  ShieldCheck,
  TrendingUp,
  Compass,
  Landmark,
  Sparkles,
  ArrowRight,
  DollarSign,
  Award,
  Zap,
  Plus,
  X,
  Calendar,
  Flame,
  Target,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export type MilestoneCategory =
  | "All"
  | "Emergency & Savings"
  | "Debt Elimination"
  | "Investing & Wealth"
  | "Tax & Protection"
  | "Life Milestones";

export interface FinancialMilestone {
  id: string;
  stageNumber: 1 | 2 | 3 | 4 | 5;
  stageName: string;
  title: string;
  subtitle: string;
  description: string;
  category: Exclude<MilestoneCategory, "All">;
  targetMetric: string;
  actionTip: string;
  appRoute?: string;
  appRouteLabel?: string;
  isCustom?: boolean;
}

export interface StageDefinition {
  number: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  accentColor: string;
  bgGradient: string;
}

const STAGES: StageDefinition[] = [
  {
    number: 1,
    name: "Foundation & Safety",
    tagline: "Build basic security and stop high-interest wealth destruction",
    accentColor: "from-amber-500 to-orange-500",
    bgGradient: "border-amber-500/30 dark:border-amber-500/20",
  },
  {
    number: 2,
    name: "Stability & Cushion",
    tagline: "Establish a resilient safety net and capture guaranteed returns",
    accentColor: "from-sky-500 to-indigo-500",
    bgGradient: "border-sky-500/30 dark:border-sky-500/20",
  },
  {
    number: 3,
    name: "Wealth Growth",
    tagline: "Maximize tax-advantaged compounding and build core investments",
    accentColor: "from-violet-500 to-purple-500",
    bgGradient: "border-violet-500/30 dark:border-violet-500/20",
  },
  {
    number: 4,
    name: "Acceleration & Scale",
    tagline: "Expand taxable wealth, passive income streams, and asset leverage",
    accentColor: "from-emerald-500 to-teal-500",
    bgGradient: "border-emerald-500/30 dark:border-emerald-500/20",
  },
  {
    number: 5,
    name: "Financial Freedom (FIRE)",
    tagline: "Reach work-optional independence, estate protection, and legacy",
    accentColor: "from-rose-500 to-pink-500",
    bgGradient: "border-rose-500/30 dark:border-rose-500/20",
  },
];

const INITIAL_MILESTONES: FinancialMilestone[] = [
  // STAGE 1: FOUNDATION & SAFETY
  {
    id: "m-starter-emergency",
    stageNumber: 1,
    stageName: "Foundation & Safety",
    title: "Starter Emergency Reserve ($1,000 - $2,500)",
    subtitle: "Protect against minor emergencies without using credit",
    description:
      "Stash $1,000 to $2,500 in a separate liquid savings account. This acts as a shock absorber so unexpected repairs or medical co-pays don't force you into high-interest debt.",
    category: "Emergency & Savings",
    targetMetric: "$1,000 - $2,500 Cash",
    actionTip: "Create an 'Emergency Fund' goal with weekly recurring micro-deposits.",
    appRoute: "/goals",
    appRouteLabel: "Set Emergency Goal",
  },
  {
    id: "m-baseline-budget",
    stageNumber: 1,
    stageName: "Foundation & Safety",
    title: "Establish Monthly Spending & Cashflow Baseline",
    subtitle: "Know exactly where every dollar is going each month",
    description:
      "Categorize all recurring expenses (housing, utilities, food, transport) and ensure you have positive monthly cash flow where expenses are less than net income.",
    category: "Debt Elimination",
    targetMetric: "Income > Expenses",
    actionTip: "Use Budget Planning to set category caps for dining, groceries, and entertainment.",
    appRoute: "/budget-planning",
    appRouteLabel: "Create Monthly Budget",
  },
  {
    id: "m-kill-toxic-debt",
    stageNumber: 1,
    stageName: "Foundation & Safety",
    title: "Eliminate High-Interest Toxic Debt (>8% APR)",
    subtitle: "Pay off credit cards, payday loans, and high-interest personal loans",
    description:
      "Compound interest working against you at 18-29% APR is a guaranteed wealth killer. Attack balances aggressively using the Debt Avalanche (highest APR first) or Snowball method.",
    category: "Debt Elimination",
    targetMetric: "$0 Credit Card Debt",
    actionTip: "Review transaction fees and interest charges in the Transactions ledger.",
    appRoute: "/transaction",
    appRouteLabel: "View Debt Transactions",
  },
  {
    id: "m-core-protection",
    stageNumber: 1,
    stageName: "Foundation & Safety",
    title: "Basic Insurance & Disaster Protection",
    subtitle: "Health, term life, and essential liability coverage",
    description:
      "Ensure catastrophic health and auto insurance are in place. If anyone depends on your income, secure level term life insurance (10-12x annual income) to shield loved ones.",
    category: "Tax & Protection",
    targetMetric: "Active Essential Policies",
    actionTip: "Log and audit your insurance recurring premiums in monthly expenses.",
    appRoute: "/budget-planning",
    appRouteLabel: "Audit Premiums",
  },

  // STAGE 2: STABILITY & CUSHION
  {
    id: "m-401k-match",
    stageNumber: 2,
    stageName: "Stability & Cushion",
    title: "Capture 100% Employer Retirement Match",
    subtitle: "Never leave free money on the table (instant 50%-100% return)",
    description:
      "Contribute enough to your employer 401(k), 403(b), or workplace plan to receive the maximum company match. This is an instant guaranteed return that beats almost any other investment.",
    category: "Investing & Wealth",
    targetMetric: "Full Employer Match %",
    actionTip: "Track your retirement deduction rate against your gross pay.",
    appRoute: "/investment-monitoring",
    appRouteLabel: "Track Retirement",
  },
  {
    id: "m-full-emergency",
    stageNumber: 2,
    stageName: "Stability & Cushion",
    title: "Full 3 to 6 Month Emergency Reserve",
    subtitle: "Complete insulation against job loss or medical hiatus",
    description:
      "Calculate 3 to 6 months of essential survival expenses and store in a dedicated High-Yield Savings Account (HYSA) earning competitive interest with capital preservation.",
    category: "Emergency & Savings",
    targetMetric: "3 - 6 Months Living Costs",
    actionTip: "Track liquid cash balances across all your linked bank accounts.",
    appRoute: "/manage-accounts",
    appRouteLabel: "Review Liquid Accounts",
  },
  {
    id: "m-moderate-debt",
    stageNumber: 2,
    stageName: "Stability & Cushion",
    title: "Pay Off Moderate-Interest Debt (5% - 8% APR)",
    subtitle: "Clear private student loans, car notes, and remaining personal loans",
    description:
      "Free up monthly cash flow by knocking out medium-rate loans. Once paid, the money previously tied up in debt payments flows directly into compounding investments.",
    category: "Debt Elimination",
    targetMetric: "0 Non-Mortgage Debt",
    actionTip: "Calculate freed-up monthly cash flow once car or student loan notes are cleared.",
    appRoute: "/analytics",
    appRouteLabel: "Analyze Cashflow",
  },
  {
    id: "m-credit-score-750",
    stageNumber: 2,
    stageName: "Stability & Cushion",
    title: "Achieve Excellent Credit Rating (750+)",
    subtitle: "Unlock premier mortgage rates, insurance discounts, and zero fees",
    description:
      "Keep credit utilization below 10%, pay all statements on autopay in full, and maintain account age. An elite credit score saves hundreds of thousands on mortgages and loans over a lifetime.",
    category: "Tax & Protection",
    targetMetric: "Credit Score 750+",
    actionTip: "Set spending limits and automatic freeze triggers on your Cards.",
    appRoute: "/cards",
    appRouteLabel: "Manage Card Controls",
  },

  // STAGE 3: WEALTH GROWTH
  {
    id: "m-hsa-max",
    stageNumber: 3,
    stageName: "Wealth Growth",
    title: "Maximize Health Savings Account (HSA)",
    subtitle: "The unmatched triple-tax-advantaged wealth weapon",
    description:
      "If enrolled in a high-deductible healthcare plan, max out your HSA. Contributions are tax-deductible, growth is tax-free, and withdrawals for healthcare are 100% tax-free forever.",
    category: "Tax & Protection",
    targetMetric: "Annual Maximum HSA ($4,150 / $8,300)",
    actionTip: "Invest HSA funds into low-cost index funds rather than leaving in cash.",
    appRoute: "/tax-reports",
    appRouteLabel: "Check Tax Deductions",
  },
  {
    id: "m-roth-ira-max",
    stageNumber: 3,
    stageName: "Wealth Growth",
    title: "Max Out Roth IRA or Traditional IRA ($7,000/yr)",
    subtitle: "Tax-free compounding growth and tax-free retirement withdrawals",
    description:
      "Contribute the annual ceiling to a Roth IRA (or Backdoor Roth if over income limits). Invested in low-cost total market index funds, this forms the bedrock of tax-free retirement wealth.",
    category: "Investing & Wealth",
    targetMetric: "Max Annual IRA Contribution",
    actionTip: "Monitor your annual investment rate in Portfolio Management.",
    appRoute: "/portfolio-management",
    appRouteLabel: "Review Portfolio",
  },
  {
    id: "m-first-100k",
    stageNumber: 3,
    stageName: "Wealth Growth",
    title: "Surpass the First $100,000 Invested",
    subtitle: "The hardest milestone — after $100k, compounding does the heavy lifting",
    description:
      "Charlie Munger famously observed that reaching $100,000 is the hardest part of wealth accumulation. At this point, annual market gains begin matching or exceeding your annual savings rate.",
    category: "Investing & Wealth",
    targetMetric: "$100,000 Invested Assets",
    actionTip: "Watch your net worth progression in the Analytics dashboard.",
    appRoute: "/analytics",
    appRouteLabel: "View Net Worth Curve",
  },
  {
    id: "m-home-downpayment",
    stageNumber: 3,
    stageName: "Wealth Growth",
    title: "Primary Residence Down Payment & Reserve",
    subtitle: "20% down payment to avoid PMI plus 3-5% closing cost reserve",
    description:
      "Save a dedicated 20% down payment to lock in fixed housing costs, avoid private mortgage insurance (PMI), and secure favorable 30-year fixed lending terms.",
    category: "Life Milestones",
    targetMetric: "20% Down Payment Goal",
    actionTip: "Create a dedicated 'Home Purchase Fund' in Goals with a target year.",
    appRoute: "/goals",
    appRouteLabel: "Track Home Goal",
  },

  // STAGE 4: ACCELERATION & SCALE
  {
    id: "m-brokerage-dca",
    stageNumber: 4,
    stageName: "Acceleration & Scale",
    title: "Automated Taxable Brokerage Dollar-Cost Averaging",
    subtitle: "Invest surplus cash flow beyond retirement limits every single month",
    description:
      "Automate recurring weekly or monthly investments into diversified broad-market ETFs (VTI/VXUS or equivalent). No retirement withdrawal age restrictions apply to taxable brokerage accounts.",
    category: "Investing & Wealth",
    targetMetric: "20%+ of Gross Income Invested",
    actionTip: "Set up automated recurring transactions to your investment accounts.",
    appRoute: "/investment-monitoring",
    appRouteLabel: "Monitor Holdings",
  },
  {
    id: "m-passive-income-cover",
    stageNumber: 4,
    stageName: "Acceleration & Scale",
    title: "Passive Income Covers 25% - 50% of Basic Living Costs",
    subtitle: "Dividends, rental profits, and yield start paying real life bills",
    description:
      "When your investment dividends, fixed-income yields, and real estate cashflows cover groceries, utilities, or rent, financial stress plummets and career flexibility skyrockets.",
    category: "Investing & Wealth",
    targetMetric: "Passive Yield > 25% of Expenses",
    actionTip: "Compare monthly passive returns against your total expenses.",
    appRoute: "/analytics",
    appRouteLabel: "Analyze Income vs Spend",
  },
  {
    id: "m-tax-loss-harvest",
    stageNumber: 4,
    stageName: "Acceleration & Scale",
    title: "Automate Tax-Loss Harvesting & Asset Location",
    subtitle: "Keep more of your returns through intelligent tax efficiency",
    description:
      "Place high-dividend and bond assets in tax-sheltered accounts, while placing high-growth equities in taxable brokerage. Harvest capital losses to offset ordinary income and gains.",
    category: "Tax & Protection",
    targetMetric: "Annual Tax Optimization Check",
    actionTip: "Generate comprehensive annual tax summaries and schedule reports.",
    appRoute: "/tax-reports",
    appRouteLabel: "Generate Tax Report",
  },
  {
    id: "m-estate-plan",
    stageNumber: 4,
    stageName: "Acceleration & Scale",
    title: "Comprehensive Estate Plan & Living Trust",
    subtitle: "Will, revocable living trust, healthcare directive, and power of attorney",
    description:
      "Protect your accumulated assets from probate court, unnecessary taxation, and family dispute by instituting legal trusts and named beneficiaries across all accounts.",
    category: "Tax & Protection",
    targetMetric: "Notarized Trust & Directives",
    actionTip: "Review and update account beneficiary designations annually.",
    appRoute: "/security",
    appRouteLabel: "Security & Account Audit",
  },

  // STAGE 5: FINANCIAL FREEDOM (FIRE)
  {
    id: "m-fire-25x",
    stageNumber: 5,
    stageName: "Financial Freedom (FIRE)",
    title: "Achieve the 25x Annual Expenses Milestone (FIRE Number)",
    subtitle: "Complete financial independence under the 4% Safe Withdrawal Rule",
    description:
      "Based on the Trinity Study, having 25 times your annual living expenses invested in a diversified portfolio historically provides a 95%+ probability of perpetual income for 30+ years without running out of money.",
    category: "Investing & Wealth",
    targetMetric: "Net Worth = 25 × Annual Spend",
    actionTip: "Model your safe withdrawal rate against your net worth in Analytics.",
    appRoute: "/analytics",
    appRouteLabel: "Review Financial Independence",
  },
  {
    id: "m-work-optional",
    stageNumber: 5,
    stageName: "Financial Freedom (FIRE)",
    title: "Transition to Work-Optional / Early Retirement",
    subtitle: "Spend your finite time solely on passions, health, and loved ones",
    description:
      "You no longer work for survival. Choose to consult part-time, start a mission-driven non-profit, travel the globe, or mentor others with zero fear of financial consequence.",
    category: "Life Milestones",
    targetMetric: "100% Time Autonomy",
    actionTip: "Use Audit Logs and Portfolio reports to monitor drawdown distributions.",
    appRoute: "/portfolio-management",
    appRouteLabel: "Portfolio Drawdown Plan",
  },
  {
    id: "m-generational-legacy",
    stageNumber: 5,
    stageName: "Financial Freedom (FIRE)",
    title: "Generational Wealth Transfer & Philanthropy",
    subtitle: "Leave an enduring legacy for your family and society",
    description:
      "Establish donor-advised funds (DAF), educational 529 plans for grandchildren, and structured wealth transfers that empower future generations while minimizing estate tax liabilities.",
    category: "Life Milestones",
    targetMetric: "Enduring Family & Community Impact",
    actionTip: "Review high-net-worth tax reports and multi-account asset consolidation.",
    appRoute: "/tax-reports",
    appRouteLabel: "Review Legacy Tax Strategy",
  },
];

const CATEGORIES: MilestoneCategory[] = [
  "All",
  "Emergency & Savings",
  "Debt Elimination",
  "Investing & Wealth",
  "Tax & Protection",
  "Life Milestones",
];

export default function Roadmap() {
  const [selectedStage, setSelectedStage] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Completed milestones state in localStorage
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("financial_roadmap_completed");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default checked starter milestones
    return {
      "m-starter-emergency": true,
      "m-baseline-budget": true,
    };
  });

  // Custom user milestones
  const [customMilestones, setCustomMilestones] = useState<FinancialMilestone[]>(() => {
    try {
      const saved = localStorage.getItem("financial_roadmap_custom");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Modals state
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  // New Custom Milestone Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<Exclude<MilestoneCategory, "All">>("Life Milestones");
  const [newStage, setNewStage] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newMetric, setNewMetric] = useState("");

  // Quiz state
  const [quizEmergency, setQuizEmergency] = useState<"none" | "starter" | "full">("starter");
  const [quizDebt, setQuizDebt] = useState<"high" | "moderate" | "none">("high");
  const [quizInvestRate, setQuizInvestRate] = useState<"0" | "match" | "max">("match");
  const [quizNetWorth, setQuizNetWorth] = useState<"building" | "sixfigures" | "fire">("building");

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("financial_roadmap_completed", JSON.stringify(completedMap));
    } catch {
      // ignore
    }
  }, [completedMap]);

  useEffect(() => {
    try {
      localStorage.setItem("financial_roadmap_custom", JSON.stringify(customMilestones));
    } catch {
      // ignore
    }
  }, [customMilestones]);

  const allMilestones = useMemo(() => {
    return [...INITIAL_MILESTONES, ...customMilestones];
  }, [customMilestones]);

  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      if (selectedStage !== "all" && m.stageNumber !== selectedStage) {
        return false;
      }
      if (selectedCategory !== "All" && m.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.targetMetric.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allMilestones, selectedStage, selectedCategory, searchQuery]);

  // Calculations for progress and current stage
  const stats = useMemo(() => {
    const total = allMilestones.length;
    const completedCount = allMilestones.filter((m) => !!completedMap[m.id]).length;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Determine current focus stage based on first incomplete milestone
    const firstIncomplete = allMilestones.find((m) => !completedMap[m.id]);
    const currentStageNumber = firstIncomplete ? firstIncomplete.stageNumber : 5;
    const currentStageObj = STAGES.find((s) => s.number === currentStageNumber) || STAGES[0];

    return {
      total,
      completedCount,
      percent,
      currentStageNumber,
      currentStageName: currentStageObj.name,
      nextStepTitle: firstIncomplete ? firstIncomplete.title : "All Milestones Completed!",
      nextStepRoute: firstIncomplete?.appRoute || "/dashboard",
    };
  }, [allMilestones, completedMap]);

  const toggleMilestone = (id: string, title: string) => {
    const wasCompleted = !!completedMap[id];
    setCompletedMap((prev) => ({ ...prev, [id]: !wasCompleted }));

    if (!wasCompleted) {
      toast.success(`Milestone achieved: "${title}"!`, {
        icon: "🏆",
        style: {
          borderRadius: "12px",
          background: "#0f172a",
          color: "#fff",
        },
      });
    } else {
      toast("Milestone marked as in progress", {
        icon: "↩️",
      });
    }
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a title for your milestone.");
      return;
    }

    const stageObj = STAGES.find((s) => s.number === newStage);
    const newId = `custom-${Date.now()}`;
    const newM: FinancialMilestone = {
      id: newId,
      stageNumber: newStage,
      stageName: stageObj ? stageObj.name : "Custom Stage",
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || "Personalized Financial Goal",
      description: newDesc.trim() || "Custom target milestone added to your personal wealth roadmap.",
      category: newCategory,
      targetMetric: newMetric.trim() || "Custom Target",
      actionTip: "Track this goal in your financial plans and review regularly.",
      appRoute: "/goals",
      appRouteLabel: "Open Goals",
      isCustom: true,
    };

    setCustomMilestones((prev) => [newM, ...prev]);
    setCustomModalOpen(false);
    setNewTitle("");
    setNewSubtitle("");
    setNewDesc("");
    setNewMetric("");
    toast.success("Added new milestone to your roadmap!", { icon: "🎯" });
  };

  const handleApplyQuiz = () => {
    let suggestedStage: 1 | 2 | 3 | 4 | 5 = 1;

    if (quizDebt === "high" || quizEmergency === "none") {
      suggestedStage = 1;
    } else if (quizEmergency === "starter" || quizDebt === "moderate") {
      suggestedStage = 2;
    } else if (quizInvestRate === "match" || quizNetWorth === "building") {
      suggestedStage = 3;
    } else if (quizNetWorth === "sixfigures") {
      suggestedStage = 4;
    } else {
      suggestedStage = 5;
    }

    setSelectedStage(suggestedStage);
    setQuizModalOpen(false);
    toast.success(`Recommended: Focus on Stage ${suggestedStage}! Filter applied.`, {
      icon: "🧭",
      duration: 4000,
    });
  };

  const getCategoryBadge = (cat: Exclude<MilestoneCategory, "All">) => {
    switch (cat) {
      case "Emergency & Savings":
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20">
            Emergency & Savings
          </span>
        );
      case "Debt Elimination":
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20">
            Debt Elimination
          </span>
        );
      case "Investing & Wealth":
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
            Investing & Wealth
          </span>
        );
      case "Tax & Protection":
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
            Tax & Protection
          </span>
        );
      case "Life Milestones":
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
            Life Milestones
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* ========================================================================= */}
      {/* HERO SECTION & PROGRESS DASHBOARD */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-indigo-500/20 mb-8">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              PERSONAL WEALTH & FINANCIAL FREEDOM BLUEPRINT
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuizModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-violet-300" />
                Where Do I Stand? Quiz
              </button>
              <button
                onClick={() => setCustomModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" />
                Add Life Milestone
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Financial Freedom <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-sky-300 to-emerald-400">Roadmap</span>
          </h1>
          <p className="text-slate-300 max-w-3xl text-sm sm:text-base leading-relaxed mb-6">
            Your step-by-step master plan from emergency safety and debt freedom to multimillion-dollar investing and total work-optional independence. Check off milestones as you achieve them!
          </p>

          {/* Current Journey Status Bar */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Current Wealth Phase
                </div>
                <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  Stage {stats.currentStageNumber}: {stats.currentStageName}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                    Completed Milestones
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                    {stats.completedCount} <span className="text-sm font-normal text-slate-400">/ {stats.total} ({stats.percent}%)</span>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                    Next Recommended Step
                  </div>
                  <Link
                    to={stats.nextStepRoute}
                    className="text-xs font-bold text-violet-300 hover:text-white flex items-center justify-end gap-1 group"
                  >
                    <span className="max-w-[180px] truncate">{stats.nextStepTitle}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Visual Overall Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden border border-white/10">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 transition-all duration-700 shadow-lg"
                style={{ width: `${Math.max(5, stats.percent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAGE TABS NAVIGATOR (STAGES 1 - 5) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
        <button
          onClick={() => setSelectedStage("all")}
          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
            selectedStage === "all"
              ? "bg-violet-600 text-white border-violet-500 shadow-md ring-2 ring-violet-400/30"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-violet-300"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">
            Full Journey
          </div>
          <div className="text-xs font-black truncate">All 5 Stages</div>
          <div className="text-[11px] opacity-80 mt-1">{allMilestones.length} Total Targets</div>
        </button>

        {STAGES.map((stg) => {
          const stageItems = allMilestones.filter((m) => m.stageNumber === stg.number);
          const stageDone = stageItems.filter((m) => !!completedMap[m.id]).length;
          const isSelected = selectedStage === stg.number;

          return (
            <button
              key={stg.number}
              onClick={() => setSelectedStage(stg.number)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-slate-900 text-white border-violet-500 shadow-md ring-2 ring-violet-400/30 dark:bg-slate-800"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-violet-300"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-0.5">
                Stage {stg.number}
              </div>
              <div className="text-xs font-black truncate">{stg.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{stageDone}/{stageItems.length} Done</span>
                {stageDone === stageItems.length && stageItems.length > 0 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* CONTROLS: SEARCH & CATEGORY CHIPS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700/60 p-4 mb-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search financial milestones (e.g. emergency, debt, Roth IRA, 401k, home)..."
              className="w-full pl-3.5 pr-9 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MILESTONES BY STAGE */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        {(selectedStage === "all" ? [1, 2, 3, 4, 5] : [selectedStage]).map((stageNum) => {
          const stageDef = STAGES.find((s) => s.number === stageNum);
          const stageItems = filteredMilestones.filter((m) => m.stageNumber === stageNum);

          if (stageItems.length === 0) return null;

          const stageDoneCount = stageItems.filter((m) => !!completedMap[m.id]).length;
          const isAllStageDone = stageDoneCount === stageItems.length;

          return (
            <div key={stageNum} className="relative">
              {/* Stage Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-sm shadow-md">
                    {stageNum}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      Stage {stageNum}: {stageDef?.name}
                      {isAllStageDone && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Stage Cleared
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stageDef?.tagline}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {stageDoneCount} of {stageItems.length} completed
                </div>
              </div>

              {/* Milestones Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stageItems.map((milestone) => {
                  const isDone = !!completedMap[milestone.id];

                  return (
                    <div
                      key={milestone.id}
                      className={`group relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 shadow-xs ${
                        isDone
                          ? "bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-400/40 dark:border-emerald-500/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Card Header: Checkbox + Badges */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <button
                            onClick={() => toggleMilestone(milestone.id, milestone.title)}
                            className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none group/check"
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                isDone
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                  : "border-2 border-slate-300 dark:border-slate-600 group-hover/check:border-violet-500 text-transparent"
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isDone
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              {isDone ? "Completed" : "In Progress"}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {getCategoryBadge(milestone.category)}
                            {milestone.isCustom && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-600 dark:text-violet-300">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <h3
                          className={`text-base font-bold mb-1 transition-colors ${
                            isDone
                              ? "text-slate-700 dark:text-slate-200 line-through opacity-85"
                              : "text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400"
                          }`}
                        >
                          {milestone.title}
                        </h3>
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2">
                          {milestone.subtitle}
                        </p>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                          {milestone.description}
                        </p>

                        {/* Action Tip */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-700/50">
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Action Strategy:
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {milestone.actionTip}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer: Target Metric + Direct In-App Link */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Target className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{milestone.targetMetric}</span>
                        </div>

                        {milestone.appRoute && (
                          <Link
                            to={milestone.appRoute}
                            className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                          >
                            <span>{milestone.appRouteLabel || "Take Action"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* FINANCIAL STAGE DIAGNOSTIC QUIZ MODAL */}
      {/* ========================================================================= */}
      {quizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setQuizModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-2">
              <Compass className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Self Assessment</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Find Your Current Financial Stage
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
              Answer four quick questions about your current accounts and we will calculate which stage of wealth building you should focus on today.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Do you have a starter emergency fund?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setQuizEmergency("none")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizEmergency === "none"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Less than $1k
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizEmergency("starter")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizEmergency === "starter"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    $1,000 - $3,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizEmergency("full")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizEmergency === "full"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    3-6 Months Full
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. What is your non-mortgage debt status?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setQuizDebt("high")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizDebt === "high"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Have Credit Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizDebt("moderate")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizDebt === "moderate"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Car / Student Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizDebt("none")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizDebt === "none"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    100% Debt Free
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Are you currently investing monthly?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setQuizInvestRate("0")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizInvestRate === "0"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Not Yet
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizInvestRate("match")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizInvestRate === "match"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Employer Match Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizInvestRate("max")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizInvestRate === "max"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Maxing Out IRA/401k
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. Approximate total invested wealth?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setQuizNetWorth("building")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizNetWorth === "building"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Under $50,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizNetWorth("sixfigures")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizNetWorth === "sixfigures"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    $100k - $500k
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizNetWorth("fire")}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      quizNetWorth === "fire"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    $500k+ / Near FIRE
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700 mt-5">
              <button
                type="button"
                onClick={() => setQuizModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyQuiz}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-500 hover:to-indigo-500 cursor-pointer"
              >
                Calculate My Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CUSTOM LIFE MILESTONE MODAL */}
      {/* ========================================================================= */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setCustomModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Custom Target</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Add Personal Life Milestone
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
              Customize your wealth roadmap with goals unique to your journey, such as buying a home, launching a business, or paying for college.
            </p>

            <form onSubmit={handleAddCustomMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Purchase 3-Bedroom Home or Kids 529 College Fund"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Stage
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(Number(e.target.value) as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value={1}>Stage 1: Foundation & Safety</option>
                    <option value={2}>Stage 2: Stability & Cushion</option>
                    <option value={3}>Stage 3: Wealth Growth</option>
                    <option value={4}>Stage 4: Acceleration & Scale</option>
                    <option value={5}>Stage 5: Freedom & Legacy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Life Milestones">Life Milestones</option>
                    <option value="Emergency & Savings">Emergency & Savings</option>
                    <option value="Debt Elimination">Debt Elimination</option>
                    <option value="Investing & Wealth">Investing & Wealth</option>
                    <option value="Tax & Protection">Tax & Protection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Amount / Metric *
                </label>
                <input
                  type="text"
                  required
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value)}
                  placeholder="e.g. $60,000 Down Payment or 0% Auto Loan"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Why is this goal important?
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Notes or strategy to reach this milestone..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md cursor-pointer"
                >
                  Add to My Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
