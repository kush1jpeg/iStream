import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import StreamPage from "./pages/stream/StreamPage";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileSection from "./pages/profile";
import ShopLanding from "./pages/shop";
import Chat from "./pages/Chat";
import GoLive from "./pages/stream/GoLive";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import { Sidebar } from "./components/Sidebar";
import { Navigation } from "./components/Navigation";
import ChangePass from "./components/changePassword";
import { useEffect } from "react";
import { useAuthStore } from "./components/zustand/zustand";
import OtpVerify from "./components/OtpVerify";

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
    console.log("refreshing tokens")
    await api.post("auth/refresh-token", {}, { withCredentials: true });
  } catch {
    useAuthStore.getState().logout();
    window.location.href = "/auth";
  }
}

setInterval(proactiveRefresh, REFRESH_INTERVAL);
const MainLayout = () => {
  return (
    <>
      <Sidebar />
      <Navigation />
      <Outlet />
    </>
  )
};
const App = () => {
  const setProfile = useAuthStore(
    (state) => state.setUser
  );
  const user = useAuthStore(
    (state) => state.user
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.get("/user/me");
        console.log(data);
        setProfile(data.data.user);
      } catch (err: any) {
        console.log(err?.response?.data?.message || "Failed");
      } finally {
      }
    };
    if (!user) fetchUser();
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
        <Route path="/otp/verify" element={<OtpVerify />} />
        <Route path="/reset-password" element={<ChangePass />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </>)
};

export default App;
