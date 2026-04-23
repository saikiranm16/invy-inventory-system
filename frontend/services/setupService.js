import API, { withAuthConfig } from "./api";

export const syncDemoInventory = (token) =>
  API.post("/setup/demo-inventory", {}, withAuthConfig(token));
