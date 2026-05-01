import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const API = import.meta.env.BACKEND_URL || "http://localhost:4000";

export function useSignalStrength() {
  const [latency, setLatency] = useState<number | null>(null);
  const [strength, setStrength] = useState(100);

  useEffect(() => {
    const socket: Socket = io(API, { transports: ["websocket"] });

    const measure = () => {
      socket.emit("ping:check", Date.now());
    };

    socket.on("pong:check", (clientTime: number) => {
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
      socket.disconnect();
    };
  }, []);

  return { latency, strength };
}
