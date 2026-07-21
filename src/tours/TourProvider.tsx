import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Joyride, ACTIONS, EVENTS, STATUS } from "react-joyride";
import type { EventData, Controls } from "react-joyride";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { toursRegistry, type TourStep } from "./tourSteps";
import { useThemeProvider } from "../Component/utils/ThemeContext";
import { useAuth } from "../context/AuthContext";

// ──────────────────────────────────────────────────────────────
// Context shape
// ──────────────────────────────────────────────────────────────

export interface TourContextProps {
  run: boolean;
  stepIndex: number;
  steps: TourStep[];
  activeTourName: string;
  startTour: (tourName?: string) => void;
  stopTour: () => void;
  restartTour: (tourName?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  isCompleted: boolean;
}

const TourContext = createContext<TourContextProps | undefined>(undefined);

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY_PREFIX = "financial_app_tour_completed_";
const LS_STEP_INDEX = "tour_step_index";
const LS_RUN = "tour_run";
const LS_TOUR_NAME = "tour_active_name";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Wait for a DOM element matching `selector` to appear, polling with
 * requestAnimationFrame. Resolves with the element or rejects after
 * `timeoutMs` milliseconds.
 */
function waitForElement(
  selector: string,
  timeoutMs = 3000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function poll() {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            `[Tour] Target "${selector}" not found within ${timeoutMs}ms`
          )
        );
        return;
      }
      requestAnimationFrame(poll);
    }

    poll();
  });
}

/**
 * Scroll the main content wrapper to the top.
 */
