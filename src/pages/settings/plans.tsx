import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "../../context/SubscriptionContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";

interface PlanFeature {
  id: string;
  featureKey: string;
  displayName: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  trialDays: number;
  features: PlanFeature[];
}

export default function Plans() {
  const { subscription, refreshFeatures } = useSubscription();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  // =========================================================
  // FETCH PLANS
  // =========================================================

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + "api/subscription/plans",
        {
          credentials: "include",
          headers,
        }
      );

      if (res.ok) {
        const data: Plan[] = await res.json();

        setPlans(
          data
            .filter((p) => p.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // =========================================================
  // SUBSCRIBE
  // =========================================================

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);

    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + "api/subscription/subscribe",
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            planId,
            billingCycle:
              billing === "annual" ? "Annual" : "Monthly",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Subscription failed"
        );
      }

      toast.success("Subscribed successfully!");

      await refreshFeatures();
      await fetchPlans();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubscribing(null);
    }
  };

  // =========================================================
  // UPGRADE
  // =========================================================

  const handleUpgrade = async (planId: string) => {
    setSubscribing(planId);

    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + "api/subscription/upgrade",
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            targetPlanId: planId,
            billingCycle:
              billing === "annual" ? "Annual" : "Monthly",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Upgrade failed"
        );
      }

      toast.success("Plan upgraded!");

      await refreshFeatures();
      await fetchPlans();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubscribing(null);
    }
  };

  // =========================================================
  // DOWNGRADE
  // =========================================================

  const handleDowngrade = async (planId: string) => {
    if (
      !confirm(
        "Downgrade will be scheduled at the end of your current billing period. Continue?"
      )
    ) {
      return;
    }

    setSubscribing(planId);

    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url +
          "api/subscription/downgrade",
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            targetPlanId: planId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Downgrade failed"
        );
      }

      toast.success("Downgrade scheduled!");

      await refreshFeatures();
      await fetchPlans();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubscribing(null);
    }
  };

  // =========================================================
  // ALL FEATURES FOR COMPARISON TABLE
  // =========================================================

  const allFeatures = Array.from(
    new Map(
      plans
        .flatMap((p) => p.features)
        .map((f) => [f.id, f])
    ).values()
  );

  // =========================================================
  // CURRENT PLAN
  // =========================================================

  const isCurrentPlan = (planId: string) =>
    subscription.planId === planId;

  // =========================================================
  // CANCELLED BUT STILL ACTIVE
  // =========================================================

  const isCancelledButActive =
    subscription.status === "Cancelled" &&
    subscription.endDate &&
    new Date(subscription.endDate) > new Date();

  // =========================================================
  // PLAN ACTION
  // =========================================================

  const getPlanAction = (
    plan: Plan
  ):
    | "subscribe"
    | "current"
    | "upgrade"
    | "downgrade" => {
    if (
      !subscription.planId ||
      subscription.status === "none"
    ) {
      return "subscribe";
    }

    if (isCurrentPlan(plan.id)) {
      return "current";
    }

    const currentPlan = plans.find(
      (p) => p.id === subscription.planId
    );

    if (!currentPlan) {
      return "subscribe";
    }

    if (
      plan.sortOrder >
      currentPlan.sortOrder
    ) {
      return "upgrade";
    }

    return "downgrade";
  };

  // =========================================================
  // GET PREVIOUS PLAN
  // =========================================================

  const getPreviousPlan = (plan: Plan) => {
    const previousPlans = plans.filter(
      (p) =>
        p.sortOrder < plan.sortOrder
    );

    if (previousPlans.length === 0) {
      return null;
    }

    return previousPlans.reduce(
      (highest, current) =>
        current.sortOrder >
        highest.sortOrder
          ? current
          : highest
    );
  };

  // =========================================================
  // GET UNIQUE FEATURES
  //
  // Basic:
  //   All features
  //
  // Advanced:
  //   Only features not available in Basic
  //
  // Pro:
  //   Only features not available in Advanced
  // =========================================================

  const getUniqueFeatures = (plan: Plan) => {
    const previousPlan =
      getPreviousPlan(plan);

    if (!previousPlan) {
      return plan.features;
    }

    const previousFeatureIds =
      new Set(
        previousPlan.features.map(
          (feature) => feature.id
        )
      );

    return plan.features.filter(
      (feature) =>
        !previousFeatureIds.has(feature.id)
    );
  };

  // =========================================================
  // GET INHERITED PLAN NAME
  // =========================================================

  const getIncludedPlanName = (
    plan: Plan
  ) => {
    const previousPlan =
      getPreviousPlan(plan);

    return previousPlan?.name || null;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <div
            className="
              h-9 w-9 animate-spin rounded-full
              border-2 border-gray-200
              border-t-violet-600
              dark:border-gray-700
              dark:border-t-violet-500
            "
          />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading plans...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      className="
        mx-auto w-full max-w-7xl
        px-4 py-10
        sm:px-6
        lg:px-8
      "
    >

      {/* =====================================================
          CANCELLED SUBSCRIPTION
      ===================================================== */}

      {isCancelledButActive && (
        <div
          className="
            mb-8 rounded-2xl
            border border-amber-200
            bg-amber-50 p-4
            dark:border-amber-800/50
            dark:bg-amber-900/10
          "
        >
          <div className="flex items-start gap-3">

            <div
              className="
                mt-0.5 flex h-9 w-9
                shrink-0 items-center
                justify-center rounded-full
                bg-amber-100
                dark:bg-amber-900/30
              "
            >
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Subscription Cancelled
              </p>

              <p className="mt-1 text-sm leading-5 text-amber-700 dark:text-amber-300">
                Your subscription has been cancelled.
                You'll continue to have access until{" "}
                <span className="font-semibold">
                  {new Date(
                    subscription.endDate!
                  ).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
                .
              </p>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mx-auto mb-10 max-w-2xl text-center">

       

        <h1
          className="
            text-3xl font-bold
            tracking-tight
            text-gray-900
            dark:text-white
            sm:text-4xl
          "
        >
          Choose Your Plan
        </h1>

        <p
          className="
            mx-auto mt-3
            max-w-xl
            text-sm leading-6
            text-gray-500
            dark:text-gray-400
            sm:text-base
          "
        >
          Select the plan that fits your financial
          goals. Upgrade or downgrade anytime.
        </p>

        {/* =================================================
            BILLING TOGGLE
        ================================================= */}

        <div className="mt-7 flex items-center justify-center gap-3">

          <span
            className={`
              text-sm font-medium
              ${
                billing === "monthly"
                  ? "text-gray-800 dark:text-gray-100"
                  : "text-gray-400"
              }
            `}
          >
            Monthly
          </span>

          <button
            type="button"
            aria-label="Toggle billing period"
            aria-pressed={
              billing === "annual"
            }
            onClick={() =>
              setBilling(
                billing === "monthly"
                  ? "annual"
                  : "monthly"
              )
            }
            className={`
              relative flex h-6 w-12
              flex-shrink-0 cursor-pointer
              items-center rounded-full
              transition-colors duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-violet-500
              focus:ring-offset-2
              ${
                billing === "annual"
                  ? "bg-violet-600"
                  : "bg-gray-300 dark:bg-gray-600"
              }
            `}
          >
            <span
              className={`
                absolute left-0.5
                h-5 w-5 rounded-full
                bg-white shadow-md
                transition-transform
                duration-200 ease-in-out
                ${
                  billing === "annual"
                    ? "translate-x-6"
                    : "translate-x-0"
                }
              `}
            />
          </button>

          <span
            className={`
              text-sm font-medium
              ${
                billing === "annual"
                  ? "text-gray-800 dark:text-gray-100"
                  : "text-gray-400"
              }
            `}
          >
            Annual

            <span
              className="
                ml-1 text-xs font-semibold
                text-emerald-600
                dark:text-emerald-400
              "
            >
              Save ~17%
            </span>
          </span>

        </div>
      </div>

      {/* =====================================================
          PRICING CARDS
      ===================================================== */}

      <div
        className="
          mb-12 grid
          grid-cols-1
          items-stretch
          gap-6
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {plans.map((plan) => {

          const action =
            getPlanAction(plan);

          const isCurrent =
            action === "current";

          const price =
            billing === "annual" &&
            plan.annualPrice
              ? plan.annualPrice
              : plan.monthlyPrice;

          const period =
            billing === "annual"
              ? "/year"
              : "/month";

          const uniqueFeatures =
            getUniqueFeatures(plan);

          const includedPlanName =
            getIncludedPlanName(plan);

          const hasIncludedPlan =
            includedPlanName !== null;

          return (
            <div
              key={plan.id}
              className={`
                relative flex h-full
                min-h-[610px]
                flex-col overflow-hidden
                rounded-2xl
                border
                bg-white
                transition-all duration-200
                dark:bg-gray-800
                ${
                  isCurrent
                    ? `
                      border-violet-500
                      shadow-xl
                      shadow-violet-500/10
                      ring-1
                      ring-violet-500/20
                    `
                    : `
                      border-gray-200
                      shadow-sm
                      hover:-translate-y-1
                      hover:border-violet-300
                      hover:shadow-xl
                      dark:border-gray-700
                      dark:hover:border-violet-600
                    `
                }
              `}
            >

              {/* =================================================
                  CURRENT PLAN TOP LINE
              ================================================= */}

              {isCurrent && (
                <div className="h-1 w-full bg-violet-600" />
              )}

              {/* =================================================
                  CURRENT PLAN BADGE
              ================================================= */}

              {isCurrent && (
                <div
                  className="
                    absolute right-5 top-5
                  "
                >
                  <span
                    className="
                      inline-flex items-center gap-1.5
                      rounded-full
                      bg-violet-100
                      px-3 py-1.5
                      text-xs font-semibold
                      text-violet-700
                      dark:bg-violet-500/15
                      dark:text-violet-300
                    "
                  >
                    <span
                      className="
                        h-1.5 w-1.5
                        rounded-full
                        bg-violet-500
                      "
                    />

                    Current Plan
                  </span>
                </div>
              )}

              {/* =================================================
                  CARD CONTENT
              ================================================= */}

              <div
                className="
                  flex flex-1
                  flex-col
                  p-7
                "
              >

                {/* =================================================
                    PLAN NAME
                ================================================= */}

                <div className="min-h-[82px]">

                  <h3
                    className="
                      text-xl font-bold
                      tracking-tight
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {plan.name}
                  </h3>

                  <p
                    className="
                      mt-2 max-w-[280px]
                      text-sm leading-5
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {plan.description ||
                      "Standard plan"}
                  </p>

                </div>

                {/* =================================================
                    PRICE
                ================================================= */}

                <div className="mt-6 min-h-[58px]">

                  <div className="flex items-baseline gap-1">

                    <span
                      className="
                        text-4xl font-extrabold
                        tracking-tight
                        text-gray-900
                        dark:text-white
                      "
                    >
                      {plan.currency === "INR"
                        ? "₹"
                        : plan.currency}
                      {price.toLocaleString()}
                    </span>

                    <span
                      className="
                        text-sm font-medium
                        text-gray-400
                        dark:text-gray-500
                      "
                    >
                      {period}
                    </span>

                  </div>

                </div>

                {/* =================================================
                    TRIAL
                ================================================= */}

                <div className="mt-2 min-h-[28px]">

                  {plan.trialDays > 0 ? (
                    <span
                      className="
                        inline-flex items-center
                        text-xs font-semibold
                        text-emerald-600
                        dark:text-emerald-400
                      "
                    >
                      <svg
                        className="mr-1.5 h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                      {plan.trialDays}-day free trial
                    </span>
                  ) : (
                    <span className="select-none text-xs text-transparent">
                      No trial
                    </span>
                  )}

                </div>

                {/* =================================================
                    DIVIDER
                ================================================= */}

                <div
                  className="
                    my-6
                    border-t
                    border-gray-100
                    dark:border-gray-700
                  "
                />

                {/* =================================================
                    FEATURES
                ================================================= */}

                <div className="flex-1">

                  {/* Feature Heading */}

                  <p
                    className="
                      mb-4
                      text-xs font-semibold
                      uppercase
                      tracking-wider
                      text-gray-400
                      dark:text-gray-500
                    "
                  >
                    What's included
                  </p>

                  {/* =================================================
                      INHERITED PLAN
                  ================================================= */}

                  {hasIncludedPlan && (
                    <div
                      className="
                        mb-5
                        flex items-center
                        gap-3
                        rounded-xl
                        border
                        border-gray-200
                        bg-gray-50
                        px-4 py-3
                        dark:border-gray-700
                        dark:bg-gray-700/40
                      "
                    >

                      <span
                        className="
                          flex h-6 w-6
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-emerald-50
                          dark:bg-emerald-500/10
                        "
                      >
                        <svg
                          className="h-3.5 w-3.5 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>

                      <span
                        className="
                          text-sm font-medium
                          text-gray-700
                          dark:text-gray-200
                        "
                      >
                        Includes{" "}
                        <span className="font-semibold">
                          {includedPlanName}
                        </span>
                      </span>

                    </div>
                  )}

                  {/* =================================================
                      BASIC / FIRST PLAN
                  ================================================= */}

                  {!hasIncludedPlan && (
                    <ul className="space-y-3">

                      {uniqueFeatures.map(
                        (feature) => (
                          <li
                            key={feature.id}
                            className="
                              flex items-center
                              gap-3 text-sm
                              text-gray-600
                              dark:text-gray-300
                            "
                          >

                            <span
                              className="
                                flex h-5 w-5
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-emerald-50
                                dark:bg-emerald-500/10
                              "
                            >
                              <svg
                                className="
                                  h-3 w-3
                                  text-emerald-500
                                "
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>

                            <span>
                              {feature.displayName}
                            </span>

                          </li>
                        )
                      )}

                    </ul>
                  )}

                  {/* =================================================
                      ADDITIONAL FEATURES FOR ADVANCED / PRO
                  ================================================= */}

                  {hasIncludedPlan &&
                    uniqueFeatures.length > 0 && (
                      <div
                        className="
                          border-t
                          border-gray-100
                          pt-5
                          dark:border-gray-700
                        "
                      >

                        <p
                          className="
                            mb-3
                            text-xs font-semibold
                            text-violet-600
                            dark:text-violet-400
                          "
                        >
                          Additional features
                        </p>

                        <div
                          className="
                            flex flex-wrap
                            gap-2
                          "
                        >

                          {uniqueFeatures.map(
                            (feature) => (
                              <span
                                key={feature.id}
                                className="
                                  inline-flex
                                  items-center
                                  rounded-lg
                                  border
                                  border-violet-200
                                  bg-violet-50
                                  px-2.5 py-1.5
                                  text-xs font-medium
                                  text-violet-700
                                  dark:border-violet-500/20
                                  dark:bg-violet-500/10
                                  dark:text-violet-300
                                "
                              >
                                +{" "}
                                {feature.displayName}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}

                </div>

                {/* =================================================
                    CTA
                ================================================= */}

                <div
                  className="
                    mt-7
                    border-t
                    border-gray-100
                    pt-7
                    dark:border-gray-700
                  "
                >

                  {/* CURRENT */}

                  {action === "current" && (
                    <button
                      type="button"
                      disabled
                      className="
                        h-11 w-full
                        rounded-xl
                        bg-gray-100
                        text-sm font-semibold
                        text-gray-500
                        dark:bg-gray-700
                        dark:text-gray-400
                      "
                    >
                      Current Plan
                    </button>
                  )}

                  {/* SUBSCRIBE */}

                  {action === "subscribe" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSubscribe(plan.id)
                      }
                      disabled={
                        subscribing === plan.id
                      }
                      className="
                        h-11 w-full
                        rounded-xl
                        bg-violet-600
                        text-sm font-semibold
                        text-white
                        shadow-sm
                        transition-all
                        duration-200
                        hover:bg-violet-700
                        hover:shadow-md
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {subscribing === plan.id
                        ? "Subscribing..."
                        : "Get Started"}
                    </button>
                  )}

                  {/* UPGRADE */}

                  {action === "upgrade" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpgrade(plan.id)
                      }
                      disabled={
                        subscribing === plan.id
                      }
                      className="
                        h-11 w-full
                        rounded-xl
                        bg-violet-600
                        text-sm font-semibold
                        text-white
                        shadow-sm
                        transition-all
                        duration-200
                        hover:bg-violet-700
                        hover:shadow-md
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {subscribing === plan.id
                        ? "Upgrading..."
                        : "Upgrade Plan"}
                    </button>
                  )}

                  {/* DOWNGRADE */}

                  {action === "downgrade" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDowngrade(plan.id)
                      }
                      disabled={
                        subscribing === plan.id
                      }
                      className="
                        h-11 w-full
                        rounded-xl
                        border
                        border-gray-300
                        bg-transparent
                        text-sm font-semibold
                        text-gray-700
                        transition-all
                        duration-200
                        hover:border-gray-400
                        hover:bg-gray-50
                        dark:border-gray-600
                        dark:text-gray-300
                        dark:hover:bg-gray-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {subscribing === plan.id
                        ? "Scheduling..."
                        : "Downgrade"}
                    </button>
                  )}

                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* =====================================================
          FEATURE COMPARISON
      ===================================================== */}

      {allFeatures.length > 0 &&
        plans.length > 1 && (
          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-sm
              dark:border-gray-700
              dark:bg-gray-800
            "
          >

            {/* Header */}

            <div
              className="
                border-b
                border-gray-100
                px-6 py-5
                dark:border-gray-700
              "
            >

              <h2
                className="
                  text-lg font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                Feature Comparison
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Compare all available features
                across plans.
              </p>

            </div>

            {/* Table */}

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr
                    className="
                      border-b
                      border-gray-100
                      bg-gray-50
                      text-left
                      text-xs font-semibold
                      uppercase
                      tracking-wider
                      text-gray-500
                      dark:border-gray-700
                      dark:bg-gray-800/70
                      dark:text-gray-400
                    "
                  >

                    <th className="px-6 py-4">
                      Feature
                    </th>

                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`
                          px-6 py-4
                          text-center
                          ${
                            isCurrentPlan(
                              plan.id
                            )
                              ? "text-violet-600 dark:text-violet-400"
                              : ""
                          }
                        `}
                      >
                        {plan.name}

                        {isCurrentPlan(
                          plan.id
                        ) && (
                          <span
                            className="
                              ml-1.5
                              text-[10px]
                              normal-case
                              font-medium
                            "
                          >
                            (Current)
                          </span>
                        )}

                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody
                  className="
                    divide-y
                    divide-gray-100
                    dark:divide-gray-700
                  "
                >

                  {allFeatures.map(
                    (feature) => (
                      <tr
                        key={feature.id}
                        className="
                          transition-colors
                          hover:bg-gray-50
                          dark:hover:bg-gray-700/30
                        "
                      >

                        <td
                          className="
                            px-6 py-4
                            text-gray-700
                            dark:text-gray-300
                          "
                        >
                          {feature.displayName}
                        </td>

                        {plans.map(
                          (plan) => (
                            <td
                              key={plan.id}
                              className="
                                px-6 py-4
                                text-center
                              "
                            >

                              {plan.features.some(
                                (pf) =>
                                  pf.id ===
                                  feature.id
                              ) ? (
                                <span
                                  className="
                                    mx-auto
                                    flex h-6 w-6
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-emerald-50
                                    dark:bg-emerald-500/10
                                  "
                                >
                                  <svg
                                    className="
                                      h-3.5 w-3.5
                                      text-emerald-500
                                    "
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={
                                        2.5
                                      }
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </span>
                              ) : (
                                <span
                                  className="
                                    text-gray-300
                                    dark:text-gray-600
                                  "
                                >
                                  —
                                </span>
                              )}

                            </td>
                          )
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          </div>
        )}

      {/* =====================================================
          NO PLANS
      ===================================================== */}

      {plans.length === 0 && (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-gray-300
            py-16
            text-center
            dark:border-gray-700
          "
        >

          <div
            className="
              mx-auto mb-4
              flex h-12 w-12
              items-center
              justify-center
              rounded-full
              bg-gray-100
              dark:bg-gray-800
            "
          >
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V5m0 9v3m-7-6H2m20 0h-3M5.636 5.636l-2.12-2.12m16.968 16.968l-2.12-2.12m0-12.728l2.12-2.12M5.636 18.364l-2.12 2.12"
              />
            </svg>
          </div>

          <p
            className="
              text-lg font-semibold
              text-gray-700
              dark:text-gray-300
            "
          >
            No plans available
          </p>

          <p
            className="
              mt-1 text-sm
              text-gray-400
              dark:text-gray-500
            "
          >
            Plans will appear here once configured
            by an administrator.
          </p>

        </div>
      )}

    </div>
  );
}