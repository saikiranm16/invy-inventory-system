"use client";
import { createContext, useEffect, useState } from "react";
import { getProfile } from "../services/authService";

export const AuthContext = createContext();

const STORAGE_KEY = "invy_auth";

const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem("token");
};

const persistAuth = (authData) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
  window.localStorage.setItem("token", authData.token);
};

const hasCompleteAuthShape = (authData) =>
  Boolean(authData?.token && authData?.id && authData?.email);

const readStoredAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedAuth = window.localStorage.getItem(STORAGE_KEY);

  if (!storedAuth) {
    const legacyToken = window.localStorage.getItem("token");
    return legacyToken ? { token: legacyToken } : null;
  }

  try {
    return JSON.parse(storedAuth);
  } catch {
    clearStoredAuth();
    return null;
  }
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrateAuth = async () => {
      const storedAuth = readStoredAuth();

      if (hasCompleteAuthShape(storedAuth)) {
        if (active) {
          setUser(storedAuth);
          setIsHydrated(true);
        }
        return;
      }

      if (!storedAuth?.token) {
        if (active) {
          setUser(null);
          setIsHydrated(true);
        }
        return;
      }

      try {
        const res = await getProfile(storedAuth.token);
        const nextUser = {
          token: storedAuth.token,
          ...res.data.user,
        };

        persistAuth(nextUser);

        if (active) {
          setUser(nextUser);
        }
      } catch {
        clearStoredAuth();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    hydrateAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = (authData) => {
    const nextUser = {
      token: authData.token,
      ...authData.user,
    };

    persistAuth(nextUser);
    setUser(nextUser);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const updateProfile = (profileData) => {
    setUser((current) => {
      if (!current) {
        return current;
      }

      const nextUser = {
        ...current,
        ...profileData,
      };

      persistAuth(nextUser);

      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        isAdmin: user?.role === "admin",
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
