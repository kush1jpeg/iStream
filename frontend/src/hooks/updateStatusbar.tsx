import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";

export function useOnlineCount() {
  const [count, setCount] = useState(0);
  const [streamCount, setStreams] = useState(0);

  useEffect(() => {

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
