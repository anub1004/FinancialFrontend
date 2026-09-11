import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  FileText,
  Building2,
  Sparkles,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  X,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export type FAQCategory =
  | "All"
  | "Getting Started"
  | "Plans & Billing"
  | "Transactions & Cards"
  | "Investments & Portfolio"
  | "Taxes & Reporting"
  | "Security & 2FA";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: Exclude<FAQCategory, "All">;
  planBadge?: "Free" | "Basic" | "Advanced" | "Pro" | "Universal";
  keyPoints?: string[];
  relatedLink?: { label: string; url: string };
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: "gs-overview",
    question: "What is this Financial Management platform and who is it designed for?",
    answer:
      "Our platform is an end-to-end modern wealth and cashflow management hub designed for individuals, freelancers, and growing businesses. It centralizes your accounts, categorizes expenses in real-time, monitors your investment portfolios, projects future cash flows, and automates tax liability calculations in an intuitive, bank-grade interface.",
    category: "Getting Started",
    planBadge: "Universal",
    keyPoints: [
      "Unified multi-account dashboard for income, expenses, and net worth",
      "Interactive onboarding walk-through for zero-friction setup",
      "Real-time market news and macroeconomic indicators",
    ],
    relatedLink: { label: "Launch Interactive Tour", url: "/onboarding" },
  },
  {
    id: "gs-onboarding",
    question: "How do I complete account setup and configure my initial accounts?",
    answer:
      "When you first log in, you can take the guided interactive onboarding tour. Go to 'Manage Accounts' to add your checking, savings, investment, or credit card accounts. You can set initial balances, specify currencies, and start logging transactions immediately.",
    category: "Getting Started",
    planBadge: "Universal",
    keyPoints: [
      "Add checking, savings, investment, or debt accounts in under a minute",
      "Set customizable monthly spending and savings targets",
      "Take or restart the guided tour at any time from the sidebar",
    ],
    relatedLink: { label: "Go to Manage Accounts", url: "/manage-accounts" },
  },
  {
    id: "gs-mobile",
    question: "Can I use the application on mobile devices and tablets?",
    answer:
      "Yes! The web platform is built with a fully responsive mobile-first architecture that seamlessly adapts to phones, tablets, and desktops. Additionally, native iOS and Android applications with biometric authentication are currently on our product roadmap.",
    category: "Getting Started",
    planBadge: "Universal",
    keyPoints: [
      "Optimized touch controls, collapsible sidebars, and fluid charts",
      "Installable as a Progressive Web App (PWA) on your home screen",
      "Native mobile apps scheduled for Q4 2026",
    ],
    relatedLink: { label: "View Financial Roadmap", url: "/roadmap" },
  },

  // Plans & Billing
  {
    id: "pb-differences",
    question: "What are the core differences between Free, Basic, Advanced, and Pro plans?",
    answer:
      "We provide four tiers to scale with your wealth complexity. Free covers core ledger management, transactions, and news. Basic introduces deep visual analytics, cards, and investment monitoring. Advanced unlocks budget planning, automated savings goals, and multi-format reports. Pro unlocks full portfolio management, tax reports, audit logs, and multi-user administration.",
    category: "Plans & Billing",
    planBadge: "Universal",
    keyPoints: [
      "Free: Unlimited transactions, account management, news feed",
      "Basic: Analytics charts, investment tracking, virtual cards",
      "Advanced: Budget planning, automated goals, report generator",
      "Pro: Full portfolio analytics, tax filing reports, audit trail, user management",
    ],
    relatedLink: { label: "Compare All Plans", url: "/plans" },
  },
  {
    id: "pb-trial",
    question: "How does the 14-day free trial work and when will I be billed?",
    answer:
      "When you upgrade to any paid plan (Basic, Advanced, or Pro), your account immediately enters a complimentary 14-day trial period with full access to all features. You can cancel anytime before the trial ends directly in the Billing portal without being charged.",
    category: "Plans & Billing",
    planBadge: "Basic",
    keyPoints: [
      "Zero commitments during the 14-day period",
      "Instant access to advanced features upon selection",
      "Automatic reminder 3 days before trial expiration",
    ],
    relatedLink: { label: "Review Billing Details", url: "/billing" },
  },
  {
    id: "pb-cancel",
    question: "Can I upgrade, downgrade, or cancel my subscription at any time?",
    answer:
      "Yes! All subscription changes take effect immediately or at the end of the current billing cycle depending on your selection. When upgrading, proration is automatically calculated so you only pay the incremental difference. If you cancel, your account reverts cleanly to the Free tier without losing any data.",
    category: "Plans & Billing",
    planBadge: "Universal",
    keyPoints: [
      "Instant self-service switching from the Plans tab",
      "Prorated billing on upgrades",
      "No data deletion upon downgrading to Free",
    ],
  },

  // Transactions & Cards
  {
    id: "tc-categories",
    question: "How does transaction categorization work and can I create custom categories?",
    answer:
      "Transactions are categorized automatically based on merchant descriptions (e.g., Dining, Groceries, Utilities, Investments, Transfer). You can edit any transaction's category at any time or add custom tags to analyze your spending in fine detail.",
    category: "Transactions & Cards",
    planBadge: "Free",
    keyPoints: [
      "Smart automatic merchant matching",
      "Filter transactions by date range, account, and category",
      "Export transactions to CSV or PDF anytime",
    ],
    relatedLink: { label: "View Transactions", url: "/transaction" },
  },
  {
    id: "tc-cards",
    question: "How do virtual and physical card management controls work?",
    answer:
      "The Cards portal allows you to manage issued debit and credit cards, view digital credentials securely, toggle instant card freezing/unfreezing, adjust monthly spending caps, and set online purchase limits to safeguard your account against unauthorized charges.",
    category: "Transactions & Cards",
    planBadge: "Basic",
    keyPoints: [
      "1-click lock and unlock for physical and virtual cards",
      "Set per-transaction and monthly maximum spend ceilings",
      "Real-time notifications whenever a card transaction is processed",
    ],
    relatedLink: { label: "Manage Cards", url: "/cards" },
  },
  {
    id: "tc-export",
    question: "How do I export my transaction history for accounting or spreadsheets?",
    answer:
      "On the Transactions or Report Generation page, you can generate comprehensive transaction statements across any custom timeframe and export them in standardized CSV or PDF formats compatible with Excel, Google Sheets, QuickBooks, or Xero.",
    category: "Transactions & Cards",
    planBadge: "Free",
    keyPoints: [
      "Custom date range selection",
      "Clean standard CSV headers for accounting software",
      "Includes fees, net amounts, and categorizations",
    ],
  },

  // Investments & Portfolio
  {
    id: "ip-tracking",
    question: "How does the Investment Monitoring module calculate returns and profit/loss?",
    answer:
      "The Investment Monitoring dashboard tracks your holdings across equities, ETFs, mutual funds, and cash reserves. It computes total portfolio valuation, unrealized gain/loss, realized returns, and annualized time-weighted performance metrics updated with market prices.",
    category: "Investments & Portfolio",
    planBadge: "Basic",
    keyPoints: [
      "Real-time portfolio valuation and allocation charts",
      "Track unrealized vs. realized profit and loss",
      "Breakdown by asset class (Equities, Fixed Income, Crypto, Cash)",
    ],
    relatedLink: { label: "Open Investment Dashboard", url: "/investment-monitoring" },
  },
  {
    id: "ip-portfolio-mgmt",
    question: "What extra capabilities are included in Pro Portfolio Management?",
    answer:
      "Pro Portfolio Management delivers institutional-grade tools including multi-account asset consolidation, historical risk-adjusted Sharpe ratio calculations, target allocation drift alerts, and rebalancing recommendations to keep your investments aligned with your risk tolerance.",
    category: "Investments & Portfolio",
    planBadge: "Pro",
    keyPoints: [
      "Automated asset allocation drift detection",
      "Risk profile assessment and Sharpe/Sortino metrics",
      "Rebalancing calculation spreadsheets",
    ],
    relatedLink: { label: "Explore Portfolio Management", url: "/portfolio-management" },
  },

  // Taxes & Reporting
  {
    id: "tr-tax-reports",
    question: "How are tax reports calculated and are they compliant for annual filing?",
    answer:
      "Our Tax Reports engine aggregates your realized capital gains, taxable dividend income, deductible expenses, and business deductions for the fiscal year. You can download comprehensive summary sheets structured according to tax schedules.",
    category: "Taxes & Reporting",
    planBadge: "Pro",
    keyPoints: [
      "Short-term vs. long-term capital gains classification",
      "Itemized deductible expense categorizations",
      "Exportable formatted reports for your CPA or accountant",
    ],
    relatedLink: { label: "Generate Tax Report", url: "/tax-reports" },
  },
  {
    id: "tr-budgets",
    question: "How do budget planning and spending alert thresholds work?",
    answer:
      "With Budget Planning (Advanced+), you can assign spending caps to specific expense categories. The system visualizes your consumption progress throughout the month, projects whether you will exceed your cap, and triggers alerts when spending reaches 80% or 100% of your threshold.",
    category: "Taxes & Reporting",
    planBadge: "Advanced",
    keyPoints: [
      "Monthly category caps with visual progress bars",
      "Pacing projections based on historical velocity",
      "Custom over-budget notification alerts",
    ],
    relatedLink: { label: "Open Budget Planning", url: "/budget-planning" },
  },
  {
    id: "tr-goals",
    question: "How can I set up and track multi-year financial goals?",
    answer:
      "The Goals feature lets you define milestone targets like Emergency Fund, Home Down Payment, or Retirement. You set a target amount and deadline, and the system computes the recommended monthly deposit schedule to achieve your target on time.",
    category: "Taxes & Reporting",
    planBadge: "Universal",
    keyPoints: [
      "Calculates required monthly contribution rate",
      "Visual milestone percentage progress",
      "Tracks both manual deposits and automated transfers",
    ],
    relatedLink: { label: "View Financial Goals", url: "/goals" },
  },

  // Security & 2FA
  {
    id: "sec-totp",
    question: "How do I set up or reset Google Authenticator / TOTP 2-Factor Authentication?",
    answer:
      "Navigate to 'Security' under your account settings. Click 'Enable 2FA' to generate a secure QR code. Scan the QR code using Google Authenticator, Authy, or Microsoft Authenticator, and enter the 6-digit confirmation code. Make sure to download and save your emergency backup codes in a safe place.",
    category: "Security & 2FA",
    planBadge: "Universal",
    keyPoints: [
      "Industry-standard RFC 6238 TOTP time-based algorithms",
      "Emergency one-time backup codes for phone loss recovery",
      "Session auto-lock after periods of inactivity",
    ],
    relatedLink: { label: "Configure Security Settings", url: "/security" },
  },
  {
    id: "sec-encryption",
    question: "How is my personal financial data protected and encrypted?",
    answer:
      "All sensitive communications are encrypted in-transit using TLS 1.3 encryption. At rest, data is stored with AES-256 bit encryption. We follow strict zero-knowledge protocols where passwords and authentication secrets are salted and hashed with BCrypt. We never sell or share your financial data with third-party advertising brokers.",
    category: "Security & 2FA",
    planBadge: "Universal",
    keyPoints: [
      "256-bit AES encryption at rest and TLS 1.3 in-transit",
      "Salted BCrypt hashing for all credentials",
      "Zero data selling or external advertisement tracking",
    ],
  },
  {
    id: "sec-audit-log",
    question: "What is the Audit Log and who can view administrative actions?",
    answer:
      "The Audit Log records all high-security events, including logins, password changes, 2FA modifications, high-value transfers, and profile updates with timestamps, IP addresses, and user-agent metadata. Pro tier users and admins can review this audit trail to detect suspicious activity.",
    category: "Security & 2FA",
    planBadge: "Pro",
    keyPoints: [
      "Immutable chronological record of critical security actions",
      "Tracks IP address, timestamp, device type, and action type",
      "Compliance-ready logging for auditing requirements",
    ],
    relatedLink: { label: "View Audit Log", url: "/audit-log" },
  },
];

