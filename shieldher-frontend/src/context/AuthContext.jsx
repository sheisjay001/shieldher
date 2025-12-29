import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

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
      return { success: true };
    } catch (err) {
      console.error("Login Error:", err);
      return { success: false, error: err.response?.data?.error || err.message || 'Login failed' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, { username, email, password });
      
      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        throw new Error('Backend API not reachable');
      }

      return { success: true };
    } catch (err) {
      console.error("Registration Error:", err);
      return { success: false, error: err.response?.data?.error || err.message || 'Registration failed' };
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
