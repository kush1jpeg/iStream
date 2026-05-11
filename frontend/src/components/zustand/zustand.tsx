import { IUser } from "@/types/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: IUser | null;

  setUser: (
    updater:
      | IUser
      | null
      | ((prev: IUser | null) => IUser | null)
  ) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (updater) =>
        set((state) => ({
          user:
            typeof updater === "function"
              ? updater(state.user)
              : updater,
        })),

      logout: () =>
        set({
          user: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
