import type { Step } from "react-joyride";

/**
 * Extended step interface that adds route-awareness and scroll control
 * to the base Joyride Step type.
 */
export interface TourStep extends Step {
  /** The route pathname this step requires (e.g. "/dashboard"). */
  route?: string;
  /**
   * CSS selector of the element to scroll into view before this step.
   * If omitted, no pre-scroll occurs.
   * NOTE: Named `scrollTargetSelector` to avoid conflict with Joyride's built-in `scrollTarget`.
   */
  scrollTargetSelector?: string;
  /**
   * Milliseconds to wait after scrolling before showing the step tooltip.
   * Allows the scroll animation to finish. Defaults to 0.
   */
  scrollDelay?: number;
  /**
   * If true, scroll the main content area to the top before this step.
   */
  scrollToTop?: boolean;
  /**
   * DOM preparation callback — runs before the step is shown.
   * Useful for expanding sidebar groups, clicking buttons, etc.
   * Return a promise to delay step rendering until the preparation completes.
   */
  beforeStepPrepare?: () => void | Promise<void>;
}

/**
 * Reusable and centralized configurations for application tours.
 * Steps target elements using stable `data-tour` attributes.
 *
 * Flow:
 *   Step 1: Sidebar overview        → /dashboard
 *   Step 2: Onboarding Step 2 item  → /onboarding  (sidebar expanded)
 *   Step 3: Dashboard header        → /dashboard   (scroll to top)
 *   Step 4: Dashboard cards grid    → /dashboard   (scroll cards into view)
 *   Step 5: News nav button         → /dashboard   (scroll to top)
 *   Step 6: Theme toggle            → /dashboard
 */
export const appTourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: "Sidebar Navigation 🧭",
    content:
      "This is your command center. You can toggle pages and expand lists from here.",
    placement: "right",
    skipBeacon: true,
    route: "/dashboard",
  },
  {
    target: '[data-tour="onboarding-nav-link"]',
    title: "Structured Onboarding Steps 🪜",
    content:
      "You are currently viewing Step 2 of the Onboarding setup. Expand these items to complete configuration tasks.",
    placement: "right",
    skipBeacon: true,
   
    // Expand the sidebar Onboarding group before showing this step
    beforeStepPrepare: () => {
      const onboardingHeader = document.querySelector(
        '[data-tour="onboarding-nav-group"]'
      );
      if (onboardingHeader) {
        const anchor = onboardingHeader.closest("a");
        if (anchor) {
          const listContainer = anchor.nextElementSibling;
          // Check if the sub-list is hidden (collapsed)
          const hiddenList = listContainer?.querySelector("ul");
          const isHidden = hiddenList?.classList.contains("hidden");
          if (isHidden) {
            anchor.click();
          }
        }
      }
    },
  },
  {
    target: '[data-tour="dashboard-header"]',
    title: "Dashboard Home 🏠",
    content:
      "Welcome to your core dashboard view, which provides a detailed breakdown of your portfolio.",
    placement: "bottom",
    skipBeacon: true,
    route: "/dashboard",
    scrollToTop: true,
  },
  {
    target: '[data-tour="dashboard-cards"]',
    title: "Financial Metrics & Charts 📊",
    content: "You can view savings, goals, and transactions.",
    placement: "top",
    skipBeacon: true,
    route: "/dashboard",
    scrollTargetSelector: '[data-tour="dashboard-cards"]',

     scrollToTop: true,
  },
 {
    target: '[data-tour="ReportGeneration"]',
    title: "Generate Reports 📄",
    content:
      "Create detailed financial reports to analyze your portfolio, transactions, and overall performance.",
    placement: "top",
    skipBeacon: true,
    route: "/dashboard",
    scrollTargetSelector: '[data-tour="ReportGeneration"]',
    scrollToTop: true,
  },
  {
    target: '[data-tour="Settings"]',
    title: "Application Settings ⚙️",
    content:
      "Manage your account preferences, security options, and application settings from here.",
    placement: "top",
    skipBeacon: true,
    route: "/dashboard",
    scrollTargetSelector: '[data-tour="Settings"]',
    scrollToTop: true,
  },
  
  {
    target: '[data-tour="news-nav"]',
    title: "Finance News Feed 📰",
    content:
      "Click here to read live articles, parse market trends, and filter updates with numbered pagination controls.",
    placement: "bottom",
    skipBeacon: true,
    route: "/dashboard",
   
  },
   {
    target: '[data-tour="Notifications"]',
    title: "Notifications 🔔",
    content:
      "View important alerts, reminders, and system updates so you never miss critical information.",
    placement: "top",
    skipBeacon: true,
    route: "/dashboard",
    scrollTargetSelector: '[data-tour="Notifications"]',
    scrollToTop: true,
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: "Preferences & Colors 🌗",
    content:
      "Instantly toggle between light and dark UI themes to match your local setup.",
    placement: "bottom",
    skipBeacon: true,
    route: "/dashboard",
  },
];

export const toursRegistry: Record<string, TourStep[]> = {
  default: appTourSteps,
};
