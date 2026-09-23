import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/auth.context";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isAuthLoading } = useContext(AuthContext);

  if (isAuthLoading) {
    // Render a loading indicator while auth check is in progress
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
