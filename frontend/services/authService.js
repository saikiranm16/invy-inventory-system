import API, { withAuthConfig } from "./api";

export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const googleSignIn = (credential) =>
  API.post("/auth/google", { credential });
export const getCaptcha = () => API.get("/auth/captcha");
export const getProfile = (token) => API.get("/auth/profile", withAuthConfig(token));
export const updateProfile = (token, data) =>
  API.put("/auth/profile", data, withAuthConfig(token));
