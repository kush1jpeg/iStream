import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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

import axios from "axios";
import { Sidebar } from "./components/Sidebar";

export const api = axios.create({
  baseURL: import.meta.env.BACKEND_URL || "http://localhost:4000",
  withCredentials: true,
});

const queryClient = new QueryClient();
const followedUsers = [
  { id: "1", name: "Alice", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: true },
  { id: "2", name: "Bob", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: false },
];

const MainLayout = () => (
  <>
    <Sidebar followedUsers={followedUsers} />
    <Outlet />
  </>
);
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Routes WITH sidebar */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/stream/:id" element={<StreamPage />} />
            <Route path="/profile" element={<ProfileSection />} />
            <Route path="/shop" element={<ShopLanding />} />
            <Route path="/start-stream" element={<GoLive />} />
            <Route path="/chat" element={<Chat myId="xxxx" />} />
          </Route>

          <Route path="/auth" element={<Auth />} />

          <Route path="*" element={<NotFound />} />
        </Routes>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
