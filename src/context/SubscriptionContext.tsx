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
  planSlug: string | null;
  planName: string | null;
  status: string | null;
  endDate: string | null;
  features: Set<string>;
  loading: boolean;
  error: boolean;
}

export interface SubscriptionContextType {
  subscription: SubscriptionState;
  hasFeature: (featureKey: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const EMPTY_SET = new Set<string>();
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function extractFeatureKeys(data: any): string[] {
  if (!data || typeof data !== "object") return [];
  const keys = data.featureKeys ?? data.FeatureKeys ?? data.features ?? data.Features ?? [];
  if (!Array.isArray(keys)) return [];
  return keys.filter((k: any) => typeof k === "string");
}

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionState>({
    planId: null,
    planSlug: null,
    planName: null,
    status: null,
    endDate: null,
    features: EMPTY_SET,
    loading: true,
    error: false,
  });

  const refreshFeatures = useCallback(async () => {
    if (!authState.isAuthenticated) {
      setSubscription({ planId: null, planSlug: null, planName: null, status: null, endDate: null, features: EMPTY_SET, loading: false, error: false });
      return;
    }

    setSubscription((prev) => ({ ...prev, loading: true, error: false }));

    try {
      const token = localStorage.getItem("token");
      const authHeaders: Record<string, string> = { Authorization: token ? `Bearer ${token}` : "" };

      const [featuresResponse, currentResponse] = await Promise.all([
        fetch(ApiConfig.Api_Base_Url + "api/subscription/my-features", { credentials: "include", headers: authHeaders }),
        fetch(ApiConfig.Api_Base_Url + "api/subscription/current", { credentials: "include", headers: authHeaders }),
      ]);

      console.debug("[SubscriptionContext] my-features:", featuresResponse.status, "| current:", currentResponse.status);

      let featureKeys: string[] = [];

      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        console.debug("[SubscriptionContext] my-features raw:", featuresData);
        featureKeys = extractFeatureKeys(featuresData);
        console.debug(`[SubscriptionContext] ${featureKeys.length} features resolved:`, featureKeys);
      } else if (featuresResponse.status === 404 || featuresResponse.status === 401 || featuresResponse.status === 403) {
        console.debug("[SubscriptionContext] Expected non-200 from my-features:", featuresResponse.status);
      } else {
        console.error("[SubscriptionContext] Unexpected error:", featuresResponse.status);
        setSubscription((prev) => ({ ...prev, features: EMPTY_SET, loading: false, error: true }));
        return;
      }

      let currentSub: any = null;2
      if (currentResponse.ok) {
        currentSub = await currentResponse.json();
        console.debug("[SubscriptionContext] current sub:", currentSub);
      }

      setSubscription({
        planId: currentSub?.planId?.toString() ?? authState.planId ?? null,
        planSlug: currentSub?.planSlug ?? authState.planSlug ?? null,
        planName: currentSub?.planName ?? authState.planName ?? null,
        status: currentSub?.statusName ?? currentSub?.status ?? authState.subscriptionStatus ?? null,
        endDate: currentSub?.endDate ?? null,
        features: new Set<string>(featureKeys),
        loading: false,
        error: false,
      });
    } catch (err) {
      console.error("[SubscriptionContext] Network error:", err);
      setSubscription((prev) => ({ ...prev, features: EMPTY_SET, loading: false, error: true }));
    }
  }, [authState.isAuthenticated, authState.planId, authState.planSlug, authState.planName, authState.subscriptionStatus]);

  useEffect(() => { refreshFeatures(); }, [refreshFeatures]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      intervalRef.current = setInterval(refreshFeatures, REFRESH_INTERVAL_MS);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [authState.isAuthenticated, refreshFeatures]);

  const hasFeature = useCallback(
    (featureKey: string): boolean => subscription.features.has(featureKey),
    [subscription.features],
  );

  const value = useMemo(() => ({ subscription, hasFeature, refreshFeatures }), [subscription, hasFeature, refreshFeatures]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within a <SubscriptionProvider>");
  return context;
};