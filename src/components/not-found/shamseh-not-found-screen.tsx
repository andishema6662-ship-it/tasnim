"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SHAMSEH_MEDIA_NAME } from "@/lib/branding";
import { ADMIN_BASE } from "@/lib/routes";
import "./shamseh-not-found.css";

function randomDigit(): string {
  return String(Math.floor(Math.random() * 9) + 1);
}

export function ShamsehNotFoundScreen() {
  const [d1, setD1] = useState("4");
  const [d2, setD2] = useState("0");
  const [d3, setD3] = useState("4");

  useEffect(() => {
    let tick = 0;
    const interval = window.setInterval(() => {
      tick += 1;
      if (tick <= 40) setD3(randomDigit());
      else setD3("4");
      if (tick <= 80) setD2(randomDigit());
      else setD2("0");
      if (tick <= 100) setD1(randomDigit());
      else setD1("4");
      if (tick > 100) window.clearInterval(interval);
    }, 30);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="shamseh-404" data-testid="shamseh-404-page">
      <p className="shamseh-404__brand">{SHAMSEH_MEDIA_NAME}</p>
      <div className="shamseh-404__stage" aria-hidden="true">
        <div className="shamseh-404__bubble">
          اوه!
          <span className="shamseh-404__bubble-tail" />
        </div>
        <div className="shamseh-404__clip">
          <div className="shamseh-404__shadow">
            <span className="shamseh-404__digit">{d3}</span>
          </div>
        </div>
        <div className="shamseh-404__clip">
          <div className="shamseh-404__shadow">
            <span className="shamseh-404__digit">{d2}</span>
          </div>
        </div>
        <div className="shamseh-404__clip">
          <div className="shamseh-404__shadow">
            <span className="shamseh-404__digit">{d1}</span>
          </div>
        </div>
      </div>
      <h1 className="shamseh-404__title">صفحه پیدا نشد</h1>
      <p className="shamseh-404__lead">
        آدرسی که وارد کرده‌اید وجود ندارد یا جابه‌جا شده است. می‌توانید به صفحهٔ اصلی خبر برگردید یا وارد پنل شوید.
      </p>
      <div className="shamseh-404__actions">
        <Link href="/" className="shamseh-404__btn shamseh-404__btn--primary" data-testid="not-found-home">
          بازگشت به صفحهٔ اصلی
        </Link>
        <Link href={ADMIN_BASE} className="shamseh-404__btn shamseh-404__btn--ghost" data-testid="not-found-admin">
          پنل مدیریت
        </Link>
      </div>
    </main>
  );
}
