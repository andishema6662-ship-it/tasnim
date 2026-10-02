import type { LiveWidgetSlotSettings, LiveWidgetsSettings, TemplateSettings } from "./types";

export const LIVE_WIDGET_DEFAULT_TITLES = {
  weather: "آب و هوا",
  rates: "نرخ ارز و طلا",
  league: "جدول لیگ فوتبال",
} as const;

export function defaultLiveWidgetsSettings(): LiveWidgetsSettings {
  return {
    weather: { enabled: true, title: LIVE_WIDGET_DEFAULT_TITLES.weather, embedCode: "", cities: "تهران، مشهد، اصفهان" },
    rates: { enabled: true, title: LIVE_WIDGET_DEFAULT_TITLES.rates, embedCode: "" },
    league: { enabled: true, title: LIVE_WIDGET_DEFAULT_TITLES.league, embedCode: "" },
    customSlots: [],
  };
}

export function resolveLiveWidgets(raw: Partial<TemplateSettings> | undefined): LiveWidgetsSettings {
  const defaults = defaultLiveWidgetsSettings();
  const fromLive = raw?.liveWidgets;
  if (fromLive) {
    return {
      ...defaults,
      ...fromLive,
      weather: { ...defaults.weather, ...fromLive.weather },
      rates: { ...defaults.rates, ...fromLive.rates },
      league: { ...defaults.league, ...fromLive.league },
      customSlots: fromLive.customSlots ?? [],
    };
  }
  const legacy = raw?.portalWidgets;
  if (!legacy) return defaults;
  return {
    weather: {
      enabled: legacy.showWeather ?? defaults.weather.enabled,
      title: defaults.weather.title,
      embedCode: "",
      cities: legacy.weatherCities ?? defaults.weather.cities,
    },
    rates: { enabled: legacy.showRates ?? defaults.rates.enabled, title: defaults.rates.title, embedCode: "" },
    league: { enabled: legacy.showLeague ?? defaults.league.enabled, title: defaults.league.title, embedCode: "" },
    customSlots: [],
  };
}

/** Keep legacy portalWidgets in sync for older readers */
export function portalWidgetsFromLive(live: LiveWidgetsSettings): TemplateSettings["portalWidgets"] {
  return {
    showRates: live.rates.enabled,
    showWeather: live.weather.enabled,
    showLeague: live.league.enabled,
    weatherCities: live.weather.cities ?? "",
  };
}
