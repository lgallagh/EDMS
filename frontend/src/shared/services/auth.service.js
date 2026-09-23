import axios from "axios";
import TokenService from "./token.service";

/**
 * Handle user authentication
 * @param {string} username
 * @param {string} password
 * @param {Function} contextLogin - Function to update context with user data
 * @returns {Promise<Object>}
 */
const login = (username, password, contextLogin) => {
  return axios
    .post(import.meta.env.VITE_REACT_APP_BASE_URL + "/auth/login", {
      username,
      password,
    })
    .then((response) => {
      if (response.data.accessToken) {
        TokenService.setUser(response.data);
        contextLogin(response.data); // Update context
      }
      return response.data;
    });
};

/**
 * Handle user logout, on both front end and back end
 * @param {Function} contextLogout - Function to clear context user data
 * @returns {Promise<Object>}
 */
const logout = (contextLogout) => {
  TokenService.removeUser();
  contextLogout(); // Clear context
  return axios
    .post(import.meta.env.VITE_REACT_APP_BASE_URL + "/auth/logout")
    .then((response) => response.data);
};

const authService = { login, logout };
export default authService;
