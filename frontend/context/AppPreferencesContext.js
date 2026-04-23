"use client";

import { createContext, useMemo } from "react";

export const AppPreferencesContext = createContext();

const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      inventory: "Inventory",
      login: "Login",
      register: "Register",
      settings: "Settings",
      logout: "Logout",
      profile: "Profile",
      brandSubtitle: "Smart inventory",
    },
    settings: {
      title: "Settings",
      description: "Open workspace tools and account actions.",
      close: "Close",
      tools: "Workspace tools",
      security: "Security",
      syncInventory: "Sync demo inventory",
      syncingInventory: "Syncing inventory...",
      securityCopy: "Login uses captcha for safer access.",
      adminTools: "Admin tools",
      adminToolsCopy:
        "Refresh the starter inventory so new categories and products stay available.",
    },
    login: {
      eyebrow: "Welcome back",
      title: "Sign in to manage your inventory space.",
      body: "Track products, stock movement, categories, and updates from one focused workspace.",
      formTitle: "Login",
      formBody: "Use your email and password to open Invy.",
      submit: "Login",
      loading: "Signing in...",
      registerPrompt: "Need an account?",
      registerLink: "Create one here",
    },
    register: {
      title: "Create your Invy account",
      body: "Create an account to start tracking products, categories, and stock updates.",
      phone: "Phone number with country code",
      submit: "Register",
      loading: "Creating account...",
      loginPrompt: "Already registered?",
      loginLink: "Login instead",
    },
    dashboard: {
      settings: "Settings",
      greeting: "Inventory at a glance for {name}.",
      subtitle: "Keep a close eye on products, stock value, category coverage, and low-stock alerts from one place.",
      workspace: "Workspace",
      ready: "Overview ready",
      quickAction: "Quick action",
      openInventory: "Open inventory",
      lowStockTitle: "Low stock alert",
      lowStockBody: "Products currently below 5 units.",
      lowStockEmpty: "Everything looks healthy right now.",
      recentProducts: "Recent products",
      recentChanges: "Latest inventory changes",
      viewAll: "View all",
      workflow: "Workflow",
      workflowTitle: "Review stock movement without leaving the dashboard flow.",
      workflowBody: "Jump into inventory to search products by name, filter by category, and review current availability.",
    },
    inventory: {
      alertTitle: "Low stock items",
      alertEmpty: "No item is below 5 units right now.",
    },
  },
};

const getTranslation = (path) => {
  const keys = path.split(".");
  let currentValue = translations.en;

  for (const key of keys) {
    currentValue = currentValue?.[key];
  }

  return currentValue;
};

export default function AppPreferencesProvider({ children }) {
  const value = useMemo(
    () => ({
      language: "en",
      isReady: true,
      t: (path, fallback = "") => getTranslation(path) || fallback,
    }),
    []
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}
