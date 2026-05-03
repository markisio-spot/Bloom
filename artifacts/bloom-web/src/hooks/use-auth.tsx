import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("token"));
  }, []);

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setLocation("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setLocation("/");
  };

  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
