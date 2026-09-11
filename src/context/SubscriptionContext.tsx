import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { ApiConfig } from "../config/apiconfig";

export interface SubscriptionState {

  planId: string | null;
  /** URL-friendly plan slug (e.g. "pro", "basic") */
  planSlug: string | null;
  /** Human-readable plan name (e.g. "Pro Plan") */
  planName: string | null;
  /** Current subscription status ("Active", "Trial", "Cancelled", etc.) */
  status: string | null;
  /** End date of the current billing period */
  endDate: string | null;
  /** Set<string> of resolved feature keys for O(1) lookup */
  features: Set<string>;
  /** True while the initial feature load is in progress */
  loading: boolean;
  /** True if the API call failed */
  error: boolean;
}

export interface SubscriptionContextType {
  subscription: SubscriptionState;

  hasFeature: (featureKey: string) => boolean;

  refreshFeatures: () => Promise<void>;
}


const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

const EMPTY_SET = new Set<string>();
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; 


export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authState } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionState>({
    planId: null,
    planSlug: null,
    planName: null,
    status: null,
    endDate: null,
    features: EMPTY_SET,
    loading: false,
    error: false,
  });

  // ── Fetch features from GET /api/subscription/my-features ──────────

  const refreshFeatures = useCallback(async () => {
    if (!authState.isAuthenticated) {
      setSubscription((prev) => ({
        ...prev,
        planId: null,
        planSlug: null,
        planName: null,
        status: null,
        endDate: null,
        features: EMPTY_SET,
        loading: false,
        error: false,
      }));
      return;
    }

    setSubscription((prev) => ({ ...prev, loading: true, error: false }));

    try {
      const token = localStorage.getItem("token");
      const authHeaders: Record<string, string> = {
        Authorization: token ? `Bearer ${token}` : "",
      };

      // Fetch features and current subscription in parallel
      const [featuresResponse, currentResponse] = await Promise.all([
        fetch(
          ApiConfig.Api_Base_Url + "api/subscription/my-features",
          { credentials: "include", headers: authHeaders },
        ),
        fetch(
          ApiConfig.Api_Base_Url + "api/subscription/current",
          { credentials: "include", headers: authHeaders },
        ),
      ]);

      if (!featuresResponse.ok) {
        // Non-200 — user may not have a subscription (404) or token expired
        setSubscription((prev) => ({
          ...prev,
          features: EMPTY_SET,
          loading: false,
          error: featuresResponse.status !== 404, // 404 is expected for users without subscription
        }));
        return;
      }

      const featuresData = await featuresResponse.json();

      // Parse current subscription data (may be 404 if no active subscription)
      let currentSub: any = null;
      if (currentResponse.ok) {
        currentSub = await currentResponse.json();
      }

      setSubscription({
        planId: currentSub?.planId ?? authState.planId ?? featuresData.planId ?? null,
        planSlug: currentSub?.planSlug ?? authState.planSlug ?? featuresData.planSlug ?? null,
        planName: currentSub?.planName ?? authState.planName ?? featuresData.planName ?? null,
        status: currentSub?.statusName ?? currentSub?.status ?? authState.subscriptionStatus ?? null,
        endDate: currentSub?.endDate ?? null,
        features: new Set<string>(featuresData.featureKeys ?? []),
        loading: false,
        error: false,
      });
    } catch (err) {
      console.error("[SubscriptionContext] Failed to load features:", err);
      setSubscription((prev) => ({
        ...prev,
        features: EMPTY_SET,
        loading: false,
        error: true,
      }));
    }
  }, [authState.isAuthenticated, authState.planId, authState.planSlug, authState.planName, authState.subscriptionStatus]);



  useEffect(() => {
    refreshFeatures();
  }, [refreshFeatures]);

  // Auto-refresh every 5 minutes 

  useEffect(() => {
    if (authState.isAuthenticated) {
      intervalRef.current = setInterval(refreshFeatures, REFRESH_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authState.isAuthenticated, refreshFeatures]);



  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      return subscription.features.has(featureKey);
    },
    [subscription.features],
  );

  const value = useMemo(
    () => ({ subscription, hasFeature, refreshFeatures }),
    [subscription, hasFeature, refreshFeatures],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};



export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a <SubscriptionProvider>",
    );
  }
  return context;
};
