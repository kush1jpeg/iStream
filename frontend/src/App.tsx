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
import CreateGroupPage from "./pages/group";
import StreamerDashboard from "./pages/stream/StreamerDashboard";
import { connectAllSockets } from "./lib/socket";
import VodPage from "./pages/stream/VodPage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8888/api/",
  withCredentials: true,
});

const redirectToAuth = () => {
  if (window.location.pathname !== "/auth") {
    useAuthStore.getState().logout();
    window.location.href = "/auth";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // skip interceptor for auth endpoints entirely
    if (originalRequest.url?.includes("auth/")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post("auth/refresh-token", {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError: any) {
        if (
          refreshError.response?.status === 401 ||
          refreshError.response?.status === 403
        ) {
          redirectToAuth();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// proactive refresh every 14 minutes
setInterval(async () => {
  try {
    await api.post("auth/refresh-token", {}, { withCredentials: true });
  } catch {
    useAuthStore.getState().logout();
    window.location.href = "/auth";
  }
}, 14 * 60 * 1000);

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
  const ready = useAuthStore(
    (state) => state.socketsReady
  );


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.get("/user/me");
        setProfile(data.data.user);
      } catch (err: any) {
        console.log(err?.response?.data?.message || "Failed");
      } finally {
      }
    };
    if (!user) fetchUser();
  }, []);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        connectAllSockets()
      } catch (err: any) {
        console.log(err?.response?.data?.message || "Failed");
      } finally {
      }
    };
    if (!ready) connectSocket();
  }, []);

  return (<>
    <TooltipProvider>
      <ToastContainer />
      <Routes>
        {/* Routes WITH sidebar */}

        <Route element={<MainLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/stream/:streamId" element={<StreamPage />} />
          <Route path="/vod/:vodId" element={<VodPage />} />
          <Route path="/profile/me" element={<ProfileSection />} />
          <Route path="/profile/:userId" element={<ProfileSection />} />
          <Route path="/shop" element={<ShopLanding />} />
          <Route path="/start-stream" element={<GoLive />} />
          <Route path="/stream/:streamId/dashboard" element={<StreamerDashboard />} />
          <Route
            path="/chat"
            element={
              user ? (
                <Chat myId={String(user._id)} />
              ) : (
                <div className="flex items-center justify-center h-screen">
                  Loading...
                </div>
              )
            }
          />
          <Route path="/create-group" element={<CreateGroupPage />} />
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
