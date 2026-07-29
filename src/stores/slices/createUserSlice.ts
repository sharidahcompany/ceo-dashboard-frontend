import { StateCreator } from "zustand";
import { UserResource } from "@/actions/workspace/user.actions";

export interface CreateUserState {
  user: UserResource | undefined;
  tenant_id: string | undefined;
  permissions: string[];
  roles?: string[];
}

export interface CreateUserActions {
  setUser: (user: UserResource) => void;
  clearUser: () => void;
}

export type CreateUserSlice = CreateUserState & CreateUserActions;

export const createUserSlice: StateCreator<CreateUserSlice> = (set) => ({
  user: undefined,
  tenant_id: undefined,
  permissions: [],
  roles: [],

  setUser: (user: UserResource) =>
    set({
      user: user,
      permissions: user?.permissions || [],
      roles: user?.roles || [],
    }),

  clearUser: () =>
    set({ user: undefined, tenant_id: undefined, roles: [], permissions: [] }),
});
