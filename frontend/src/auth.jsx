import { createContext, useContext, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { loadSession, saveSession } from './session.js';
import { cognitoLogin, cognitoRegister } from './cognito.js';

const USE_COGNITO = Boolean(import.meta.env.VITE_COGNITO_CLIENT_ID);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const start = (next) => {
    saveSession(next);
    setSession(next);
    return next.user;
  };

  const value = {
    user: session?.user ?? null,
    isAdmin: session?.user?.groups.includes('admin') ?? false,
    login: async (email, password) =>
      start(USE_COGNITO ? await cognitoLogin(email, password) : await api('/auth/login', { method: 'POST', body: { email, password } })),
    register: async (name, email, password) =>
      start(
        USE_COGNITO
          ? await cognitoRegister(name, email, password)
          : await api('/auth/register', { method: 'POST', body: { name, email, password } }),
      ),
    logout: () => {
      saveSession(null);
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ admin = false, children }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
