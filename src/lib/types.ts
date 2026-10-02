import type { ChangelogRelease } from "./changelog";

export type Status = "draft" | "editing" | "review" | "ready" | "published" | "archived";

export type RoleBase = "publisher" | "chief" | "reporter";

export interface Permissions {
  write: boolean;
  review: boolean;
  publish: boolean;
  archive: boolean;
  manageUsers: boolean;
  manageStructure: boolean;
}

export interface RoleDef {
  id: string;
  name: string;
  base: RoleBase;
  permissions: Permissions;
}

export type ReporterGrade = "trainee" | "junior" | "senior" | "desk-chief";

export interface User {
  id: string;
  name: string;
  username: string;
  roleId: string;
  active: boolean;
  reporterGrade?: ReporterGrade;
  /** تصویر پرسنلی (data URL یا آدرس کتابخانه) */
  avatar?: string;
}

export interface AccessRule {
  roleId: string;
  categoryId: string;
  edit: boolean;
  publish: boolean;
}

export interface Settings {
  newsroomName: string;
  tagline: string;
  pageSize: number;
  mediaName: string;
  mediaDisplayTitle: string;
  brandMark: string;
}

export type ThemePalette = "ordibehesht" | "news-blue" | "green" | "navy" | "custom";
export type HomeLayoutStyle = "classic" | "modern-grid" | "magazine";
export type ThemeFontFamily = "vazirmatn" | "sahel" | "shabnam";
export type ThemeFontScale = "sm" | "md" | "lg";

export type HeroSourceMode = "pinned" | "latest-category" | "latest-all";
export type HotStoriesSort = "views" | "latest" | "home-order";
export type SlotContentKind = "internal" | "rss";
export type TickerSourceMode = "manual" | "category" | "tag" | "service" | "rss" | "mixed";

export interface RssSlotRef {
  feedId: string;
  inlineTitle: string;
  inlineUrl: string;
}

export interface CategoryShowcaseBlock {
  kind: SlotContentKind;
  categoryId: string;
  rss: RssSlotRef;
}

export interface HomepageTickerSlot {
  enabled: boolean;
  label: string;
  source: TickerSourceMode;
  categoryId: string;
  serviceId: string;
  tag: string;
  rss: RssSlotRef;
  includeManual: boolean;
  limit: number;
}

export interface HomepageSlots {
  hero: { contentKind: SlotContentKind; source: HeroSourceMode; categoryId: string; rss: RssSlotRef };
  featuredSide: { contentKind: SlotContentKind; categoryId: string; limit: number; rss: RssSlotRef };
  editorialPicks: { contentKind: SlotContentKind; categoryId: string; limit: number; rss: RssSlotRef };
  categoryShowcase: { blocks: CategoryShowcaseBlock[]; storiesPerBlock: number };
  hot: { sort: HotStoriesSort; limit: number; categoryId: string };
  photos: { limit: number; featuredOnly: boolean };
  multimedia: { enabled: boolean; limit: number };
  ticker: HomepageTickerSlot;
}

export interface PortalBrandingSettings {
  mediaName: string;
  mediaDisplayTitle: string;
  brandMark: string;
}

export interface PortalHeaderBannerSettings {
  enabled: boolean;
  image: string;
  href: string;
}

export interface LiveWidgetSlotSettings {
  enabled: boolean;
  title: string;
  embedCode: string;
  /** فقط آب‌وهوا — شهرهای پیش‌فرض وقتی embed خالی است */
  cities?: string;
}

export interface LiveWidgetCustomSlot extends LiveWidgetSlotSettings {
  id: string;
}

export interface LiveWidgetsSettings {
  weather: LiveWidgetSlotSettings;
  rates: LiveWidgetSlotSettings;
  league: LiveWidgetSlotSettings;
  customSlots: LiveWidgetCustomSlot[];
}

export interface TemplateSettings {
  palette: ThemePalette;
  customPrimary: string;
  customAccent: string;
  homeLayout: HomeLayoutStyle;
  showTriCalendar: boolean;
  showLiveClock: boolean;
  showLanguageToggle: boolean;
  showBreakingTicker: boolean;
  tickerLabel: string;
  aboutFooter: string;
  copyrightText: string;
  socialTelegram: string;
  socialInstagram: string;
  socialYoutube: string;
  fontFamily: ThemeFontFamily;
  fontScale: ThemeFontScale;
  portalBranding: PortalBrandingSettings;
  portalHeaderBanner: PortalHeaderBannerSettings;
  homepageSlots: HomepageSlots;
  ershadLicense: { enabled: boolean; code: string; badgeImage: string };
  /** ویجت‌های زنده — کد embed هر بخش */
  liveWidgets: LiveWidgetsSettings;
  portalWidgets: {
    showRates: boolean;
    showWeather: boolean;
    showLeague: boolean;
    weatherCities: string;
  };
}

