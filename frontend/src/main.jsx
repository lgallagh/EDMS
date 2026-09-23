import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./shared/styles/app.css";
import "./shared/styles/additional.css";
import "./shared/styles/font-awesome.css";
import "./shared/styles/dx.generic.edms-custom-scheme.css";
import "./shared/styles/read-only.css"

import AuthProvider, { AuthContext } from "./shared/context/auth.context";
import { LoadingProvider, useLoadingHandlers } from "./shared/context/loading.context";
import LoadingDialog from "./shared/components/loading-dialog.component";
import setupAxiosInterceptors from "./shared/services/axios-interceptors.service";
import ErrorMessage from "./shared/components/error-message.component";
import ResultMessage from "./shared/components/result-message.component";
import { ErrorProvider, useErrorContext } from "./shared/context/error.context";
import { ResultProvider } from "./shared/context/result.context";

import config from "devextreme/core/config";
import { licenseKey } from "./devextreme-license";

config({ licenseKey });

const InterceptorSetup = ({ children }) => {
  const { logout } = React.useContext(AuthContext); // Access logout from AuthContext
  const { incrementLoading, decrementLoading } = useLoadingHandlers();
  const { setErrorMessage, clearErrorMessage } = useErrorContext();

  React.useEffect(() => {
    setupAxiosInterceptors({
      incrementLoading,
      decrementLoading,
      setErrorMessage,
      clearErrorMessage,
      onLogout: logout,
    });
  }, []);

  return (
    <>
      <ErrorMessage />
      <ResultMessage />
      {children}
    </>
  );
};

const Main = () => {
  return (
    <React.StrictMode>
      <AuthProvider>
        <LoadingProvider>
          <ErrorProvider>
            <ResultProvider>
              <InterceptorSetup>
                <LoadingDialog />
                <App />
              </InterceptorSetup>
            </ResultProvider>
          </ErrorProvider>
        </LoadingProvider>
      </AuthProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
