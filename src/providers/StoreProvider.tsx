"use client";

import { type ReactNode, createContext, useState, useContext, useEffect } from "react";
import { useStore } from "zustand";
import { initializeStore, type BoundStore } from "@/stores/boundStore";
import Cookies from "js-cookie";

export type AppStoreApi = ReturnType<typeof initializeStore>;

export const StoreContext = createContext<AppStoreApi | undefined>(undefined);

export interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
  const [store] = useState(() => initializeStore());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("auth_token");
      const tenant = urlParams.get("tenant");

      let updated = false;
      if (token) {
        Cookies.set("auth_token", token, { path: "/", sameSite: "lax" });
        updated = true;
      }
      if (tenant) {
        Cookies.set("tenant", tenant, { path: "/", sameSite: "lax" });
        updated = true;
      }

      if (updated) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        window.location.reload();
      }
    }
  }, []);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useAppStore = <T,>(selector: (store: BoundStore) => T): T => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error(`useAppStore must be used within StoreProvider`);
  }

  return useStore(storeContext, selector);
};
