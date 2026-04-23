import API, { withAuthConfig } from "./api";

export const getUsers = (token, config = {}) =>
  API.get("/users", withAuthConfig(token, config));

export const updateUserRole = (token, userId, role, config = {}) =>
  API.put(`/users/${userId}/role`, { role }, withAuthConfig(token, config));
