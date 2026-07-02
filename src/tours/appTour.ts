import { useTour } from "./TourProvider";

/**
 * Re-export useTour hook for clean import syntax.
 */
export { useTour };

/**
 * Interface representing the capabilities of the tour manager.
 */
export interface TourManager {
  start: (tourName?: string) => void;
  stop: () => void;
  restart: (tourName?: string) => void;
  isActive: boolean;
  currentStepIndex: number;
  isCompleted: boolean;
}

/**
 * A hook wrapper to provide a unified TourManager control interface,
 * supporting future enhancements like API-driven tours and dynamic loading.
 */
export const useTourManager = (): TourManager => {
  const { run, stepIndex, startTour, stopTour, restartTour, isCompleted } =
    useTour();

  return {
    start: startTour,
    stop: stopTour,
    restart: restartTour,
    isActive: run,
    currentStepIndex: stepIndex,
    isCompleted,
  };
};
