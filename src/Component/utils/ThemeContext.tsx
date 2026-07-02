import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  currentTheme: string;
  changeCurrentTheme: (newTheme: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'light',
  changeCurrentTheme: () => {},
});

export default function ThemeProvider({ children }: { children: React.ReactNode }) {  
  const getBrowserTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  console.log('getBrowserTheme', getBrowserTheme());
  const persistedTheme = localStorage.getItem('theme');
  const initialTheme = persistedTheme || getBrowserTheme();
  const [theme, setTheme] = useState(initialTheme);

  const changeCurrentTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  useEffect(() => {
    document.documentElement.classList.add('**:transition-none!');
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }

    const transitionTimeout = setTimeout(() => {
      document.documentElement.classList.remove('**:transition-none!');
    }, 1);
    
    return () => clearTimeout(transitionTimeout);
  }, [theme]);

  return <ThemeContext.Provider value={{ currentTheme: theme, changeCurrentTheme }}>{children}</ThemeContext.Provider>;
}

export const useThemeProvider = () => useContext(ThemeContext);
