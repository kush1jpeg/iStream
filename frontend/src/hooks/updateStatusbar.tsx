import { Rootsocket } from "@/lib/socket";
import { useEffect, useState } from "react";

export function useOnlineCount() {
  const [count, setCount] = useState(0);
  const [streamCount, setStreams] = useState(0);

  useEffect(() => {

    Rootsocket.on("statusbar:count", (data) => {
      setCount(data.clients);
      setStreams(data.streams);
    });

    return () => {
      Rootsocket.disconnect();
    };
  }, []);

  return { count, streamCount };
}
