import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type User = {
  email: string;
  name?: string;
};

type UserContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    // This would typically be an API call to your authentication endpoint
    // For now, we'll simulate a successful login with any credentials
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple validation (would be done server-side in a real app)
      if (email && password.length >= 6) {
        setUser({ email });
        // Store auth token in localStorage or secure cookie in a real app
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  const logout = () => {
    setUser(null);
    // Remove auth token
    localStorage.removeItem('isAuthenticated');
  };
  
  // Check if user was previously authenticated
  useState(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (isAuth && !user) {
        // In a real app, you would validate the token here
        // and possibly fetch the user profile
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
          setUser({ email: savedEmail });
        }
      }
    };
    
    checkAuth();
  });
  
  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};