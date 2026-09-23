import React, { createContext, useState, useContext } from "react";

// Context to manage loading state
const LoadingContext = createContext();

// Provide loading handlers to components
export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const incrementLoading = () => setLoadingCount((prev) => prev + 1);
  const decrementLoading = () =>
    setLoadingCount((prev) => (prev > 0 ? prev - 1 : 0));

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider
      value={{
        incrementLoading,
        decrementLoading,
        isLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook to access loading handlers
export const useLoadingHandlers = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoadingHandlers must be used within LoadingProvider");
  }
  return context;
};

// Custom hook for using the LoadingContext
export const useLoading = () => useContext(LoadingContext);

export default LoadingContext;
