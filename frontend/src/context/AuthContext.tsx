// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';


const API_BASE_URL = 'http://localhost:8000';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  // other user properties
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUser = async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/accounts/users/me/`, {
        headers: getAuthHeaders()
      });
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token first
        const token = localStorage.getItem('authToken');
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // If we have a token, try to get the user data
        await fetchUser();
      } catch (error) {
        console.error('Auth check failed:', error);
        // If the token is invalid, remove it
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Hardcoded URL
      const response = await axios.post(`${API_BASE_URL}/api/auth/jwt/create/`, {
        email,
        password
      });

      // Get access and refresh tokens
      const { access, refresh } = response.data;

      if (!access) {
        throw new Error('No access token received from server');
      }

      // Store both tokens
      localStorage.setItem('authToken', access);
      localStorage.setItem('refreshToken', refresh);

      // Now fetch user data with the token
      await fetchUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // For JWT-based auth, we don't need server logout
    // Just clear the tokens on the client side
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Add token refresh functionality
  const refreshTokens = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) return false;

      // Hardcoded URL
      const response = await axios.post(`${API_BASE_URL}/api/auth/jwt/refresh/`, {
        refresh
      });

      const { access } = response.data;

      if (access) {
        localStorage.setItem('authToken', access);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Provide all the values required by the AuthContextType interface
  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    fetchUser,
    refreshTokens
  };

  return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}