"use client";

import { faNum } from "@/lib/format";
import { resolveTemplateSettings } from "@/lib/template";
import { useNewsroom } from "@/lib/store";

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
  const widgets = theme.portalWidgets;
  if (!widgets.showRates && !widgets.showWeather && !widgets.showLeague) return null;
  const seed = new Date().getDate();
  const rates = pseudoRates(seed);
  const cities = widgets.weatherCities.split(/[،,]/).map((item) => item.trim()).filter(Boolean).slice(0, 4);

  return (
    <aside className="space-y-4" data-testid="portal-widgets">
      {widgets.showRates ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="border-r-4 border-[var(--portal-primary)] pr-2 text-sm font-bold">نرخ ارز و طلا</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between"><span>دلار</span><span dir="ltr">{faNum(rates.usd)}</span></li>
            <li className="flex justify-between"><span>یورو</span><span dir="ltr">{faNum(rates.eur)}</span></li>
            <li className="flex justify-between"><span>طلای ۱۸</span><span dir="ltr">{faNum(rates.gold)}</span></li>
            <li className="flex justify-between"><span>سکه</span><span dir="ltr">{faNum(rates.coin)}</span></li>
          </ul>
        </section>
      ) : null}
      {widgets.showWeather ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="border-r-4 border-[var(--portal-primary)] pr-2 text-sm font-bold">آب و هوا</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cities.map((city, index) => (
              <li key={city} className="flex justify-between">
                <span>{city}</span>
                <span>{faNum(18 + ((seed + index) % 12))}° · {index % 2 ? "ابری" : "آفتابی"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {widgets.showLeague ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="border-r-4 border-[var(--portal-primary)] pr-2 text-sm font-bold">جدول لیگ</h2>
          <table className="mt-3 w-full text-xs">
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
        </section>
      ) : null}
    </aside>
  );
}
