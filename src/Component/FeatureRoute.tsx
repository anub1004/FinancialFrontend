import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFeature } from "../hooks/useFeature";
import { useSubscription } from "../context/SubscriptionContext";

interface FeatureRouteProps {

  feature: string;
 
  redirectTo?: string;
 
  children?: React.ReactNode;
}


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
