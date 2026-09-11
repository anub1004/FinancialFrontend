import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFeature } from "../hooks/useFeature";
import { useSubscription } from "../context/SubscriptionContext";

interface FeatureRouteProps {
  /** The feature key required to access this route */
  feature: string;
  /** Where to redirect if the user lacks the feature (default: "/plans") */
  redirectTo?: string;
  /** Optional children — if not provided, renders <Outlet /> for nested routes */
  children?: React.ReactNode;
}

/**
 * A route-level feature gate. Wraps a route to enforce feature access.
 * Redirects unauthenticated or feature-lacking users to the plans/upgrade page.
 *
 * @example
 * ```tsx
 * // In App.tsx route config:
 * <Route element={<FeatureRoute feature="advanced_analytics" />}>
 *   <Route path="/analytics-pro" element={<AdvancedAnalytics />} />
 * </Route>
 * ```
 */
const FeatureRoute: React.FC<FeatureRouteProps> = ({
  feature,
  redirectTo = "/plans",
  children,
}) => {
  const { subscription } = useSubscription();
  const hasAccess = useFeature(feature);

  // While features are loading, show nothing (prevents flash of redirect)
  if (subscription.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default FeatureRoute;
