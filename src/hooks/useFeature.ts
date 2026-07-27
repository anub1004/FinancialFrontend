import { useSubscription } from "../context/SubscriptionContext";

/**
 * Hook to check if the current user has access to a specific feature.
 *
 * @param featureKey - The snake_case feature key (e.g. "export_pdf", "ai_suggestions")
 * @returns `true` if the user's plan includes the feature, `false` otherwise.
 *
 * @example
 * ```tsx
 * const canExport = useFeature("export_pdf");
 *
 * return canExport ? <ExportButton /> : <UpgradePrompt />;
 * ```
 */
export function useFeature(featureKey: string): boolean {
  const { hasFeature } = useSubscription();
  return hasFeature(featureKey);
}

export default useFeature;
