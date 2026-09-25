"use client";

import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import { AccessScreen, BackupScreen, CommsScreen, FormsScreen, LinksScreen, LogosScreen, MenusScreen, MonitoringScreen, PortalScreen, RolesScreen, SettingsScreen, SubsitesScreen, SystemScreen, TicketsScreen, UsersScreen } from "./core/core-screens";
import { AiScreen, OrderScreen, ProcessScreen, SubmissionsScreen, SuggestionsScreen } from "./editorial/other-screens";
import { CartableScreen } from "./editorial/cartable";
import { CommentsScreen, ContactScreen, ForumScreen, PollsScreen } from "./audience/audience-screens";
import { AlbumsScreen, EmailScreen, NewsletterScreen, PeopleScreen, RssScreen, SocialScreen, VideosScreen } from "./media/media-screens";
import { NewsReportScreen, StaffScreen, TrafficScreen, ViewsScreen } from "./reports/report-screens";
import { BannersScreen, CalendarScreen, CategoriesScreen, PagesScreen, ServicesScreen, TablesScreen, TagsScreen, TickerScreen } from "./structure/structure-screens";
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
  "editorial/ai": AiScreen,
  "editorial/cartable": CartableScreen,
  "editorial/process": ProcessScreen,
  "editorial/submissions": SubmissionsScreen,
  "editorial/order": OrderScreen,
  "editorial/suggestions": SuggestionsScreen,
  "media/albums": AlbumsScreen,
  "media/videos": VideosScreen,
  "media/rss": RssScreen,
  "media/newsletter": NewsletterScreen,
  "media/social": SocialScreen,
  "media/email": EmailScreen,
  "media/people": PeopleScreen,
  "audience/comments": CommentsScreen,
  "audience/polls": PollsScreen,
  "audience/contact": ContactScreen,
  "audience/forum": ForumScreen,
  "reports/news-report": NewsReportScreen,
  "reports/views": ViewsScreen,
  "reports/staff": StaffScreen,
  "reports/traffic": TrafficScreen,
  "structure/categories": CategoriesScreen,
  "structure/services": ServicesScreen,
  "structure/tags": TagsScreen,
  "structure/pages": PagesScreen,
  "structure/tables": TablesScreen,
  "structure/banners": BannersScreen,
  "structure/ticker": TickerScreen,
  "structure/calendar": CalendarScreen,
};

export function ModuleScreen() {
  const params = useParams<{ group: string; slug: string }>();
  const group = Array.isArray(params.group) ? params.group[0] : params.group;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const Screen = screens[`${group}/${slug}`];
  if (!Screen) {
    return <Page title="این بخش پیدا نشد" description="از منوی بخش‌ها یکی را انتخاب کنید." />;
  }
  return <Screen />;
}
