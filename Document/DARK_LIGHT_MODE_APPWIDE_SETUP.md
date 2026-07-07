# App-Wide Dark/Light Mode Setup (One Library)

## Objective
Install one library and make dark/light mode available across the entire React app, with persistence in localStorage and compatibility with existing Tailwind dark: classes.

## Current Project Status (Important)
Your project already contains most of the UI styling for dark mode:
- Many components already use Tailwind dark: utilities.
- There is already a theme toggle component at src/Component/dashboard/components/ThemeToggle.jsx.
- A custom theme context exists at src/Component/utils/ThemeContext.jsx.

Main gap:
- ThemeProvider is not wrapped at the root in src/main.tsx.

Because of that gap, theme state is not guaranteed app-wide.

## Chosen Library
Library: use-dark-mode

Why this one:
- Lightweight and focused on theme toggling.
- Supports localStorage persistence.
- Can apply class names directly on html (document.documentElement), which matches Tailwind dark mode usage.
- Works well with Vite + React.

## Installation
Run from project root:

~~~bash
npm install use-dark-mode
~~~

## Implementation Plan

### Step 1: Refactor Theme Context to use the library
File to update:
- src/Component/utils/ThemeContext.jsx

Replace current implementation so it still exposes the same API used across the app:
- currentTheme
- changeCurrentTheme

Recommended implementation:

~~~jsx
import { createContext, useContext, useMemo } from 'react';
import useDarkMode from 'use-dark-mode';

const ThemeContext = createContext({
  currentTheme: 'light',
  changeCurrentTheme: () => {},
});

export default function ThemeProvider({ children }) {
  const darkMode = useDarkMode(false, {
    classNameDark: 'dark',
    classNameLight: 'light',
    element: typeof document !== 'undefined' ? document.documentElement : undefined,
    storageKey: 'theme',
  });

  const currentTheme = darkMode.value ? 'dark' : 'light';

  const changeCurrentTheme = (newTheme) => {
    if (newTheme === 'dark') {
      darkMode.enable();
      if (typeof document !== 'undefined') {
        document.documentElement.style.colorScheme = 'dark';
      }
      return;
    }

    darkMode.disable();
    if (typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const value = useMemo(
    () => ({ currentTheme, changeCurrentTheme }),
    [currentTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemeProvider = () => useContext(ThemeContext);
~~~

Why this is safe:
- Existing components (ThemeToggle + charts) keep using the same context contract.
- No component-level refactor is required.

### Step 2: Wrap root with ThemeProvider
File to update:
- src/main.tsx

Current root has BrowserRouter and AuthProvider, but no ThemeProvider.

Wrap the tree with ThemeProvider so all routes and all components can read and update theme state.

Recommended structure:

~~~tsx
import ThemeProvider from './Component/utils/ThemeContext.jsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
~~~

### Step 3: Keep existing toggle as-is
File:
- src/Component/dashboard/components/ThemeToggle.jsx

No change required if Step 1 preserves:
- currentTheme
- changeCurrentTheme

### Step 4: Ensure Tailwind dark variant remains class-based
Files to verify:
- src/css/style.css
- tailwind.config.js

Your style.css already defines:
- @custom-variant dark (&:is(.dark *));

That means adding class dark to html is enough for app-wide dark mode. Good.

## Validation Checklist
After implementing:

1. Start app:

~~~bash
npm run dev
~~~

2. Login and open dashboard.
3. Click theme toggle in header.
4. Confirm:
- Header, cards, dropdowns, charts switch colors.
- Refresh page and confirm selected theme persists.

5. Open browser devtools and inspect html element:
- class should include dark in dark mode.
- class should not include dark in light mode.

## Common Issues and Fixes

Issue: Theme does not change visually
- Check that ThemeProvider wraps App in src/main.tsx.
- Check html receives dark class.
- Check dark: classes exist on affected elements.

Issue: Theme resets on refresh
- Confirm storageKey is theme.
- Confirm no other code overwrites localStorage theme.

Issue: Some pages remain light
- Those components likely do not have dark: utility classes yet.
- Add dark: variants selectively where needed.

## Optional Cleanup (Recommended)
If you adopt use-dark-mode, you can remove older transition workaround logic from the previous custom context implementation to reduce complexity.

## Rollback Plan
If needed, rollback is easy:
1. Remove use-dark-mode from dependencies.
2. Restore previous ThemeContext implementation.
3. Keep ThemeProvider wrapper in main.tsx (still useful if you continue with custom provider).

## Outcome
With this approach, one library is installed and dark/light mode is available globally, persistent, and compatible with your existing UI structure.
