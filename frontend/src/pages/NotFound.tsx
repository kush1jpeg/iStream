import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AsciiLogo } from "@/components/AsciiLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Retro grid background */}
      <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 ">
        {Array.from({ length: 400 }).map((_, i) => (
          <div
            key={i}
            className="border border-purple-700 opacity-20"
          ></div>
        ))}
      </div>

      <div className="text-center z-10">
       
        <AsciiLogo />
        <p className="m-6 text-3xl text-cyan-300 font-mono drop-shadow-lg">
          Bruderr.....u are lost!
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 mt-4 font-mono text-lg text-black bg-cyan-400 rounded-3xl shadow-lg hover:bg-pink-500 hover:text-white transition-all duration-300"
        >
          Return to Home
        </a>
      </div>

      <div className="absolute inset-0 bg-black opacity-50 animate-pulse mix-blend-overlay"></div>
    </div>
  );
};

export default NotFound;