function scrollMainToTop() {
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ──────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentTheme } = useThemeProvider();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── State ──────────────────────────────────────────────────
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeTourName, setActiveTourName] = useState("default");
  const [steps, setSteps] = useState<TourStep[]>(toursRegistry.default);
  const [isCompleted, setIsCompleted] = useState(false);
  /**
   * Changing this key forces React to unmount + remount the <Joyride>
   * component, which is the ONLY reliable way to remove its portal-
   * rendered overlay. Manual DOM cleanup does not work because React
   * still holds virtual-DOM references to the portal children.
   */
  const [joyrideKey, setJoyrideKey] = useState(0);

  // ── Refs ───────────────────────────────────────────────────
  /** Prevent double-processing of Joyride callbacks */
  const processingRef = useRef(false);
  /** Track all timers for cleanup */
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  /** Whether we're waiting for a route transition + DOM readiness */
  const pendingTransitionRef = useRef(false);
  /** The step index we're transitioning TO after a route change */
  const pendingStepRef = useRef<number | null>(null);
  /** Guard against mounting the tour multiple times */
  const mountedRef = useRef(false);

  // ── Timer helper ───────────────────────────────────────────
  const safeTimeout = useCallback(
    (fn: () => void, ms: number): ReturnType<typeof setTimeout> => {
      const id = setTimeout(() => {
        timersRef.current.delete(id);
        fn();
      }, ms);
      timersRef.current.add(id);
      return id;
    },
    []
  );

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);



  // ──────────────────────────────────────────────────────────
  // Restore tour state from localStorage on mount / auth change
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authState.isAuthenticated) {
      setRun(false);
      return;
    }

    // Only restore once
    if (mountedRef.current) return;
    mountedRef.current = true;

    const savedRun = localStorage.getItem(LS_RUN);
    const savedIndex = localStorage.getItem(LS_STEP_INDEX);
    const savedTourName = localStorage.getItem(LS_TOUR_NAME) || "default";

    if (savedRun === "true" && savedIndex !== null) {
      const idx = parseInt(savedIndex, 10);
      const tourSteps = toursRegistry[savedTourName] || toursRegistry.default;
      setSteps(tourSteps);
      setActiveTourName(savedTourName);

      const step = tourSteps[idx];
      if (step?.route && location.pathname !== step.route) {
        // Need to navigate to the correct route first
        navigate(step.route);
        pendingTransitionRef.current = true;
        pendingStepRef.current = idx;
      } else {
        setStepIndex(idx);
        safeTimeout(() => setRun(true), 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.isAuthenticated]);

  // ──────────────────────────────────────────────────────────
  // Handle pending transitions after route changes
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingTransitionRef.current || pendingStepRef.current === null)
      return;

    const targetIdx = pendingStepRef.current;
    const step = steps[targetIdx];
    if (!step) return;

    // Check if we've arrived at the correct route
    if (step.route && location.pathname !== step.route) return;

    pendingTransitionRef.current = false;
    pendingStepRef.current = null;

    // Prepare step (expand sidebar groups, etc.)
    const prepare = async () => {
      if (step.beforeStepPrepare) {
        await step.beforeStepPrepare();
        // Give the DOM a moment to update after the preparation
        await new Promise<void>((r) => safeTimeout(() => r(), 200));
      }

      if (step.scrollToTop) {
        scrollMainToTop();
        await new Promise<void>((r) => safeTimeout(() => r(), 300));
      }

      if (step.scrollTargetSelector) {
        
      }

      // Wait for the actual step target to be in the DOM
      try {
        const targetSelector =
          typeof step.target === "string" ? step.target : "";
        if (targetSelector) {
          await waitForElement(targetSelector, 3000);
        }
      } catch (err) {
        console.warn(
          `[Tour] Target element not found for step ${targetIdx}, skipping.`
        );
      }

      setStepIndex(targetIdx);
      localStorage.setItem(LS_STEP_INDEX, targetIdx.toString());
      safeTimeout(() => setRun(true), 100);
    };

    prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, steps]);

  // ──────────────────────────────────────────────────────────
  // Check completion status on auth change
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const completed =
      localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${activeTourName}`) ===
      "true";
    setIsCompleted(completed);
     
  }, [activeTourName, authState.isAuthenticated]);

  // ──────────────────────────────────────────────────────────
  // Tour control methods
  // ──────────────────────────────────────────────────────────

  const startTour = useCallback(
    (tourName = "default") => {
      if (!authState.isAuthenticated) {
        toast.error("Please log in to take the guided tour.");
        return;
      }

      const selectedSteps = toursRegistry[tourName] || toursRegistry.default;

      // Reset processing guard
      processingRef.current = false;

      setSteps(selectedSteps);
      setActiveTourName(tourName);
      setStepIndex(0);
      setRun(false);

      // Persist initial state
      localStorage.setItem(LS_STEP_INDEX, "0");
      localStorage.setItem(LS_RUN, "true");
      localStorage.setItem(LS_TOUR_NAME, tourName);

      const firstStep = selectedSteps[0];
      if (firstStep?.route && location.pathname !== firstStep.route) {
        // Navigate to the first step's route, then resume via pendingTransition
        navigate(firstStep.route);
        pendingTransitionRef.current = true;
        pendingStepRef.current = 0;
      } else {
        safeTimeout(() => setRun(true), 300);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authState.isAuthenticated, location.pathname, navigate]
  );

  const stopTour = useCallback(() => {
    setRun(false);
    processingRef.current = false;
    pendingTransitionRef.current = false;
    pendingStepRef.current = null;
    localStorage.removeItem(LS_STEP_INDEX);
    localStorage.removeItem(LS_RUN);
    localStorage.removeItem(LS_TOUR_NAME);

    // Force-unmount Joyride by changing its React key
    setJoyrideKey((k) => k + 1);
  }, []);

  const restartTour = useCallback(
    (tourName = "default") => {
      // Clear completion flag so the tour can run again
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${tourName}`);
      setIsCompleted(false);
      stopTour();
      // Small delay to let Joyride fully tear down before restarting
      safeTimeout(() => startTour(tourName), 300);
    },
    [startTour, stopTour, safeTimeout]
  );

  const nextStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  }, [stepIndex, steps.length]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }, [stepIndex]);

  // ──────────────────────────────────────────────────────────
  // Joyride callback — main event handler (v3 API)
  //
  // In react-joyride v3, the onEvent callback receives:
  //   (data: EventData, controls: Controls)
  // where data.type is the event type (EVENTS.*) and
  //       data.status is the tour status (STATUS.*)
  //       data.action is the action that triggered it (ACTIONS.*)
  // ──────────────────────────────────────────────────────────

  const handleJoyrideCallback = useCallback(
    (data: EventData, _controls: Controls) => {
      const { action, index, status, type } = data;

      // ── PRIORITY: Handle tour end (finish or skip) ─────────
      // This check runs BEFORE the processing guard because
      // tour completion must ALWAYS be handled — otherwise the
      // overlay stays visible if STEP_AFTER set processingRef.
      if (
        type === EVENTS.TOUR_END ||
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED
      ) {
        // Immediately stop the tour
        setRun(false);
        processingRef.current = false;
        pendingTransitionRef.current = false;
        pendingStepRef.current = null;

        // Clear all localStorage tour state
        localStorage.removeItem(LS_STEP_INDEX);
        localStorage.removeItem(LS_RUN);
        localStorage.removeItem(LS_TOUR_NAME);

        // Mark tour as completed
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY_PREFIX}${activeTourName}`,
          "true"
        );
        setIsCompleted(true);

        // Force-unmount Joyride — this destroys the overlay portal
        setJoyrideKey((k) => k + 1);

        if (status === STATUS.FINISHED) {
          toast.success("Guided tour completed! You're all set.", {
            icon: "🎉",
            duration: 3000,
          });
        } else if (status === STATUS.SKIPPED) {
          toast(
            "Tour skipped. You can replay it anytime from the sidebar.",
            { icon: "ℹ️", duration: 3000 }
          );
        }

        console.log(`[Tour] Finished/Skipped tour: ${activeTourName}`);
        return;
      }

      // Guard: prevent double-processing of step transitions
      if (processingRef.current) return;

      // ── Handle close (X) button ────────────────────────────
      if (action === ACTIONS.CLOSE) {
        stopTour();
        return;
      }

      // ── Handle step:after — advance or go back ─────────────
      if (type === EVENTS.STEP_AFTER) {

        // Handle skip action from within a step
        if (action === ACTIONS.SKIP) {
          setRun(false);
          processingRef.current = false;
          pendingTransitionRef.current = false;
          pendingStepRef.current = null;
          localStorage.removeItem(LS_STEP_INDEX);
          localStorage.removeItem(LS_RUN);
          localStorage.removeItem(LS_TOUR_NAME);
          localStorage.setItem(
            `${LOCAL_STORAGE_KEY_PREFIX}${activeTourName}`,
            "true"
          );
          setIsCompleted(true);
          setJoyrideKey((k) => k + 1);
          toast(
            "Tour skipped. You can replay it anytime from the sidebar.",
            { icon: "ℹ️", duration: 3000 }
          );
          return;
        }

        const nextIdx = index + (action === ACTIONS.PREV ? -1 : 1);

        // ── CRITICAL: Last step completion ────────────────────
        // In controlled mode, Joyride does NOT fire TOUR_END or
        // STATUS.FINISHED. Clicking "Finish" on the last step only
        // fires STEP_AFTER. We MUST handle completion here.
        if (nextIdx >= steps.length) {
          setRun(false);
          processingRef.current = false;
          pendingTransitionRef.current = false;
          pendingStepRef.current = null;
          localStorage.removeItem(LS_STEP_INDEX);
          localStorage.removeItem(LS_RUN);
          localStorage.removeItem(LS_TOUR_NAME);
          localStorage.setItem(
            `${LOCAL_STORAGE_KEY_PREFIX}${activeTourName}`,
            "true"
          );
          setIsCompleted(true);
          setJoyrideKey((k) => k + 1);
          toast.success("Guided tour completed! You're all set.", {
            icon: "🎉",
            duration: 3000,
          });
          console.log(`[Tour] Completed tour: ${activeTourName}`);
          return;
        }

        // Going before the first step — just ignore
        if (nextIdx < 0) {
          return;
        }

        processingRef.current = true;

        const nextStepDef = steps[nextIdx];
        const needsNavigation =
          nextStepDef?.route && location.pathname !== nextStepDef.route;

        if (needsNavigation) {
          // Pause tour, navigate, then resume via pendingTransition effect
          setRun(false);
          localStorage.setItem(LS_STEP_INDEX, nextIdx.toString());
          pendingTransitionRef.current = true;
          pendingStepRef.current = nextIdx;
          navigate(nextStepDef.route!);
        } else {
          // Same route — prepare the step inline
          const prepare = async () => {
            if (nextStepDef?.beforeStepPrepare) {
              await nextStepDef.beforeStepPrepare();
              await new Promise<void>((r) => safeTimeout(() => r(), 200));
            }

            if (nextStepDef?.scrollToTop) {
              scrollMainToTop();
              await new Promise<void>((r) => safeTimeout(() => r(), 300));
            }

            if (nextStepDef?.scrollTargetSelector) {
              
            }

            // Wait for target element
            const targetSelector =
              typeof nextStepDef?.target === "string"
                ? nextStepDef.target
                : "";
            if (targetSelector) {
              try {
                await waitForElement(targetSelector, 3000);
              } catch (err) {
                console.warn(
                  `[Tour] Target not found for step ${nextIdx}, continuing anyway.`
                );
              }
            }

            setStepIndex(nextIdx);
            localStorage.setItem(LS_STEP_INDEX, nextIdx.toString());
          };

          prepare().finally(() => {
            processingRef.current = false;
          });
        }

        safeTimeout(() => {
          processingRef.current = false;
        }, 1500);
        return;
      }

      // ── Handle target not found — skip to next step ────────
      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn(
          `[Tour] Target not found for step ${index}, skipping.`
        );
        const nextIdx = index + 1;
        if (nextIdx < steps.length) {
          setStepIndex(nextIdx);
          localStorage.setItem(LS_STEP_INDEX, nextIdx.toString());
        } else {
          stopTour();
        }
      }
    },
    [
      activeTourName,
      location.pathname,
      navigate,
      safeTimeout,
      steps,
      stopTour,
    ]
  );

  // ──────────────────────────────────────────────────────────
  // Premium Joyride styles — respects light/dark theme
  // ──────────────────────────────────────────────────────────

  const isDark = currentTheme === "dark";

  const joyrideStyles = {
    tooltip: {
      borderRadius: "16px",
      boxShadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)"
        : "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03)",
      padding: "24px",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
    },
    tooltipContainer: {
      textAlign: "left" as const,
    },
    tooltipTitle: {
      fontSize: "18px",
      fontWeight: 700,
      marginBottom: "8px",
      color: isDark ? "#f8fafc" : "#0f172a",
      letterSpacing: "-0.01em",
    },
    tooltipContent: {
      fontSize: "14px",
      lineHeight: "1.7",
      color: isDark ? "#cbd5e1" : "#475569",
      padding: "0 0 12px 0",
    },
    tooltipFooter: {
      marginTop: "4px",
    },
    buttonPrimary: {
      backgroundColor: "#6366f1",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: 600,
      padding: "10px 18px",
      color: "#ffffff",
      border: "none",
      outline: "none",
      transition: "all 0.2s ease",
      cursor: "pointer",
      boxShadow: "0 4px 12px -2px rgba(99, 102, 241, 0.4)",
    },
    buttonBack: {
      color: isDark ? "#94a3b8" : "#64748b",
      fontSize: "13px",
      fontWeight: 600,
      marginRight: "12px",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "10px 14px",
      borderRadius: "10px",
      transition: "color 0.2s ease",
    },
    buttonSkip: {
      color: isDark ? "#94a3b8" : "#64748b",
      fontSize: "13px",
      fontWeight: 500,
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "10px 14px",
      transition: "color 0.2s ease",
    },
    buttonClose: {
      color: isDark ? "#64748b" : "#94a3b8",
      width: 14,
      height: 14,
      padding: "12px",
    },
    overlay: {
      backgroundColor: isDark
        ? "rgba(15, 23, 42, 0.75)"
        : "rgba(15, 23, 42, 0.45)",
    },
  };

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  return (
    <TourContext.Provider
      value={{
        run,
        stepIndex,
        steps,
        activeTourName,
        startTour,
        stopTour,
        restartTour,
        nextStep,
        prevStep,
        isCompleted,
      }}
    >
      {/* key={joyrideKey} forces React to fully unmount and remount
          the component when the tour ends, which destroys the overlay
          portal — the only reliable way to remove it. */}
      <Joyride
        key={joyrideKey}
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        styles={joyrideStyles}
        options={{
          arrowColor: isDark ? "#1e293b" : "#ffffff",
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          overlayColor: isDark
            ? "rgba(15, 23, 42, 0.75)"
            : "rgba(15, 23, 42, 0.45)",
          primaryColor: "#6366f1",
          textColor: isDark ? "#f8fafc" : "#0f172a",
          width: 380,
          zIndex: 10000,
          spotlightRadius: 12,
          showProgress: true,
          buttons: ["back", "primary", "skip"],
          scrollOffset: 80,
          skipScroll: true,
          spotlightPadding: 8,
        }}
        onEvent={handleJoyrideCallback}
        locale={{
          last: "Finish 🎉",
          next: "Next →",
          back: "← Back",
          skip: "Skip Tour",
        }}
      />
      {children}
    </TourContext.Provider>
  );
};

// ──────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────

export const useTour = (): TourContextProps => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
