import { useEffect, useState } from "react";

export function CinematicLoader() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`loader-mask ${hidden ? "hidden" : ""}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/auramind/video/loading-screen-poster.jpg"
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 object-cover opacity-60"
      >
        <source src="/auramind/video/loading-screen.webm" type="video/webm" />
        <source src="/auramind/video/loading-screen.mp4" type="video/mp4" />
      </video>
      <div className="loader-wordmark relative z-10">
        <span style={{ animationDelay: "0ms" }}>Aura</span>
        <span className="font-serif italic text-violet-400">Mind</span>
      </div>
      <div className="loader-bar" />
    </div>
  );
}
