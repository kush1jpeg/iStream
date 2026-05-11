import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LiveUser {
  userId: string;
  avatar: string;
  streamId: string | null;
  isLive: boolean;
}

interface SidebarStore {
  followingLive: LiveUser[];

  setFollowingLive: (
    data: LiveUser[] | ((prev: LiveUser[]) => LiveUser[])
  ) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      followingLive: [],

      setFollowingLive: (data) =>
        set((state) => ({
          followingLive:
            typeof data === "function"
              ? data(state.followingLive)
              : data,
        })),
    }),
    {
      name: "sidebar-store",
    }
  )
);
