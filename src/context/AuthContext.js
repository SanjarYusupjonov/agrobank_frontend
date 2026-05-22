import React, { createContext, useContext, useState } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ username, password });
      const { token: jwt } = res.data;

      const base64Url = jwt.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      );

      // Avval tokenni saqlaymiz — me() chaqirish uchun kerak
      localStorage.setItem('token', jwt);
      setToken(jwt);

      // userType ni backenddan olamiz
      const meRes = await authAPI.me();
      const userInfo = {
        username: payload.sub,
        userType: meRes.data.userType, // 'ADMIN' yoki 'DEPARTMENT_HEAD'
        fullName: meRes.data.fullName,
      };

      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);

      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login xatosi');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register(data);
      return { success: true, message: res.data };
    } catch (err) {
      setError(err.response?.data?.message || "Ro'yxatdan o'tishda xato yuz berdi.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);