import React from "react";
import { useFeature } from "../hooks/useFeature";
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
  const hasAccess = useFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Render fallback — defaults to generic UpgradePrompt
  return <>{fallback ?? <UpgradePrompt feature={feature} />}</>;
};

export default FeatureGate;
