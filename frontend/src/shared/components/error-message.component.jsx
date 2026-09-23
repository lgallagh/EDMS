import React from "react";
import { useErrorContext } from "../context/error.context";

const ErrorMessage = () => {
  const { errorMessage, clearErrorMessage } = useErrorContext();

  if (!errorMessage) return null;

  return (
    <div className="error-message">
      <span>{errorMessage}</span>
      <button className="error-close" onClick={clearErrorMessage}>
        ✖
      </button>
    </div>
  );
};

export default ErrorMessage;
