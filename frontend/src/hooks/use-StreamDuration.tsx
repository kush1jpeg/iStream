import { useEffect, useState } from "react";

export function useStreamDuration(startedAt: string | Date | undefined) {
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    if (!startedAt) return;

    const calc = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDuration(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return duration;
}
