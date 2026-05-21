/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem('adminToken'));

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    sessionStorage.setItem('adminToken', data.token);
    setIsAdmin(true);
    return data;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
