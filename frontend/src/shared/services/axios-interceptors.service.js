import axiosInstance from "./axios-instance.service";
import axiosUploadInstance from "./axios-upload-instance.service";
import TokenService from "./token.service";
import axios from "axios";

/**
 * Create interceptors for API calls, applying them to all Axios instances internally.
 * @param {Function} incrementLoading - Function to increment the loading dialog.
 * @param {Function} decrementLoading - Function to decrement the loading dialog.
 * @param {Function} setErrorMessage - Function to set an error message.
 * @param {Function} clearErrorMessage - Function to clear messages.
 * @param {Function} onLogout - Function to handle user logout.
 */
const setupAxiosInterceptors = ({
  incrementLoading,
  decrementLoading,
  setErrorMessage,
  clearErrorMessage,
  onLogout,
}) => {
  const instances = [axiosInstance, axiosUploadInstance];

  const setupInterceptors = (axiosInstance) => {
    // Request Interceptor
    axiosInstance.interceptors.request.use(
      (config) => {
        if (incrementLoading) incrementLoading(); // Show loading dialog

        // Attach access token
        const token = TokenService.getLocalAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers["x-access-token"] = token;
        }

        // Attach user information
      const user = TokenService.getUser();
      if (user && user.user) {
        config.headers["x-username"] = user.user.username;
        //console.log(user);
      }

        return config;
      },
      (error) => {
        if (decrementLoading) decrementLoading(); // Hide loading dialog on error
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    axiosInstance.interceptors.response.use(
      (response) => {
        if (decrementLoading) decrementLoading(); // Hide loading dialog

        if (response.data.error === "error" && setErrorMessage) {
          setErrorMessage(response.data.message);
        }

        return response;
      },
      async (error) => {
        if (decrementLoading) decrementLoading(); // Hide loading dialog

        const originalConfig = { ...error.config };

        if (originalConfig.url !== "/auth/login" && error.response) {
          // Handle token expiration
          if (error.response.status === 401 && !originalConfig._retry) {
            originalConfig._retry = true;

            try {
              const refreshResponse = await axios.post(
                `${import.meta.env.VITE_REACT_APP_BASE_URL}/auth/refresh`
              );
              const { accessToken } = refreshResponse.data;

              TokenService.updateLocalAccessToken(accessToken);
              return axiosInstance(originalConfig); // Retry the original request
            } catch (_error) {
              if (clearErrorMessage) clearErrorMessage();
              if (onLogout) onLogout(); // Handle logout
              return Promise.reject(_error);
            }
          }

          // Handle server errors
          if (error.response && error.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = function () {
              try {
                const errorData = JSON.parse(reader.result);
                const errorMessage = errorData.error || "Unknown server error";

                if (setErrorMessage) {
                  setErrorMessage(`Server Error: ${errorMessage}`);
                }
              } catch (e) {
                console.error("Error parsing blob response:", e);
                if (setErrorMessage) {
                  setErrorMessage("Server Error: Unable to parse error details.");
                }
              }
            };

            reader.onerror = function () {
              console.error("Error reading blob response:", reader.error);
              if (setErrorMessage) {
                setErrorMessage("Server Error: Unable to read error details.");
              }
            };

            reader.readAsText(error.response.data);
          } else if (error.response.status === 500) {
            const errorMessage = error.response.data.error || JSON.stringify(error.response.data);

            if (setErrorMessage) {
              setErrorMessage(`Server Error: ${errorMessage}`);
            }
          } else if (error.response.status === 404) {
            const errorMessage = error.request.responseURL;

            if (setErrorMessage) {
              setErrorMessage(`404 Error, unable to find: ${errorMessage}`);
            }
          }
        } else if (error.code === "ERR_NETWORK" && setErrorMessage) {
          setErrorMessage("Network Error: Unable to connect.");
        }

        return Promise.reject(error);
      }
    );
  };

  // Apply interceptors to all instances
  instances.forEach(setupInterceptors);
};

export default setupAxiosInterceptors;
