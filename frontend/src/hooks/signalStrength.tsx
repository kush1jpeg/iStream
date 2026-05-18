import { useAuthStore } from "@/components/zustand/zustand";
import { getSocket } from "@/lib/socket";
import { useEffect, useState } from "react";


export function useSignalStrength() {
  const [latency, setLatency] = useState<number | null>(null);
  const [strength, setStrength] = useState(100);
  const Rootsocket = getSocket("/");
  const socketsReady = useAuthStore((s) => s.socketsReady);


  useEffect(() => {
    if (!Rootsocket || !socketsReady) return;
    const measure = () => {
      Rootsocket.emit("ping:check", Date.now());
    };

    Rootsocket.on("pong:check", (clientTime: number) => {
      const ms = Date.now() - clientTime;
      setLatency(ms);
      // map latency to signal strength
      if (ms < 50) setStrength(100);
      else if (ms < 100) setStrength(80);
      else if (ms < 200) setStrength(60);
      else if (ms < 400) setStrength(40);
      else setStrength(20);
    });
    measure();

    const interval = setInterval(measure, 3000); // check every 3s

    return () => {
      clearInterval(interval);
      Rootsocket.disconnect();
    };
  }, []);

  return { latency, strength };
}
