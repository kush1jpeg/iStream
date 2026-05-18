import { connectAllSockets, disconnectAllSockets } from "@/lib/socket";
import { IUser } from "@/types/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: IUser | null;
  socketsReady: boolean;
  setUser: (updater: IUser | null | ((prev: IUser | null) => IUser | null)) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      socketsReady: false,
      setUser: (updater) => {
        const newUser = typeof updater === "function" ? updater(get().user) : updater;
        set({ user: newUser });
        if (newUser) {
          connectAllSockets();
          set({ socketsReady: true });
        }
      },
      logout: () => {
        set({ user: null, socketsReady: false });
        disconnectAllSockets();
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // ← only persist user, never socketsReady
      onRehydrateStorage: () => (state) => {
        // runs after localStorage rehydration
        if (state?.user) {
          connectAllSockets();
          state.socketsReady = true;
        }
      },
    }
  )
);
