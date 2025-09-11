import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize tokens from localStorage
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (accessToken && refreshToken) {
      try {
        const decoded = jwtDecode(accessToken);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } else {
          refreshAccessToken(refreshToken); // Try to refresh if expired
        }
      } catch (error) {
        logout(); // Clear tokens on decode error
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = useCallback((accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    const decoded = jwtDecode(accessToken);
    setUser(decoded);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        await axios.post(
          "http://localhost:8001/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Backend logout failed:", error.response?.data || error.message);
      // Even if backend fails, still clear tokens
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const res = await axios.post('http://localhost:8001/api/auth/refresh', { refresh_token: refreshToken });
      const newAccessToken = res.data.access_token;
      const newRefreshToken = res.data.refresh_token || refreshToken; // Backend might return a new refresh token
      login(newAccessToken, newRefreshToken);
    } catch (error) {
      console.error('Refresh failed:', error.response?.data);
      logout(); // Clear tokens on refresh failure
    }
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;