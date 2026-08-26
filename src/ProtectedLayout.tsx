import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useSubscription } from "./context/SubscriptionContext";

interface ProtectedRouteProps {
  /** Optional feature key — if specified, route requires both auth AND the feature */
  requiredFeature?: string;
  /** Where to redirect if feature is missing (default: "/plans") */
  featureRedirect?: string;
}

function ProtectedRoute({
  requiredFeature,
  featureRedirect = "/plans",
}: ProtectedRouteProps = {}) {
  const { authState } = useAuth();
  const { subscription } = useSubscription();

  // Not authenticated → redirect to login
  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If a feature is required, check it (but wait for features to load first)
  if (requiredFeature) {
    if (subscription.loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      );
    }

    if (!subscription.features.has(requiredFeature)) {
      return <Navigate to={featureRedirect} replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;