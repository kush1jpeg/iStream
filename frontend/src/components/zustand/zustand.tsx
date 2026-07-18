import { connectAllSockets, disconnectAllSockets } from "@/lib/socket";
import { IUserFrontend } from "@istream/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: IUserFrontend | null;
  socketsReady: boolean;
  setUser: (updater: IUserFrontend | null | ((prev: IUserFrontend | null) => IUserFrontend | null)) => void;
  logout: () => void;
}

export type StreamSessionStatus = "idle" | "pending" | "live";

interface StreamSessionState {
  status: StreamSessionStatus;
  streamId: string | null;
  setStreamSession: (status: StreamSessionStatus, streamId: string | null) => void;
}

export const useStreamSessionStore = create<StreamSessionState>((set) => ({
  status: "idle",
  streamId: null,
  setStreamSession: (status, streamId) => set({ status, streamId }),
}));

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
