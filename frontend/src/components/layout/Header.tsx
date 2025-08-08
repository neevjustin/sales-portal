// ==============================================================================
// File: frontend/src/components/layout/Header.tsx (FINAL VERSION)
// ==============================================================================
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Sun, Moon } from 'lucide-react';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-300 lg:hidden">
        <Menu size={24} />
      </button>
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 hidden lg:block">Sales Performance Portal</h1>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-300">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">Welcome, {user?.employee_name}</span>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm">Logout</button>
      </div>
    </header>
  );
};