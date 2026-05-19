import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // const login = async (username, password) => {
  //   setLoading(true);
  //   setError('');
  //   try {
  //     const res = await authAPI.login({ username, password });
  //     const { token: jwt } = res.data;
  //     localStorage.setItem('token', jwt);
  //     // Decode basic info from token
  //     const base64Url = jwt.split('.')[1];
  //     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  //     const payload = JSON.parse(
  //       decodeURIComponent(
  //         atob(base64)
  //           .split('')
  //           .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
  //           .join('')
  //       )
  //     );
  //     const userInfo = { username: payload.sub };
  //     localStorage.setItem('user', JSON.stringify(userInfo));
  //     setToken(jwt);
  //     setUser(userInfo);
  //     return true;
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Login xatosi. Iltimos, ma\'lumotlarni tekshiring.');
  //     return false;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const login = async (username, password) => {
  setLoading(true);
  setError('');

  try {
    console.log("LOGIN");

    const res = await authAPI.login({ username, password });

    console.log("RESPONSE:", res.data);

    const { token: jwt } = res.data;

    console.log("TOKEN:", jwt);

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

    console.log("PAYLOAD:", payload);

    const userInfo = { username: payload.sub };

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userInfo));

    setToken(jwt);
    setUser(userInfo);

    return true;

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    setError(
      err.response?.data?.message ||
      'Login xatosi'
    );

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
      setError(err.response?.data?.message || 'Ro\'yxatdan o\'tishda xato yuz berdi.');
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
