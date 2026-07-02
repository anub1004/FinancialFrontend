import React from "react";
import { Compass } from "lucide-react";
import { useTour } from "../tours/TourProvider";

interface TourButtonProps {
  tourName?: string;
  className?: string;
  variant?: "icon" | "button" | "flat";
}

export const TourButton: React.FC<TourButtonProps> = ({
  tourName = "default",
  className = "",
  variant = "button",
}) => {
  const { restartTour, run } = useTour();

  const handleRestart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (run) return; // Prevent multiple tour instances
    restartTour(tourName);
  };

  const baseStyles = "inline-flex items-center justify-center transition-all duration-200 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed";
  
  if (variant === "icon") {
    return (
      <button
        onClick={handleRestart}
        disabled={run}
        title="Start Guided Tour"
        data-tour="tour-restart"
        className={`${baseStyles} p-2 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 ${className}`}
      >
        <Compass className={`w-5 h-5 ${run ? "animate-spin" : ""}`} />
      </button>
    );
  }
  if (variant === "flat") {
    return (
      <button
        onClick={handleRestart}
        disabled={run}
        data-tour="tour-restart"
        className={`${baseStyles} text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 ${className}`}
      >
        <Compass className="w-4 h-4 mr-2" />
        Take Tour
      </button>
    );
  }

  return (
    <button
      onClick={handleRestart}
      disabled={run}
      data-tour="tour-restart"
      className={`${baseStyles} px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-xs hover:shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-600 ${className}`}
    >
      <Compass className="w-4 h-4 mr-2" />
      Guided Tour
    </button>
  );
};

export default TourButton;
