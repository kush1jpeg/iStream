import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import StreamPage from "./pages/stream/StreamPage";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileSection from "./pages/profile";
import ShopLanding from "./pages/shop";
import Chat from "./pages/Chat";
import GoLive from "./pages/stream/GoLive";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import { Sidebar } from "./components/Sidebar";
import { Navigation } from "./components/Navigation";
import ChangePass from "./components/changePassword";
import { useEffect, useState } from "react";
import { useAuthStore } from "./components/zustand/zustand";
import { useSidebarStore } from "./components/zustand/sidearStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8888/api",
  withCredentials: true,
});
console.log(import.meta.env)
const queryClient = new QueryClient();

const followedUsers = [
  { _id: "1", name: "Alice", frame: "/frame.png", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", StreamURL: "dsf" },
  { _id: "2", name: "Bob", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", StreamURL: "" },
];


const MainLayout = () => {
  return (
    <>
      <Sidebar followedUsers={followedUsers} />
      <Navigation />
      <Outlet />
    </>
  )
};
const App = () => {
  const [loading, setLoading] = useState(false)

  const setFollowingLive = useSidebarStore(
    (s) => s.setFollowingLive
  );
  const setUser = useAuthStore(
    (state) => state.setUser
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("user/me", {
          withCredentials: true,
        });
        const sidebar = await api.get("user/sidebar/update", {
          withCredentials: true,
        });
        setFollowingLive(sidebar.data)
        console.log(sidebar.data);
        setUser(data.user);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  });


  return (<>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            {/* Routes WITH sidebar */}

            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/stream/:id" element={<StreamPage />} />
              <Route path="/profile/me" element={<ProfileSection />} />
              <Route path="/profile/:userId" element={<ProfileSection />} />
              <Route path="/shop" element={<ShopLanding />} />
              <Route path="/start-stream" element={<GoLive />} />
              <Route path="/chat" element={<Chat myId="xxxx" />} />
            </Route>

            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ChangePass />} />

            <Route path="*" element={<NotFound />} />
          </Routes>

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </>)
};

export default App;
