"use client";

import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import { AccessScreen, BackupScreen, CommsScreen, FormsScreen, LinksScreen, LogosScreen, MenusScreen, MonitoringScreen, PortalScreen, RolesScreen, SettingsScreen, SubsitesScreen, SystemScreen, TicketsScreen, UsersScreen } from "./core/core-screens";
import { AiHubScreen } from "./editorial/ai-hub-screen";
import { AiScreen, OrderScreen, ProcessScreen, SubmissionsScreen, SuggestionsScreen } from "./editorial/other-screens";
import { CartableScreen } from "./editorial/cartable";
import { OfficialContactsScreen, ReporterAgendaScreen } from "./editorial/contacts-agenda-screens";
import { PitchesScreen } from "./editorial/pitches-screen";
import { CommentsScreen, ContactScreen, ForumScreen, PollsScreen } from "./audience/audience-screens";
import { MediaLibraryScreen } from "./media/media-library-screen";
import { AlbumsScreen } from "./media/albums-screen";
import { PeopleScreen } from "./media/people-screen";
import {
  ReporterAdminAffairsScreen,
  ReporterMyAgendaScreen,
  ReporterMyNewsScreen,
  ReporterMyPitchesScreen,
  ReporterMyProfileScreen,
  ReporterPayrollScreen,
} from "./reporters/reporter-screens";
import { EmailScreen, NewsletterScreen, RssScreen, SocialScreen, VideosScreen } from "./media/media-screens";
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
  "infra/system": SystemScreen,
  "infra/settings": SettingsScreen,
  "infra/monitoring": MonitoringScreen,
  "infra/backup": BackupScreen,
  "infra/portal": PortalScreen,
  "admin/users": UsersScreen,
  "admin/access": AccessScreen,
  "admin/tickets": TicketsScreen,
  "admin/comms": CommsScreen,
  "admin/official-contacts": OfficialContactsScreen,
  "admin/roles": RolesScreen,
  "admin/admin-affairs": AdminAffairsScreen,
  "template/subsites": SubsitesScreen,
  "structure/links": LinksScreen,
  "template/logos": LogosScreen,
  "template/forms": FormsScreen,
  "template/menus": MenusScreen,
  "template/theme": ThemeScreen,
  "template/pages": PagesScreen,
  "template/rss": RssScreen,
  "template/newsletter": NewsletterScreen,
  "template/social": SocialScreen,
  "template/email": EmailScreen,
  "editorial/ai": AiScreen,
  "editorial/ai-hub": AiHubScreen,
  "editorial/cartable": CartableScreen,
  "reporters/my-profile": ReporterMyProfileScreen,
  "reporters/my-news": ReporterMyNewsScreen,
  "reporters/my-payroll": ReporterPayrollScreen,
  "reporters/my-admin-affairs": ReporterAdminAffairsScreen,
  "reporters/my-pitches": ReporterMyPitchesScreen,
  "reporters/my-agenda": ReporterMyAgendaScreen,
  "editorial/pitches": PitchesScreen,
  "editorial/agenda": ReporterAgendaScreen,
  "editorial/process": ProcessScreen,
  "editorial/submissions": SubmissionsScreen,
  "editorial/order": OrderScreen,
  "editorial/suggestions": SuggestionsScreen,
  "media/library": MediaLibraryScreen,
  "media/albums": AlbumsScreen,
  "media/videos": VideosScreen,
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
  "structure/tables": TablesScreen,
  "structure/ads": AdsScreen,
  "structure/banners": BannersScreen,
  "structure/ticker": TickerScreen,
  "structure/calendar": CalendarScreen,
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
