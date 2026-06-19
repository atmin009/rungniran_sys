import { createContext, useContext, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, setToken, clearToken, adminLogin } from './api.js';

const AuthContext = createContext(null);

function decode(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64).split('').map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    );
    const payload = JSON.parse(json);
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const t = getToken();
    return t ? decode(t) : null;
  });

  const login = async (username, password) => {
    const { token, user: u } = await adminLogin(username, password);
    setToken(token);
    setUser(u);
    return u;
  };
  const logout = () => { clearToken(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/admin" replace />;
  return children;
}
