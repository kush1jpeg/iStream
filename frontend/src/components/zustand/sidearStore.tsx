import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FollowedUser } from "@/types/types";

interface SidebarStore {
  followingLive: FollowedUser[];

  setFollowingLive: (
    data: FollowedUser[] | ((prev: FollowedUser[]) => FollowedUser[])
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
