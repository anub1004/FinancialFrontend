# Adding a Product Tour / Onboarding Tour to the App

This document outlines the approach to add an interactive tour/onboarding system to guide users through the app's features.

---

## 1. Choose a Library

| Library | Stars | Pros | Cons |
|---------|-------|------|------|
| **react-joyride** | ~7k | Most popular, well-maintained, React-native, customizable UI, callback hooks | Heavier bundle (~30KB) |
| **shepherd.js** | ~13k | Framework-agnostic, clean UI, good docs | Wrapper needed for React |
| **reactour** | ~3k | Simple API, built for React, mask/spotlight effect | Less actively maintained |
| **intro.js** | ~23k | Mature, many integrations, rich features | Paid for advanced features |
| **user-onboarding** (custom) | — | Full control, no extra dependency | More dev work |

**Recommendation:** `react-joyride` — best balance of features, maintenance, and React integration.

---

## 2. Install the Library

```bash
npm install react-joyride
```

*(Or the chosen library)*

---

## 3. Core Concept

A tour works by:

1. **Defining steps** — Each step targets a CSS selector (e.g., `#sidebar`, `.dashboard-header`) and shows a tooltip with text
2. **Controlling state** — A boolean (`run`/`stepIndex`) controls whether the tour is active
3. **Rendering the component** — `<Joyride>` wraps the app and renders tooltips over targeted elements

---

## 4. Implementation Plan

### A. Create a Tour Context (Recommended)

```
src/context/TourContext.tsx
```

Purpose: Store tour state globally so any page can start/stop the tour.

```tsx
interface TourContextType {
  isTourActive: boolean;
  startTour: (steps?: Step[]) => void;
  stopTour: () => void;
}
```

### B. Define Tour Steps Per Page

Create step configs per page/feature:

```
src/tours/
  dashboard.tour.ts
  finance.tour.ts
  settings.tour.ts
  manage-accounts.tour.ts
  news.tour.ts
```

Each file exports an array of step objects:

```ts
export const dashboardTourSteps = [
  {
    target: "#dashboard-header",
    content: "This is your financial overview at a glance.",
    title: "Dashboard",
    placement: "bottom",
  },
  {
    target: "#analytics-section",
    content: "View charts and trends here.",
    title: "Analytics",
    placement: "left",
  },
  // ...
];
```

### C. Add Tour to Layout

Place `<Joyride>` inside `MainLayout.tsx` so it renders on every protected page:

```tsx
import Joyride from "react-joyride";
import { useTour } from "../context/TourContext";

function MainLayout() {
  const { isTourActive, steps, stepIndex } = useTour();

  return (
    <>
      <Joyride
        steps={steps}
        run={isTourActive}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: "#8470ff", // matches your violet-500 theme
          },
        }}
      />
      <div className="flex h-screen ...">
        {/* existing layout */}
      </div>
    </>
  );
}
```

### D. Load Page-Specific Steps

When a route changes, load the corresponding steps:

```tsx
// In TourContext
const routeStepMap: Record<string, Step[]> = {
  "/dashboard": dashboardTourSteps,
  "/news": newsTourSteps,
  "/analytics": analyticsTourSteps,
  // ...
};
```

### E. Trigger the Tour

- **On first login** — Check `localStorage` for `"tour_completed"`. If not set, auto-start after login.
- **Via a help button** — Add a "?" icon in the header that restarts the tour.
- **Per page** — Add a "Take a Tour" button on specific pages.

---
        
## 5. Adding `data-tour` Attributes to Components

To make elements targetable by the tour, add `id` or `data-tour` attributes:

```tsx
// Before
<h1>Dashboard</h1>

// After
<h1 id="dashboard-header" data-tour="dashboard-title">Dashboard</h1>
```

Go through existing components and add these attributes where needed.

---

## 6. Handling Dynamic/DOM Elements

If a tr step targets an element that renders conditionally (e.g., modals, loaded data):

```ts
{
  target: "#chart-panel",
  content: "Charts load based on your selected date range.",
  disableBeacon: true,
  // Wait for element to exist:
  spotlightClicks: true,
}
```

Set `spotlightClicks: true` so the tour waits for user interaction before proceeding.

---

## 7. Styling the Tour

`react-joyride` supports custom styles via the `styles` prop:

```tsx
styles={{
  options: {
    primaryColor: "#8470ff", // violet-500
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    width: 360,
    zIndex: 1000,
  },
  tooltip: {
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  buttonNext: {
    backgroundColor: "#8470ff",
    borderRadius: 8,
  },
}}
```

---

## 8. Persisting Tour Completion

Save to localStorage so returning users don't see the tour again (unless they opt in):

```ts
// After tour completes:
localStorage.setItem("tour_completed", "true");

// On app mount:
const hasCompletedTour = localStorage.getItem("tour_completed") === "true";
if (!hasCompletedTour) {
  startTour(dashboardTourSteps);
}
```

---

## 9. Folder Structure After Implementation

```
src/
  context/
    TourContext.tsx          ← Tour state management
  tours/
    dashboard.tour.ts        ← Dashboard steps
    finance.tour.ts          ← Finance section steps
    news.tour.ts             ← News page steps
    settings.tour.ts         ← Settings section steps
    manage-accounts.tour.ts  ← Manage accounts steps
    index.ts                 ← Re-export all step configs + route map
  Component/
    partials/
      Header.tsx             ← Add "Help / Tour" button
  MainLayout.tsx             ← Mount <Joyride> here
```

---

## 10. Optional: Build a Custom Tour (No Library)

If you want zero external dependencies:

```tsx
// Simple overlay approach:
// 1. Render a modal/overlay
// 2. Position it relative to a target element using getBoundingClientRect()
// 3. Highlight the target with outline/box-shadow
// 4. Show prev/next/close buttons

// This gives full control but requires more code for:
// - Scroll handling
// - Window resize
// - Keyboard navigation
// - Responsive positioning
```

---

## Summary of Steps

| Step | Action |
|------|--------|
| 1 | Install `react-joyride` |
| 2 | Create `src/context/TourContext.tsx` |
| 3 | Create step configs in `src/tours/` |
| 4 | Add `<Joyride>` to `MainLayout.tsx` |
| 5 | Add `id` / `data-tour` attributes to target elements |
| 6 | Wire first-login detection and Help button |
| 7 | Test each tour flow |
| 8 | Remove debug logs, set `disableScrollParentFix` if needed |
