"use client";

import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import { AccessScreen, BackupScreen, CommsScreen, FormsScreen, LinksScreen, LogosScreen, MenusScreen, MonitoringScreen, PortalScreen, RolesScreen, SettingsScreen, SubsitesScreen, SystemScreen, TicketsScreen, UsersScreen } from "./core/core-screens";
import { AiHubScreen } from "./editorial/ai-hub-screen";
import { AiScreen, OrderScreen, ProcessScreen, SubmissionsScreen, SuggestionsScreen } from "./editorial/other-screens";
import { CartableScreen } from "./editorial/cartable";
import { PitchesScreen } from "./editorial/pitches-screen";
import { CommentsScreen, ContactScreen, ForumScreen, PollsScreen } from "./audience/audience-screens";
import { MediaLibraryScreen } from "./media/media-library-screen";
import { AlbumsScreen } from "./media/albums-screen";
import { EmailScreen, NewsletterScreen, PeopleScreen, RssScreen, SocialScreen, VideosScreen } from "./media/media-screens";
import {
  AdminAffairsScreen,
  DossiersScreen,
  EventMapScreen,
  PayrollScreen,
  PitchPerformanceScreen,
  ReporterPeriodScreen,
} from "./enterprise/enterprise-screens";
import { NewsReportScreen, StaffScreen, TrafficScreen, ViewsScreen } from "./reports/report-screens";
import { AdsScreen, BannersScreen, CalendarScreen, CategoriesScreen, PagesScreen, ServicesScreen, TablesScreen, TickerScreen } from "./structure/structure-screens";
import { ThemeScreen } from "./structure/theme-screen";
import { canAccessModuleKey, moduleKeyFromPath } from "@/lib/module-access";
import { moduleKeyFromParts } from "@/lib/modules";
import { useNewsroom } from "@/lib/store";
import { usePathname } from "next/navigation";
import { UnauthorizedPanel } from "./unauthorized-panel";
import { Page } from "./ui";

const screens: Record<string, () => ReactElement> = {
  "core/system": SystemScreen,
  "core/users": UsersScreen,
  "core/access": AccessScreen,
  "core/settings": SettingsScreen,
  "core/monitoring": MonitoringScreen,
  "core/backup": BackupScreen,
  "core/tickets": TicketsScreen,
  "core/comms": CommsScreen,
  "core/subsites": SubsitesScreen,
  "core/links": LinksScreen,
  "core/logos": LogosScreen,
  "core/forms": FormsScreen,
  "core/menus": MenusScreen,
  "core/roles": RolesScreen,
  "core/portal": PortalScreen,
  "core/admin-affairs": AdminAffairsScreen,
  "editorial/ai": AiScreen,
  "editorial/ai-hub": AiHubScreen,
  "editorial/cartable": CartableScreen,
  "editorial/pitches": PitchesScreen,
  "editorial/process": ProcessScreen,
  "editorial/submissions": SubmissionsScreen,
  "editorial/order": OrderScreen,
  "editorial/suggestions": SuggestionsScreen,
  "media/library": MediaLibraryScreen,
  "media/albums": AlbumsScreen,
  "media/videos": VideosScreen,
  "media/rss": RssScreen,
  "media/newsletter": NewsletterScreen,
  "media/social": SocialScreen,
  "media/email": EmailScreen,
  "media/people": PeopleScreen,
  "media/event-map": EventMapScreen,
  "audience/comments": CommentsScreen,
  "audience/polls": PollsScreen,
  "audience/contact": ContactScreen,
  "audience/forum": ForumScreen,
  "reports/news-report": NewsReportScreen,
  "reports/views": ViewsScreen,
  "reports/staff": StaffScreen,
  "reports/pitch-performance": PitchPerformanceScreen,
  "reports/payroll": PayrollScreen,
  "reports/reporter-period": ReporterPeriodScreen,
  "reports/traffic": TrafficScreen,
  "structure/categories": CategoriesScreen,
  "structure/services": ServicesScreen,
  "structure/pages": PagesScreen,
  "structure/tables": TablesScreen,
  "structure/ads": AdsScreen,
  "structure/banners": BannersScreen,
  "structure/ticker": TickerScreen,
  "structure/calendar": CalendarScreen,
  "structure/theme": ThemeScreen,
  "structure/dossiers": DossiersScreen,
};

export function ModuleScreen() {
  const params = useParams<{ group: string; slug: string }>();
  const path = usePathname();
  const { data } = useNewsroom();
  const group = Array.isArray(params.group) ? params.group[0] : params.group;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const key = group && slug ? moduleKeyFromParts(group, slug) : moduleKeyFromPath(path);
  if (key && !canAccessModuleKey(data, key)) {
    return <UnauthorizedPanel />;
  }
  const Screen = screens[`${group}/${slug}`];
  if (!Screen) {
    return <Page title="این بخش پیدا نشد" description="از منوی بخش‌ها یکی را انتخاب کنید." />;
  }
  return <Screen />;
}
