import API, { withAuthConfig } from "./api";

export const getCategories = (token, config = {}) =>
  API.get("/categories", withAuthConfig(token, config));

export const createCategory = (token, data, config = {}) =>
  API.post("/categories", data, withAuthConfig(token, config));
