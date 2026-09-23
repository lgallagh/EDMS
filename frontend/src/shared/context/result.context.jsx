import React, { createContext, useContext, useState } from "react";

const ResultContext = createContext();

export const useResultContext = () => {
  return useContext(ResultContext);
};

export const ResultProvider = ({ children }) => {
  const [successMessage, setSuccessMessage] = useState("");
  const [failureMessage, setFailureMessage] = useState("");

  const clearMessage = () => {
      setSuccessMessage("");
      setFailureMessage("");
    };

  return (
    <ResultContext.Provider value={{ successMessage, setSuccessMessage, failureMessage, setFailureMessage, clearMessage }}>
      {children}
    </ResultContext.Provider>
  );
};
