import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";


const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "[404] Non-existent route accessed:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-black via-purple-900 to-pink-900">

      {/* Retro grid background */}
      <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 opacity-20">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border border-purple-700" />
        ))}
      </div>

      {/* Foreground */}
      <div className="relative z-10 text-center">

        <img
          src="/icon.png"
          alt="logo"
          draggable="false"
          className="mx-auto mb-6 w-80 pointer-events-none select-none"
        />

        <p className="mb-6 font-mono text-3xl text-cyan-300 drop-shadow-lg">
          Bruderr… you are lost.
        </p>

        <Link
          to="/"
          className="inline-block rounded-3xl bg-cyan-400 px-6 py-3 font-mono text-lg text-black shadow-lg transition-all duration-300 hover:scale-105 hover:bg-pink-500 hover:text-white"
        >
          Return to Home
        </Link>
      </div>

      {/* Subtle atmosphere overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/40 mix-blend-overlay" />
    </div>
  );
};

export default NotFound;

