import React from "react";
import { User, Wallet, CheckCircle, Compass, PlayCircle } from "lucide-react";
import { useTour } from "../../tours/TourProvider";

const Onboarding: React.FC = () => {
  const { restartTour, run } = useTour();

  const steps = [
    {
      number: "Step 1",
      title: "Explore the System Dashboard",
      description: "Get familiar with account summaries, quick metrics, transaction trends, and dynamic chart widgets.",
      icon: Compass,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-100 dark:border-blue-900/40",
    },
    {
      number: "Step 2",
      title: "Set Up Your Financial Profile",
      description: "Fill in your personal profile, tax settings, security credentials, and preferences.",
      icon: User,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      border: "border-indigo-100 dark:border-indigo-900/40",
      tourTag: "onboarding-step-2",
    },
    {
      number: "Step 3",
      title: "Link Financial Accounts",
      description: "Connect your savings goals, active investments, and external bank accounts securely.",
      icon: Wallet,
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/30",
      border: "border-sky-100 dark:border-sky-900/40",
    },
    {
      number: "Step 4",
      title: "Verify Compliance & Reports",
      description: "Generate Net Worth disclosures and reports for compliance review and audit logs.",
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-100 dark:border-emerald-900/40",
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Onboarding Guide
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Follow these structured steps to configure your personal finance manager.
        </p>
      </div>

      {/* Take Tour CTA Card */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-6 sm:p-8 shadow-xl">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Interactive Guided Tour
              </h2>
              <p className="text-sm text-white/80 mt-1 max-w-md">
                New here? Take a quick interactive tour to discover all features, 
                navigation shortcuts, and key workflows in under 2 minutes.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!run) restartTour("default");
            }}
            disabled={run}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            {run ? "Tour in Progress…" : "Take Tour"}
          </button>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              data-tour={step.tourTag}
              className={`p-6 rounded-2xl border ${step.border || "border-gray-200 dark:border-gray-700/60"} bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                step.tourTag ? "ring-2 ring-indigo-500/20" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${step.bg} ${step.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Onboarding;
