import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import { createUserSlice, CreateUserSlice } from "./slices/createUserSlice";

export type BoundStore = CreateUserSlice;

export const initializeStore = () => {
  return createStore<BoundStore>()(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
      }),
      {
        name: "ceo-app-storage",
        partialize: (state) => ({
          user: state.user,
          tenant_id: state.tenant_id,
          permissions: state.permissions,
        }),
      },
    ),
  );
};
