import { useEffect, useState } from "react";
import { io } from "socket.io-client";
const API = import.meta.env.BACKEND_URL || "http://localhost:4000";

export function useOnlineCount() {
  const [count, setCount] = useState(0);
  const [streamCount, setStreams] = useState(0);

  useEffect(() => {
    const socket = io(API, { transports: ["websocket"] });

    socket.on("statusbar:count", (data) => {
      setCount(data.clients);
      setStreams(data.streams);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { count, streamCount };
}
