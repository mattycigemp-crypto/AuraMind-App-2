import { useEffect, useState } from "react";

/**
 * The web boot screen.
 *
 * It used to lie in two directions at once. A CSS keyframe filled the bar to
 * 100% over a fixed 1.4s, and a `setTimeout` hid the whole thing after 1800ms
 * — neither connected to whether the app had actually loaded.
 *
 * On a fast boot that meant sitting through an animation after the app was
 * ready. On a slow one it was worse than useless: the bar announced
 * "complete", the loader hid itself, and the user was left on a blank screen
 * while auth was still in flight, with nothing to indicate anything was
 * happening.
 *
 * So the bar is now indeterminate. That is not a downgrade — during boot the
 * app genuinely does not know how long the session check will take, and a
 * sweep says "working, duration unknown" honestly where a filling bar claims
 * knowledge it does not have. It completes only when `ready` is true, which
 * is the one moment a full bar is true.
 *
 * The component no longer hides itself. It is unmounted by its parent when
 * `authChecked` flips, so it is on screen for exactly as long as the app is
 * actually loading.
 */
export function CinematicLoader({ ready = false }: { ready?: boolean }) {
  // Nothing is said for the first beat. Most boots resolve inside it, and
  // flashing "Restoring your session" for 200ms is noise, not information.
  const [phase, setPhase] = useState<"quiet" | "working" | "slow">("quiet");

  useEffect(() => {
    if (ready) return;
    const working = setTimeout(() => setPhase("working"), 1200);
    // Past this point something is genuinely wrong-ish — a cold serverless
    // function, a bad connection. Saying so is more respectful than a
    // spinner that looks identical at second 2 and second 20.
    const slow = setTimeout(() => setPhase("slow"), 6000);
    return () => {
      clearTimeout(working);
      clearTimeout(slow);
    };
  }, [ready]);

  return (
    <div className={`loader-mask ${ready ? "is-ready" : ""}`} role="status" aria-live="polite">
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

      <div className={`loader-bar ${ready ? "is-complete" : ""}`} />

      <p className="loader-status" aria-hidden={phase === "quiet"}>
        {phase === "slow"
          ? "Still restoring your session — this is taking longer than usual."
          : phase === "working"
            ? "Restoring your session…"
            : ""}
      </p>

      <span className="sr-only">
        {ready ? "Ready" : "Loading AuraMind"}
      </span>
    </div>
  );
}
