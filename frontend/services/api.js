import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

export const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const withAuthConfig = (token, config = {}) => ({
  ...config,
  headers: {
    ...getAuthHeaders(token),
    ...(config.headers || {}),
  },
});

export const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  (!error?.response &&
  (error?.message === "Network Error" || error?.code === "ERR_NETWORK")
    ? "Cannot reach the backend server. Start the backend on http://localhost:5000."
    : error?.message) ||
  fallbackMessage;

export const isRequestCanceled = (error) =>
  axios.isCancel(error) || error?.code === "ERR_CANCELED";

export default API;
