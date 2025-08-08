// ==============================================================================
// File: frontend/src/context/AuthContext.tsx (MODIFIED)
// ==============================================================================
import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../services/api';

// --- THIS IS THE INTERFACE TO UPDATE ---
interface User {
  username: string;
  // Add all the new roles to this type definition
  role: 'admin' | 'ba_coordinator' | 'team_leader' | 'team_coordinator' | 'employee';
  employee_id: number;
  employee_name: string;
  ba_id: number | null;
  team_id: number | null;
}

interface AuthContextType { 
  user: User | null; 
  token: string | null; 
  login: (token: string) => void; 
  logout: () => void; 
  isLoading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ... (rest of the file is unchanged)
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const { data } = await apiClient.get('/api/users/me');
          setUser(data);
        } catch (error) {
          console.error("Failed to fetch user details, logging out.", error);
          localStorage.removeItem('authToken');
          setUser(null); 
          setToken(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchUserDetails();
  }, [token]);

  const login = (newToken: string) => { 
    localStorage.setItem('authToken', newToken); 
    setToken(newToken); 
  };
  const logout = () => { 
    localStorage.removeItem('authToken'); 
    setUser(null); 
    setToken(null); 
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};