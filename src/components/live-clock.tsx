"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const pad = (n: number) => new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(n);
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());

  return (
    <li data-testid="live-clock">
      <span className="font-semibold text-ink/70">ساعت زنده:</span>{" "}
      <span className="tabular-nums font-bold text-primary">{h}:{m}:{s}</span>
    </li>
  );
}
