"use client";

import { faNum } from "@/lib/format";
import { resolveLiveWidgets } from "@/lib/live-widgets";
import { resolveTemplateSettings } from "@/lib/template";
import { useNewsroom } from "@/lib/store";
import { LiveWidgetSection } from "./portal-widget-embed";

function pseudoRates(seed: number) {
  const usd = 58_200 + (seed % 400);
  const eur = 63_100 + (seed % 350);
  const gold = 3_450_000 + (seed % 50_000);
  const coin = 38_500_000 + (seed % 200_000);
  return { usd, eur, gold, coin };
}

export function PortalWidgetsSidebar() {
  const { data } = useNewsroom();
  const theme = resolveTemplateSettings(data);
  const live = resolveLiveWidgets(theme);
  const anyEnabled =
    live.rates.enabled ||
    live.weather.enabled ||
    live.league.enabled ||
    live.customSlots.some((slot) => slot.enabled);
  if (!anyEnabled) return null;

  const seed = new Date().getDate();
  const rates = pseudoRates(seed);
  const cities = (live.weather.cities ?? "")
    .split(/[،,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <aside className="space-y-4" data-testid="portal-widgets">
      <LiveWidgetSection
        title={live.rates.title}
        enabled={live.rates.enabled}
        embedCode={live.rates.embedCode}
        testId="portal-widget-rates"
        fallback={
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>دلار</span><span dir="ltr">{faNum(rates.usd)}</span></li>
            <li className="flex justify-between"><span>یورو</span><span dir="ltr">{faNum(rates.eur)}</span></li>
            <li className="flex justify-between"><span>طلای ۱۸</span><span dir="ltr">{faNum(rates.gold)}</span></li>
            <li className="flex justify-between"><span>سکه</span><span dir="ltr">{faNum(rates.coin)}</span></li>
          </ul>
        }
      />
      <LiveWidgetSection
        title={live.weather.title}
        enabled={live.weather.enabled}
        embedCode={live.weather.embedCode}
        testId="portal-widget-weather"
        fallback={
          <ul className="space-y-2 text-sm">
            {cities.map((city, index) => (
              <li key={city} className="flex justify-between">
                <span>{city}</span>
                <span>{faNum(18 + ((seed + index) % 12))}° · {index % 2 ? "ابری" : "آفتابی"}</span>
              </li>
            ))}
          </ul>
        }
      />
      <LiveWidgetSection
        title={live.league.title}
        enabled={live.league.enabled}
        embedCode={live.league.embedCode}
        testId="portal-widget-league"
        fallback={
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted">
                <th className="py-1 text-right">تیم</th>
                <th className="py-1">امتیاز</th>
              </tr>
            </thead>
            <tbody>
              {["پرسپولیس", "استقلال", "سپاهان", "تراکتور"].map((team, index) => (
                <tr key={team} className="border-t border-line/60">
                  <td className="py-1.5">{team}</td>
                  <td className="py-1.5 text-center">{faNum(42 - index * 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />
      {live.customSlots
        .filter((slot) => slot.enabled)
        .map((slot) => (
          <LiveWidgetSection
            key={slot.id}
            title={slot.title || "ویجت سفارشی"}
            enabled={true}
            embedCode={slot.embedCode}
            testId={`portal-widget-custom-${slot.id}`}
            fallback={<p className="text-sm text-muted">کد اسکریپت ویجت سفارشی را در تنظیمات قالب وارد کنید.</p>}
          />
        ))}
    </aside>
  );
}
