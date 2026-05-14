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
    (set, get) => ({
      user: null,
      setUser: (updater) => {
        const newUser = typeof updater === "function" ? updater(get().user) : updater;
        set({ user: newUser });
      },
      logout: () => {
        console.trace("logout called");
        set({ user: null })
      },
    }),
    {
      name: "auth-storage", // localStorage key
    }
  )
);
