import { LogOut, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/components/zustand/zustand";
import { api } from "@/App";

const LogoutButton = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const setUser = useAuthStore((s) => s.setUser);

  const handleLogout = async () => {
    try {
      await api.post(
        "auth/logout",
        {
          withCredentials: true,
        }
      );

      // clear zustand auth
      setUser(null);

      navigate("/auth");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-red-500/50 bg-red-500/10 px-3 py-2 font-pixel text-[10px] tracking-widest text-red-400 transition-colors hover:bg-red-500/20"
      >
        <LogOut className="h-4 w-4" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">

          <div className="w-[340px] border-2 border-red-500/40 bg-zinc-950 shadow-[0_0_30px_rgba(255,0,0,0.15)]">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-500/20 px-4 py-3">
              <h2 className="font-pixel text-xs tracking-widest text-red-400">
                SESSION TERMINATION
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 transition-colors hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-6">
              <p className="font-mono text-sm text-zinc-300">
                Do you really want to logout?
              </p>

              <p className="mt-2 font-mono text-xs text-zinc-500">
                Your current session will be destroyed.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-red-500/20 px-4 py-3">

              <button
                onClick={() => setOpen(false)}
                className="border border-zinc-700 px-3 py-2 font-pixel text-[10px] text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                CANCEL
              </button>

              <button
                onClick={handleLogout}
                className="border border-red-500/50 bg-red-500/10 px-3 py-2 font-pixel text-[10px] text-red-400 transition-colors hover:bg-red-500/20"
              >
                CONFIRM
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
