"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "./ui";

const MIN_VISIBLE_MS = 2400;
const FADE_MS = 520;
const WEDGE_COUNT = 12;
const SPLASH_BASE = "/shamseh-splash";

function EmblemAssembly({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-square w-[min(78vw,20rem)]", className)}>
      {Array.from({ length: WEDGE_COUNT }, (_, i) => (
        <img
          key={i}
          src={`${SPLASH_BASE}/wedge-${String(i).padStart(2, "0")}.png`}
          alt=""
          className="shamseh-wedge absolute inset-0 h-full w-full object-contain"
          style={{ animationDelay: `${0.08 + i * 0.045}s` }}
          draggable={false}
        />
      ))}
      <img
        src={`${SPLASH_BASE}/layer-ring.png`}
        alt=""
        className="shamseh-layer-ring absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <img
        src={`${SPLASH_BASE}/layer-sun.png`}
        alt=""
        className="shamseh-layer-sun absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <img
        src={`${SPLASH_BASE}/layer-core.png`}
        alt=""
        className="shamseh-layer-core-img absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}

export function ShamsehSplash({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 px-4", className)}
      data-testid="shamseh-splash"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری سامانه شمسه"
    >
      <EmblemAssembly />
      <img
        src={`${SPLASH_BASE}/text-band.png`}
        alt="شمسه — سامانه تحریریه خبر"
        className="shamseh-text-band w-[min(92vw,32rem)] max-w-full object-contain"
        draggable={false}
      />
    </div>
  );
}

/** Shows splash until ready, then fades out before revealing children. */
export function ShamsehSplashGate({ ready, children }: { ready: boolean; children: ReactNode }) {
  const [phase, setPhase] = useState<"splash" | "fade" | "done">("splash");
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - mountedAt;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const t1 = window.setTimeout(() => setPhase("fade"), wait);
    const t2 = window.setTimeout(() => setPhase("done"), wait + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready, mountedAt]);

  if (phase === "done") return <>{children}</>;

  return (
    <div className="relative min-h-screen">
      <div
        className={cn(
          "fixed inset-0 z-[100] grid place-items-center bg-[#f0eeea] transition-opacity duration-500 ease-out",
          phase === "fade" && "pointer-events-none opacity-0",
        )}
        style={{ willChange: "opacity" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 32%, #faf8f5 0%, #f0eeea 55%, #e8e4de 100%)",
          }}
        />
        <ShamsehSplash className="relative z-10" />
      </div>
      {ready ? <div className={cn("min-h-screen", phase === "splash" && "invisible")}>{children}</div> : null}
    </div>
  );
}
