"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthUser } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login:  (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, opts?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dkplay_token");
    if (saved) {
      setToken(saved);
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u) setUser(u as AuthUser); else localStorage.removeItem("dkplay_token"); })
        .catch(() => localStorage.removeItem("dkplay_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const persist = (tok: string, u: AuthUser) => {
    localStorage.setItem("dkplay_token", tok);
    setToken(tok);
    setUser(u);
  };

  const signup = async (name: string, email: string, password: string) => {
    const r = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Signup failed");
    persist(data.token, data.user);
  };

  const login = async (email: string, password: string) => {
    const r = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Login failed");
    persist(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("dkplay_token");
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  // Authenticated fetch helper
  const authFetch = (url: string, opts: RequestInit = {}) => {
    const headers = new Headers(opts.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return fetch(url, { ...opts, headers });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
