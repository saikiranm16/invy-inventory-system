import API, { withAuthConfig } from "./api";

export const getItems = (token, params = {}, config = {}) =>
  API.get("/items", {
    params,
    ...withAuthConfig(token, config),
  });

export const createItem = (token, data, config = {}) =>
  API.post("/items", data, withAuthConfig(token, config));

export const updateItem = (token, id, data, config = {}) =>
  API.put(`/items/${id}`, data, withAuthConfig(token, config));

export const deleteItem = (token, id, config = {}) =>
  API.delete(`/items/${id}`, withAuthConfig(token, config));

export const restockItem = (token, id, quantity, config = {}) =>
  API.put(
    `/items/restock/${id}`,
    { quantity },
    withAuthConfig(token, config)
  );
