"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SHAMSEH_FULL_TITLE, SHAMSEH_MEDIA_NAME } from "@/lib/branding";
import { cn } from "./ui";

const MIN_VISIBLE_MS = 1900;
const FADE_MS = 520;

export function ShamsehSplash({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-5 px-6", className)}
      data-testid="shamseh-splash"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری سامانه شمسه"
    >
      <div className="shamseh-logo-wrap relative w-[min(72vw,17.5rem)] aspect-square">
        <svg viewBox="0 0 256 256" className="h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="shamsehGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0d078" />
              <stop offset="50%" stopColor="#d4a84b" />
              <stop offset="100%" stopColor="#b8862e" />
            </linearGradient>
          </defs>
          <g className="shamseh-petals">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <path
                key={deg}
                className="shamseh-petal"
                style={{ animationDelay: `${0.05 + i * 0.06}s`, ["--from-rot" as string]: `${deg - 180}deg` }}
                d="M128 28 L148 78 L198 88 L158 118 L168 168 L128 138 L88 168 L98 118 L58 88 L108 78 Z"
                transform={`rotate(${deg} 128 128)`}
                fill="none"
                stroke="#2f4f8a"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
          <g className="shamseh-sunburst" style={{ transformOrigin: "128px 128px" }}>
            <polygon
              fill="url(#shamsehGold)"
              points="128,52 134,96 178,102 142,124 152,168 128,144 104,168 114,124 78,102 122,96"
            />
            <circle cx="128" cy="128" r="42" fill="url(#shamsehGold)" />
          </g>
          <circle className="shamseh-core" cx="128" cy="128" r="28" fill="#fff" stroke="#e8e8ec" strokeWidth="2" />
          <path
            className="shamseh-nib"
            d="M128 108 L138 148 L128 142 L118 148 Z M128 108 L128 98 M124 104 L132 104"
            fill="#8a919e"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transformOrigin: "128px 138px" }}
          />
        </svg>
      </div>
      <div className="shamseh-title-block max-w-sm text-center">
        <p className="shamseh-title m-0 bg-gradient-to-l from-[#272b41] via-[#8231d3] to-[#2f4f8a] bg-clip-text text-lg font-extrabold leading-relaxed text-transparent sm:text-xl">
          {SHAMSEH_FULL_TITLE}
        </p>
        <p className="shamseh-subtitle mt-1 text-sm text-muted">{SHAMSEH_MEDIA_NAME}</p>
      </div>
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
          "fixed inset-0 z-[100] grid place-items-center bg-paper transition-opacity duration-500 ease-out",
          phase === "fade" && "pointer-events-none opacity-0",
        )}
        style={{ willChange: "opacity" }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: "radial-gradient(ellipse at 50% 28%, #f8f4ff 0%, #f4f5f7 50%, #ebe8f2 100%)",
          }}
        />
        <ShamsehSplash className="relative z-10" />
      </div>
      {ready ? <div className={cn("min-h-screen", phase === "splash" && "invisible")}>{children}</div> : null}
    </div>
  );
}
