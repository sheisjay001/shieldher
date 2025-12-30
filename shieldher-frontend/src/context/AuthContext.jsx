import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const toErrorString = (err) => {
    const e = err?.response?.data?.error ?? err?.message ?? err;
    if (typeof e === 'string') return e;
    if (e?.message && typeof e.message === 'string') return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return 'Unexpected error';
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      
      // Check if response is HTML (which means 404/fallback served by Vite)
      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        throw new Error('Backend API not reachable');
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Login Error:", err);
      return { success: false, error: toErrorString(err) };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, { username, email, password });
      
      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        throw new Error('Backend API not reachable');
      }

      // Auto-login logic
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);

      return { success: true, data: res.data };
    } catch (err) {
      console.error("Registration Error:", err);
      return { success: false, error: toErrorString(err) };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
