import React from "react";
import { NavLink } from "react-router-dom";

interface UpgradePromptProps {
  /** Optional feature key — used for contextual messaging */
  feature?: string;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom CTA text */
  ctaText?: string;
  /** Custom CTA link */
  ctaLink?: string;
  /** Compact mode — inline pill instead of full card */
  compact?: boolean;
}

/**
 * Displays an "Upgrade to unlock" prompt when a user lacks a specific feature.
 * Used as the default fallback for <FeatureGate>.
 *
 * Two modes:
 *  - **Full** (default): Card with icon, title, description, and CTA button
 *  - **Compact**: Inline pill with lock icon and upgrade link
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  title = "Upgrade Required",
  description = "This feature is not available on your current plan. Upgrade to unlock it.",
  ctaText = "View Plans",
  ctaLink = "/plans",
  compact = false,
}) => {
  // ── Compact mode (inline pill) ───────────────────────────────────

  if (compact) {
    return (
      <NavLink
        to={ctaLink}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
      >
        {/* Lock icon */}
        <svg
          className="w-3 h-3 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Upgrade
      </NavLink>
    );
  }

  // ── Full mode (card) ─────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 text-center max-w-md mx-auto">
      {/* Lock icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/30 mb-4">
        <svg
          className="w-7 h-7 text-amber-500 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        {description}
      </p>

      {feature && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Feature:{" "}
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
            {feature}
          </code>
        </p>
      )}

      <NavLink
        to={ctaLink}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
        {ctaText}
      </NavLink>
    </div>
  );
};

export default UpgradePrompt;
