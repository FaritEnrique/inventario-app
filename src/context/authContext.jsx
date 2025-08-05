// src/context/authContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '../api/apiFetch';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, revisa si hay un token y datos de usuario en localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiFetch('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        const { token, usuario } = response.data;

        // Guarda el token y los datos del usuario en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));

        setIsAuthenticated(true);
        setUser(usuario);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Error al iniciar sesión' };
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};