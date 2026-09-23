import React, { createContext, useState, useEffect } from "react";
import TokenService from "../services/token.service";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Add loading state

  useEffect(() => {
    const storedUser = TokenService.getUser();
    if (storedUser) {
      setIsLoggedIn(true);
      setUser(storedUser);
    }
    setIsAuthLoading(false); // Indicate auth check is complete
  }, []);

  const login = (userData) => {
    TokenService.setUser(userData);
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    TokenService.removeUser();
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, login, logout, isAuthLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
