# Guided Application Onboarding Tour System 🧭

This directory contains the global, reusable Guided Onboarding Tour system built with **React Joyride** and fully typed for TypeScript and React 19.

## Architecture Overview

The system is split into three main files:
1. `TourProvider.tsx` - The global context provider managing states (`run`, `stepIndex`, active tour), `localStorage` persistence, custom dynamic styling (which respects the application's active light/dark theme), and event tracking.
2. `tourSteps.ts` - Centralized registry containing arrays of steps targeted using stable `data-tour` attributes.
3. `appTour.ts` - Exported custom hook `useTour` and helper methods to control the tour lifecycle programmatically from any component.

Additionally, a reusable button component is available:
* `src/Component/TourButton.tsx` - An interactive helper button with multiple styles (`icon`, `flat`, or standard `button`) that resets the local storage flag and replays the tour.

---

## 🛠️ How To Manage Tour Steps

All steps are defined inside [tourSteps.ts](file:///D:/FinancialApllication_Frontend/Frontend/src/tours/tourSteps.ts).

### 1. Adding a New Step

To add a new step, define a step object in the `appTourSteps` array:

```typescript
{
  target: '[data-tour="my-new-element"]', // Stable CSS selector matching data-tour
  title: "New Highlight Title ✨",
  content: "Detailed explanation of what this element does.",
  placement: "bottom", // "top" | "bottom" | "left" | "right" | "auto" | "center"
  skipBeacon: true,    // (Optional) true to skip clicking a beacon dot before showing tooltip
}
```

Then, add the `data-tour="my-new-element"` attribute to your target element in your TSX/JSX file:

```tsx
<div data-tour="my-new-element">
  {/* Content */}
</div>
```

### 2. Editing Tooltip Content

To update a description or title, locate the corresponding step in the `appTourSteps` array and modify the `title` or `content` properties directly.

### 3. Reordering Steps

Steps are shown sequentially based on their index in the array. To change the sequence, simply cut-and-paste the step objects in `appTourSteps` to your desired order.

### 4. Retargeting Steps

To retarget an existing step:
1. Update the `target` selector in `tourSteps.ts` (e.g. `'[data-tour="old-element"]'` ➡️ `'[data-tour="new-element"]'`).
2. Move the `data-tour` attribute in the layout files to the new target.

---

## ⚙️ Configuration & Features

### Persistence
The completion state of each tour is saved to `localStorage` under the key:
`financial_app_tour_completed_{tourName}`

* First-time users will see the tour automatically after a `1.5s` delay (to prevent layout shifts).
* Once completed or skipped, the flag is saved, and it won't auto-start again.
* Manual triggers (like `<TourButton>`) clear this item and force a fresh restart.

### Multi-Tour Support
The system is ready for extensible feature tours. Define new steps in `tourSteps.ts` and register them under `toursRegistry`:

```typescript
export const toursRegistry: Record<string, Step[]> = {
  default: appTourSteps,
  settingsPage: settingsSteps, // Another tour
};
```

Run a specific tour by calling:
`startTour('settingsPage')` or `restartTour('settingsPage')`
