// ==============================================================================
// File: frontend/src/context/ThemeContext.tsx (Final Fix)
// ==============================================================================
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

// This helper function remains the single source of truth for applying the theme
const applyTheme = (theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
};

// This function is only for getting the initial state for React
const getInitialTheme = (): Theme => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
};


interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize React's state from localStorage without applying the theme here
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // The toggle function is now the only place that calls applyTheme
      applyTheme(newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};