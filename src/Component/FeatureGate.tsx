import React from "react";
import { useFeature } from "../hooks/useFeature";
import { useSubscription } from "../context/SubscriptionContext";
import UpgradePrompt from "./UpgradePrompt";

interface FeatureGateProps {
  /** The feature key to check (e.g. "export_pdf") */
  feature: string;
  /** Optional fallback UI when the feature is unavailable. Defaults to <UpgradePrompt />. */
  fallback?: React.ReactNode;
  /** Content to render when the feature IS available */
  children: React.ReactNode;
}

/**
 * Conditionally renders children based on whether the user has access
 * to a specific subscription feature.
 *
 * Handles loading state to prevent flash of UpgradePrompt before features load.
 *
 * @example
 * ```tsx
 * <FeatureGate feature="export_pdf" fallback={<UpgradePrompt feature="export_pdf" />}>
 *   <ExportPdfButton />
 * </FeatureGate>
 * ```
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  children,
}) => {
  const { subscription } = useSubscription();
  const hasAccess = useFeature(feature);

  // While features are loading, show a placeholder to prevent flash of fallback
  if (subscription.loading) {
    return (
      <div className="col-span-full flex items-center justify-center min-h-[100px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Render fallback — null means hide completely, undefined means default UpgradePrompt
  if (fallback === null) return null;
  return <>{fallback !== undefined ? fallback : <UpgradePrompt feature={feature} />}</>;
};

export default FeatureGate;

