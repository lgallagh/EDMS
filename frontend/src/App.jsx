
import React, {useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./shared/components/login.component";
import ContainerPage from "./shared/components/container.component";
import ProtectedRoute from "./shared/components/protected-route.component";
import TokenService from "./shared/services/token.service"; // Import TokenService


const App = () => {
  const [user, setUser] = useState(TokenService.getUser()?.user);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedUser = TokenService.getUser()?.user;
      setUser(prev => JSON.stringify(prev) !== JSON.stringify(updatedUser) ? updatedUser : prev);
    }, 1000); // Poll every 1 second

    return () => clearInterval(interval);
  }, []);

  const isReadOnly = user?.privilege === "R";

  useEffect(() => {
    if (isReadOnly) {
      document.querySelectorAll(".read-only-mode input, .read-only-mode button, .read-only-mode select, .read-only-mode textarea")
        .forEach(element => element.setAttribute("tabindex", "-1"));
    } else {
      document.querySelectorAll(".read-only-mode input, .read-only-mode button, .read-only-mode select, .read-only-mode textarea")
        .forEach(element => element.removeAttribute("tabindex"));
    }
  }, [isReadOnly]);

  return (
    <div className={isReadOnly ? "read-only-mode" : "not-read-only"}>
    <Router basename={import.meta.env.VITE_REACT_APP_BASENAME || "/"}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/*"
          element={
            
            <ProtectedRoute>
            <ContainerPage>
              <h1>Welcome to ENT & Allergy Associates</h1>
            </ContainerPage>
            </ProtectedRoute>
            
          }
        />
        
      </Routes>
    </Router>
    </div>
  );
};

export default App;