const CATEGORIES: FAQCategory[] = [
  "All",
  "Getting Started",
  "Plans & Billing",
  "Transactions & Cards",
  "Investments & Portfolio",
  "Taxes & Reporting",
  "Security & 2FA",
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>("All");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "gs-overview": true,
    "pb-differences": true,
  });
  const [feedback, setFeedback] = useState<Record<string, "yes" | "no">>({});
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);

  // Check URL hash for direct links like #contact
  useEffect(() => {
    if (window.location.hash === "#contact") {
      setContactModalOpen(true);
    }
  }, []);

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQ = item.question.toLowerCase().includes(query);
        const matchesA = item.answer.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesPoints = item.keyPoints?.some((p) => p.toLowerCase().includes(query));
        return matchesQ || matchesA || matchesCat || matchesPoints;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    filteredFaqs.forEach((item) => {
      allOpen[item.id] = true;
    });
    setOpenItems(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenItems({});
  };

  const handleFeedback = (id: string, type: "yes" | "no") => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
    toast.success("Thank you for your feedback!", {
      icon: type === "yes" ? "👍" : "🙏",
      duration: 3000,
    });
  };

  const handleCopyLink = (id: string) => {
    if (navigator.clipboard) {
      const url = `${window.location.origin}${window.location.pathname}#faq-${id}`;
      navigator.clipboard.writeText(url);
      toast.success("Copied question link to clipboard!");
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast.error("Please provide both subject and message.");
      return;
    }
    setContactSending(true);
    setTimeout(() => {
      setContactSending(false);
      setContactModalOpen(false);
      setContactSubject("");
      setContactMessage("");
      toast.success("Support request submitted! Our concierge team will reply within 24 hours.", {
        icon: "💌",
        duration: 5000,
      });
    }, 800);
  };

  const getPlanBadge = (badge?: FAQItem["planBadge"]) => {
    switch (badge) {
      case "Pro":
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            Pro Feature
          </span>
        );
      case "Advanced":
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25">
            Advanced+
          </span>
        );
      case "Basic":
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25">
            Basic+
          </span>
        );
      case "Free":
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25">
            Free Plan
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Universal
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white p-6 sm:p-10 shadow-2xl border border-indigo-500/20 mb-8">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold backdrop-blur-md mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-violet-300" />
            KNOWLEDGE BASE & SUPPORT
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-400">Questions</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Have questions about managing wealth, syncing transactions, subscription tiers, or bank-grade account security? Find clear, actionable answers below or reach out to our team directly.
          </p>

          {/* Quick search input */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across questions, topics, or features (e.g. 2FA, cards, tax reports, billing)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white/15 transition-all shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER TABS & EXPAND/COLLAPSE BAR */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700/60 p-4 mb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleExpandAll}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH MATCH COUNT */}
      {(searchQuery.trim() || selectedCategory !== "All") && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
          <span>
            Showing <strong className="text-slate-800 dark:text-white">{filteredFaqs.length}</strong> matching questions
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </span>
          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* NO RESULTS STATE */}
      {filteredFaqs.length === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/60 mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No questions matched your search
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            We couldn't find any questions matching "{searchQuery}". You can submit a direct question to our support team or explore our roadmap.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 cursor-pointer"
            >
              Reset Search
            </button>
            <button
              onClick={() => setContactModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-md cursor-pointer"
            >
              Ask Support
            </button>
          </div>
        </div>
      )}

      {/* ACCORDION LIST */}
      <div className="space-y-4 mb-12">
        {filteredFaqs.map((item) => {
          const isOpen = !!openItems[item.id];
          const userVote = feedback[item.id];

          return (
            <div
              key={item.id}
              id={`faq-${item.id}`}
              className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isOpen
                  ? "border-violet-300 dark:border-violet-500/50 shadow-md ring-1 ring-violet-500/20"
                  : "border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-start sm:items-center justify-between gap-4 p-5 text-left cursor-pointer focus:outline-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    {getPlanBadge(item.planBadge)}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.question}
                  </h3>
                </div>

                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? "rotate-180 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
                      : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Answer Content */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50">
                  <p className="mb-4 mt-2">{item.answer}</p>

                  {/* Key points */}
                  {item.keyPoints && item.keyPoints.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 mb-4 border border-slate-100 dark:border-slate-700/40">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                        Key Takeaways:
                      </div>
                      <ul className="space-y-1.5">
                        {item.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Link / Action */}
                  {item.relatedLink && (
                    <div className="mb-4">
                      <Link
                        to={item.relatedLink.url}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:underline"
                      >
                        <span>{item.relatedLink.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {/* Footer: Copy Link & Helpful Feedback */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 text-xs">
                    <button
                      onClick={() => handleCopyLink(item.id)}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link to this answer</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Was this helpful?</span>
                      <button
                        onClick={() => handleFeedback(item.id, "yes")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          userVote === "yes"
                            ? "bg-emerald-500 text-white font-bold"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Yes</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(item.id, "no")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          userVote === "no"
                            ? "bg-rose-500 text-white font-bold"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>No</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* STILL HAVE QUESTIONS CARD */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-3">
              <MessageSquare className="w-3.5 h-3.5" />
              WE'RE HERE TO HELP
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Still have questions or need assistance?
            </h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Our financial concierge and technical support teams are ready to assist you with subscription upgrades, account integrations, or custom requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setContactModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              Contact Support
            </button>
            <Link
              to="/roadmap"
              className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              Financial Roadmap
            </Link>
          </div>
        </div>
      </div>

      {/* CONTACT SUPPORT MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Help Desk Concierge</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Send Us a Message
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
              Let us know what you need help with. We'll get back to your registered email address promptly.
            </p>

            <form onSubmit={handleSendContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g. Question about annual plan billing or bank feed"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{contactSending ? "Submitting..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