export type PitchStatus = "active" | "completed" | "cancelled";
export type PitchPriority = "low" | "normal" | "high";
export type PitchAudience = "all_reporters" | "specific";

export type PitchContentType =
  | "photo-report"
  | "analytical-note"
  | "interview"
  | "field-report"
  | "press-coverage";

export type StoryGrade = 1 | 2 | 3;

export interface NewsPitch {
  id: string;
  title: string;
  topic: string;
  categoryId: string;
  description: string;
  audience: PitchAudience;
  assigneeUserId?: string;
  deadline?: string;
  priority: PitchPriority;
  status: PitchStatus;
  contentType?: PitchContentType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  lead: string;
  body: string;
  cover: string;
  imagePrompt: string;
  audioScript: string;
  categoryId: string;
  serviceId: string;
  tags: string[];
  status: Status;
  author: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  pitchId?: string;
  grade?: StoryGrade;
}

export interface Step {
  status: Status;
  label: string;
  note: string;
}

export interface Transition {
  id: string;
  from: Status;
  to: Status;
  label: string;
  actor: RoleBase;
  enabled: boolean;
}

export interface Submission {
  id: string;
  title: string;
  lead: string;
  body: string;
  categoryId: string;
  author: string;
  status: "new" | "accepted" | "rejected";
  note: string;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  storyId: string;
  serviceId: string;
  note: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Photo {
  id: string;
  caption: string;
  src: string;
}

export type AlbumPlacement = "home_featured" | "service" | "dedicated" | "slider";
export type AlbumStatus = "draft" | "published";

export interface Album {
  id: string;
  title: string;
  description: string;
  photographer: string;
  photos: Photo[];
  placement: AlbumPlacement;
  serviceId: string;
  status: AlbumStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  fileName: string;
  src: string;
  width: number;
  height: number;
  mimeType: string;
  createdAt: string;
  alt?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  duration: string;
  summary: string;
  published: boolean;
  source?: "url" | "upload";
  fileName?: string;
}

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
}

export interface Feed {
  id: string;
  title: string;
  url: string;
  items: FeedItem[];
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface Issue {
  id: string;
  subject: string;
  body: string;
  status: "draft" | "queued";
  createdAt: string;
}

export interface SocialPost {
  id: string;
  channel: string;
  text: string;
  storyId: string;
  status: "draft" | "ready";
  createdAt: string;
}

export interface Mail {
  id: string;
  folder: "inbox" | "drafts" | "outbox";
  from: string;
  to: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  bio: string;
  kind: string;
  visible: boolean;
  avatarUrl?: string;
  joinedAt?: string;
  editorialRank?: string;
  phone?: string;
  email?: string;
  desk?: string;
  /** رتبه ۱ تا ۵ — اعطا توسط سردبیر */
  reporterTier?: number;
  tierNote?: string;
  interviewCount?: number;
  userId?: string;
}

export interface Block {
  id: string;
  type: "heading" | "text" | "story";
  text: string;
  storyId: string;
}

export interface NewsPage {
  id: string;
  title: string;
  blocks: Block[];
}

export type TablePlacement = "story-attach" | "dedicated-page" | "home" | "service-sports" | "service-economy";

export interface NewsTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
  placement: TablePlacement;
  attachStoryId?: string;
}

export interface Ad {
  id: string;
  title: string;
  placement: string;
  image: string;
  href: string;
  active: boolean;
}

export interface Banner {
  id: string;
  title: string;
  text: string;
  href: string;
  placement: string;
  active: boolean;
}

export interface TickerItem {
  id: string;
  text: string;
  active: boolean;
}

export interface CalEvent {
  id: string;
  title: string;
  date: string;
  place: string;
  note: string;
}

export type UpcomingEventKind = "press-brief" | "exhibition" | "conference" | "other";
export type UpcomingEventRange = "week" | "month" | "year";
export type UpcomingEventStatus = "pending" | "approved";

export interface EditorialUpcomingEvent {
  id: string;
  title: string;
  kind: UpcomingEventKind;
  organizer: string;
  place: string;
  startsAt: string;
  status: UpcomingEventStatus;
  createdByUserId: string;
  createdByName: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  body: string;
  status: "open" | "pending" | "closed";
  author: string;
  /** preset id (chief, publisher, …) or user:userId */
  recipient: string;
  createdAt: string;
}

