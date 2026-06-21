import { useState, useEffect, useCallback } from "react";
import { api, setToken, setRefreshToken, clearTokens, getToken } from "@/core";
import { API_BASE_URL } from "@/lib/constants";
import { getOrCreateKeyPair } from "@/core";

interface User {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  publicKey: string | null;
  vpnClientKey: string | null;
  meshEnabled: boolean;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getToken();
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api.get<User>("/auth/me")
        .then(u => {
          setUser(u);
          setIsAuthenticated(true);
        })
        .catch(() => {
          clearTokens();
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const ensureE2EKeys = useCallback(async () => {
    try {
      const keys = await getOrCreateKeyPair();
      await api.put("/auth/public-key", { publicKey: keys.publicKey });
    } catch {
      // Non-critical: keys will be generated on next login
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { username, password });

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event("storage"));

    await ensureE2EKeys();
  }, [ensureE2EKeys]);

  const register = useCallback(async (username: string, password: string) => {
    const data = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/auth/register", { username, password });

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event("storage"));

    await ensureE2EKeys();
  }, [ensureE2EKeys]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors on logout
    }
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const oauthLogin = useCallback((provider: string) => {
    window.location.href = `${API_BASE_URL}/auth/${provider.toLowerCase()}`;
  }, []);

  const selfDestruct = useCallback(() => {
    clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
    oauthLogin,
    selfDestruct,
  };
}
