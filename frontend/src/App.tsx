import { TooltipProvider } from "@/components/ui/tooltip";
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
import { useEffect } from "react";
import { useSidebarStore } from "./components/zustand/sidearStore";
import { useAuthStore } from "./components/zustand/zustand";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8888/api/",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post("auth/refresh-token", {}, { withCredentials: true });
        return api(originalRequest); // retry original request
      } catch (e) {
        useAuthStore.getState().logout();
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

// proactive refresh every 14 minutes
const REFRESH_INTERVAL = 14 * 60 * 1000;

async function proactiveRefresh() {
  try {
    await api.post("auth/refresh-token", {}, { withCredentials: true });
  } catch {
    useAuthStore.getState().logout();
    window.location.href = "/auth";
  }
}

setInterval(proactiveRefresh, REFRESH_INTERVAL); const MainLayout = () => {
  return (
    <>
      <Sidebar />
      <Navigation />
      <Outlet />
    </>
  )
};
const App = () => {
  const setFollowingLive = useSidebarStore(
    (s) => s.setFollowingLive
  );
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sidebar = await api.get("user/sidebar/update", {
          withCredentials: true,
        });
        setFollowingLive(sidebar.data.data)
        console.log("+", sidebar.data);
      } catch (err: any) {
        console.log(err?.response?.data?.message || "Failed");
      } finally {
      }
    };
    fetchUser();
  }, []);


  return (<>
    <TooltipProvider>
      <ToastContainer />
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
    </TooltipProvider>
  </>)
};

export default App;