export interface Note {
  id: string;
  from: string;
  to: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Subsite {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  group: string;
}

export interface Logo {
  id: string;
  name: string;
  usage: string;
  color: string;
}

export interface FormDef {
  id: string;
  name: string;
  fields: string[];
  active: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
}

export interface PortalConfig {
  url: string;
  note: string;
  enabled: boolean;
  lastCheck: string;
}

export interface Comment {
  id: string;
  storyId: string;
  author: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  closed: boolean;
  shortCode: string;
  showOnHomepage: boolean;
}

export interface ContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: "new" | "seen" | "closed";
  createdAt: string;
}

export interface ContactPageSettings {
  intro: string;
  phones: string;
  address: string;
  email: string;
}

export interface ForumPost {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  title: string;
  posts: ForumPost[];
}

export interface Activity {
  id: string;
  at: string;
  text: string;
}

export type AiTaskKind = "transcribe" | "polish" | "origin" | "extras";

export interface AiTaskLogEntry {
  id: string;
  kind: AiTaskKind;
  inputSummary: string;
  outputSummary: string;
  createdAt: string;
}

export interface PayrollRate {
  id: string;
  contentType: string;
  label: string;
  amount: number;
}

export interface SocialChannelConfig {
  id: string;
  channel: "telegram" | "bale" | "eitaa" | "rubika" | "x";
  enabled: boolean;
  template: string;
}

export interface VersionEntry {
  id: string;
  version: string;
  releasedAt: string;
  notes: string;
}

export interface AdminLetterTemplate {
  id: string;
  title: string;
  body: string;
  kind: "intro" | "certificate" | "letter" | "press-card";
}

export interface SpecialDossier {
  id: string;
  title: string;
  poster: string;
  description: string;
  tags: string[];
  storyIds: string[];
  featuredOnHome: boolean;
}

export type EventMapPointKind = "checkpoint" | "gather" | "rally" | "origin" | "destination" | "waypoint";

export interface EventMapPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  kind?: EventMapPointKind;
  /** مختصات جغرافیایی روی نقشه ایران */
  lat?: number;
  lng?: number;
}

export type EventMapStyle = "light" | "dark" | "brand";

export interface EventMapProject {
  id: string;
  title: string;
  points: EventMapPoint[];
  routeOrder: string[];
  embedCode: string;
  mapStyle?: EventMapStyle;
  centerLat?: number;
  centerLng?: number;
  mapZoom?: number;
  /** استان / منطقه مبنا */
  regionId?: string;
  description?: string;
  eventDate?: string;
  /** نمای قفل‌شده پس از مرحله زوم */
  viewLocked?: boolean;
  viewCenterLat?: number;
  viewCenterLng?: number;
  viewZoom?: number;
}

export interface EventMapDefaults {
  defaultRegionId: string;
}

export interface OfficialContact {
  id: string;
  fullName: string;
  organization: string;
  position: string;
  mobile: string;
  officePhone: string;
  email: string;
  editorialNotes: string;
  tags: string[];
}

export type TodoPriority = "low" | "normal" | "high";

export interface ReporterTodo {
  id: string;
  userId: string;
  title: string;
  done: boolean;
  favorite: boolean;
  priority: TodoPriority;
  sortOrder: number;
  dueAt: string;
  createdAt: string;
}

export type StickyNoteLabel = "personal" | "work" | "important" | "urgent";

