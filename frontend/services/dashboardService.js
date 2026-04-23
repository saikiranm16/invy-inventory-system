import API, { withAuthConfig } from "./api";

export const getDashboard = (token, config = {}) =>
  API.get("/dashboard", withAuthConfig(token, config));
