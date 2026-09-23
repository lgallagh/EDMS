import React, { createContext, useContext, useState } from "react";

const ErrorContext = createContext();

export const useErrorContext = () => {
  return useContext(ErrorContext);
};

export const ErrorProvider = ({ children }) => {
  const [errorMessage, setErrorMessage] = useState("");

  const clearErrorMessage = () => setErrorMessage("");

  return (
    <ErrorContext.Provider value={{ errorMessage, setErrorMessage, clearErrorMessage }}>
      {children}
    </ErrorContext.Provider>
  );
};
