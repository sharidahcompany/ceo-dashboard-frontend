"use client";

import { type ReactNode, createContext, useState, useContext } from "react";
import { useStore } from "zustand";
import { initializeStore, type BoundStore } from "@/stores/boundStore";

export type AppStoreApi = ReturnType<typeof initializeStore>;

export const StoreContext = createContext<AppStoreApi | undefined>(undefined);

export interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
  const [store] = useState(() => initializeStore());

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
