// GoArts AI - Auth Provider Component
import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextCore';
import { authAPI } from '../lib/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from session/local storage on mount
  useEffect(() => {
    // Check tab-isolated sessionStorage first, fallback to localStorage
    const token = sessionStorage.getItem('goarts_token') || localStorage.getItem('goarts_token');
    const savedUser = sessionStorage.getItem('goarts_user') || localStorage.getItem('goarts_user');

    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Ensure this tab has its own copy in sessionStorage
        sessionStorage.setItem('goarts_token', token);
        sessionStorage.setItem('goarts_user', JSON.stringify(parsed));

        // Verify token is still valid with backend
        authAPI.me()
          .then(({ data }) => {
            setUser(data.user);
            sessionStorage.setItem('goarts_user', JSON.stringify(data.user));
            localStorage.setItem('goarts_user', JSON.stringify(data.user));
          })
          .catch(() => {
            sessionStorage.removeItem('goarts_token');
            sessionStorage.removeItem('goarts_user');
            localStorage.removeItem('goarts_token');
            localStorage.removeItem('goarts_user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    // Tab-isolated storage enables testing customer & artist in 2 tabs simultaneously
    sessionStorage.setItem('goarts_token', data.token);
    sessionStorage.setItem('goarts_user', JSON.stringify(data.user));
    localStorage.setItem('goarts_token', data.token);
    localStorage.setItem('goarts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    sessionStorage.setItem('goarts_token', data.token);
    sessionStorage.setItem('goarts_user', JSON.stringify(data.user));
    localStorage.setItem('goarts_token', data.token);
    localStorage.setItem('goarts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('goarts_token');
    sessionStorage.removeItem('goarts_user');
    localStorage.removeItem('goarts_token');
    localStorage.removeItem('goarts_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('goarts_user', JSON.stringify(updatedUser));
    localStorage.setItem('goarts_user', JSON.stringify(updatedUser));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isArtist = user?.role === 'artist';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isArtist, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
};
