import API, { withAuthConfig } from "./api";

export const getRecentAdminActivity = (token, config = {}) =>
  API.get("/admin-activity", withAuthConfig(token, config));
