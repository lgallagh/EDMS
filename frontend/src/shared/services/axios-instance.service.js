import axios from "axios";

// Handles basic setup for Axios calls, setting details which will be the same for all calls.
// This also provides an instance to apply interceptors to.
const instance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default instance;
