import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { View, Text, AppState, type AppStateStatus } from 'react-native';
import { api, ApiError } from './index';
import { clearSession } from './session';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isLoading: true,
  isAuthenticated: false,
  signIn: () => {},
  signOut: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

const MIN_CHECK_INTERVAL_MS = 5000;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isCheckingRef = useRef(false);
  const lastCheckRef = useRef(0);
  const isMountedRef = useRef(true);

  const checkSession = useCallback(async (): Promise<void> => {
    if (isCheckingRef.current) return;
    const now = Date.now();
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL_MS) return;
    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      const token = await api.getToken();
      if (!token) {
        if (isMountedRef.current) setIsAuthenticated(false);
        return;
      }
      await api.get('/api/auth/me');
      if (isMountedRef.current) setIsAuthenticated(true);
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await clearSession();
        if (isMountedRef.current) setIsAuthenticated(false);
      } else {
        // Network / server error — don't touch session
        if (isMountedRef.current) setIsAuthenticated(true);
      }
    } finally {
      isCheckingRef.current = false;
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  // Initial session check on mount
  useEffect(() => {
    isMountedRef.current = true;
    checkSession();
    return () => { isMountedRef.current = false; };
  }, [checkSession]);

  // AppState listener — debounced, skips if already checking
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      checkSession();
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [checkSession]);

  const signIn = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setIsAuthenticated(false);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050508', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#00F0FF', fontSize: 18, letterSpacing: 6 }}>БУНКЕР</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
