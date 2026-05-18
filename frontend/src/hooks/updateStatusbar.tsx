import { useAuthStore } from "@/components/zustand/zustand";
import { getSocket } from "@/lib/socket";
import { useEffect, useState } from "react";

export function useOnlineCount() {
  const socketsReady = useAuthStore((s) => s.socketsReady);
  const [count, setCount] = useState(0);
  const [streamCount, setStreams] = useState(0);

  useEffect(() => {
    if (!socketsReady || !socketsReady) return;

    const socket = getSocket("/");
    if (!socket) return;

    socket.on("statusbar:count", (data) => {
      setCount(data.clients);
      setStreams(data.streams);
    });

    return () => {
      socket.off("statusbar:count"); // remove listener only, never disconnect shared socket
    };
  }, [socketsReady]); // re-runs when sockets become ready

  return { count, streamCount };
}