export interface ReporterStickyNote {
  id: string;
  userId: string;
  title: string;
  body: string;
  label: StickyNoteLabel;
  color: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FileShareScope = "user" | "management" | "all_reporters" | "editorial_group";

export interface ReporterFileShare {
  scope: FileShareScope;
  userId?: string;
  editorialGroup?: string;
  canDownload: boolean;
}

export interface ReporterFileEntry {
  id: string;
  ownerUserId: string;
  parentId: string | null;
  name: string;
  kind: "folder" | "file";
  sizeBytes: number;
  mime: string;
  sharedWith: ReporterFileShare[];
  createdAt: string;
  dataUrl?: string;
  lastModified?: string;
}

export interface ChatThread {
  id: string;
  kind: "direct" | "group";
  title: string;
  participantIds: string[];
  lastPreview: string;
  lastAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  attachmentName?: string;
  dataUrl?: string;
  reaction?: string;
}

export interface ChatReadCursor {
  userId: string;
  threadId: string;
  lastReadAt: string;
}

export interface SocialBotCredentials {
  telegram: { token: string; channelId: string };
  bale: { token: string; channelId: string };
  eitaa: { token: string; channelId: string };
  rubika: { token: string; channelId: string };
  twitter: { apiKey: string; bearerToken: string };
  messageTemplate: string;
  lastTestAt?: string;
  lastTestOk?: boolean;
}

export interface ReporterStorageQuota {
  userId: string;
  quotaBytes: number;
}

export type AnnouncementPriority = "normal" | "important" | "urgent";

export type AnnouncementTarget =
  | { type: "all_reporters" }
  | { type: "editorial_group"; group: string }
  | { type: "user"; userId: string };

export interface EditorialAnnouncement {
  id: string;
  authorUserId: string;
  authorName: string;
  authorRole: "publisher" | "chief";
  title: string;
  body: string;
  imageUrl?: string;
  priority: AnnouncementPriority;
  target: AnnouncementTarget;
  pinnedUntil: string | null;
  createdAt: string;
}

export type PayrollApprovalStatus = "pending" | "approved";

export interface PayrollApproval {
  id: string;
  userId: string;
  year: number;
  month: number;
  status: PayrollApprovalStatus;
  approvedAt?: string;
  approvedByUserId?: string;
}

export interface ReporterAgendaItem {
  id: string;
  title: string;
  reporterUserId: string;
  startAt: string;
  endAt: string;
  location: string;
  meetingLink: string;
  coordinatorPhone: string;
  officialContactId?: string;
  requirements: string;
  done: boolean;
  linkedStoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OriginHit {
  outlet: string;
  publishedAt: string;
  similarity: number;
  exclusive: "exclusive" | "reprint" | "syndicated";
  url: string;
}

export interface NewsroomData {
  currentRoleId: string;
  /** کاربر فعال در سشن (پروفایل و هدر) — با نقش باید هم‌خوان باشد */
  currentUserId?: string;
  settings: Settings;
  templateSettings: TemplateSettings;
  roles: RoleDef[];
  users: User[];
  /** نقش → فهرست کلیدهای مجاز (dashboard + group/slug) */
  roleModuleAccess: Record<string, string[]>;
  /** کاربر → فهرست سفارشی؛ اگر کلید وجود داشته باشد به‌جای نقش اعمال می‌شود */
  userModuleAccess: Record<string, string[]>;
  access: AccessRule[];
  stories: Story[];
  homeOrder: string[];
  steps: Step[];
  transitions: Transition[];
  submissions: Submission[];
  pitches: NewsPitch[];
  suggestions: Suggestion[];
  categories: Category[];
  services: Service[];
  albums: Album[];
  mediaLibrary: MediaItem[];
  videos: VideoItem[];
  feeds: Feed[];
  subscribers: Subscriber[];
  issues: Issue[];
  social: SocialPost[];
  mail: Mail[];
  people: Person[];
  pages: NewsPage[];
  tables: NewsTable[];
  banners: Banner[];
  ads: Ad[];
  tickers: TickerItem[];
  events: CalEvent[];
  upcomingEvents: EditorialUpcomingEvent[];
  tickets: Ticket[];
  notes: Note[];
  subsites: Subsite[];
  links: LinkItem[];
  logos: Logo[];
  forms: FormDef[];
  menus: MenuItem[];
  portal: PortalConfig;
  comments: Comment[];
  polls: Poll[];
  contacts: ContactMsg[];
  contactPage: ContactPageSettings;
  threads: Thread[];
  activity: Activity[];
  aiTaskLogs: AiTaskLogEntry[];
  payrollRates: PayrollRate[];
  payrollApprovals: PayrollApproval[];
  socialChannels: SocialChannelConfig[];
  versionHistory: VersionEntry[];
  adminTemplates: AdminLetterTemplate[];
  specialDossiers: SpecialDossier[];
  eventMaps: EventMapProject[];
  eventMapDefaults?: EventMapDefaults;
  productChangelog?: ChangelogRelease[];
  /** آخرین نسخه منتشرشده (فوتر و changelog) */
  systemVersion?: string;
  officialContacts: OfficialContact[];
  reporterAgenda: ReporterAgendaItem[];
  reporterTodos: ReporterTodo[];
  reporterStickyNotes: ReporterStickyNote[];
  reporterFiles: ReporterFileEntry[];
  reporterStorageQuotas: ReporterStorageQuota[];
  editorialAnnouncements: EditorialAnnouncement[];
  chatThreads: ChatThread[];
  chatMessages: ChatMessage[];
  chatReadCursors: ChatReadCursor[];
  socialBots: SocialBotCredentials;
  sessionStartedAt: string;
}
