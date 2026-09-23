import axios from "axios";

// Handles basic setup for Axios calls, specifically for file upload calls
// This also provides an instance to apply interceptors to.
const uploadInstance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_BASE_URL,
  withCredentials: true,
});

export default uploadInstance;
