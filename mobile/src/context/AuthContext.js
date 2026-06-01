import React, {
  createContext, useContext, useState, useEffect, useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const { data } = await authAPI.me();
          setUser(data.user);
        }
      } catch {
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await authAPI.register({ username, email, password });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user, loading, login, register, logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
