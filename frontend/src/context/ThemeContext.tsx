// ==============================================================================
// File: frontend/src/context/ThemeContext.tsx (CORRECTED)
// Description: This version fixes the "always dark" bug by applying the theme
// class immediately when the script loads. It also removes the unused import.
// ==============================================================================
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
type Theme = 'light' | 'dark';

// This small helper function runs immediately and sets the initial theme
// to prevent the "flash" of the wrong theme or being stuck.
const applyTheme = (theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
};

// Initialize theme on script load
const initialTheme = (localStorage.getItem('theme') as Theme) || 'light';
applyTheme(initialTheme);


interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
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
