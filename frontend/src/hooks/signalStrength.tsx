import { useAuthStore } from "@/components/zustand/zustand";
import { connectAllSockets, getSocket } from "@/lib/socket";
import { useEffect, useState } from "react";


export function useSignalStrength() {
  const [latency, setLatency] = useState<number | null>(null);
  const [strength, setStrength] = useState<number>(0);
  const socketsReady = useAuthStore((s) => s.socketsReady);


  useEffect(() => {
    if (!socketsReady) return;

    connectAllSockets();
    const rootSocket = getSocket("/");
    if (!rootSocket) return;

    const measure = () => {
      rootSocket.emit("ping:check", Date.now());
    };

    const handlePong = (clientTime: number) => {
      const ms = Date.now() - clientTime;
      setLatency(ms);
      // map latency to signal strength
      if (ms < 50) setStrength(100);
      else if (ms < 100) setStrength(80);
      else if (ms < 200) setStrength(60);
      else if (ms < 400) setStrength(40);
      else setStrength(20);
    };

    const handleConnect = () => {
      measure();
    };

    rootSocket.on("pong:check", handlePong);
    rootSocket.on("connect", handleConnect);

    if (rootSocket.connected) {
      measure();
    } else {
      rootSocket.connect();
    }

    const interval = setInterval(measure, 3000); // check every 3s

    return () => {
      clearInterval(interval);
      rootSocket.off("pong:check", handlePong);
      rootSocket.off("connect", handleConnect);
    };
  }, [socketsReady]);

  return { latency, strength };
}
