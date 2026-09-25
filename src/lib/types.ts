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

export interface User {
  id: string;
  name: string;
  username: string;
  roleId: string;
  active: boolean;
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

export interface Album {
  id: string;
  title: string;
  description: string;
  photos: Photo[];
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  duration: string;
  summary: string;
  published: boolean;
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

export interface NewsTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
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

export interface Ticket {
  id: string;
  title: string;
  body: string;
  status: "open" | "pending" | "closed";
  author: string;
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
}

export interface ContactMsg {
  id: string;
  name: string;
  email: string;
  body: string;
  status: "new" | "seen" | "closed";
  createdAt: string;
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

export interface NewsroomData {
  currentRoleId: string;
  settings: Settings;
  roles: RoleDef[];
  users: User[];
  access: AccessRule[];
  stories: Story[];
  homeOrder: string[];
  steps: Step[];
  transitions: Transition[];
  submissions: Submission[];
  suggestions: Suggestion[];
  categories: Category[];
  services: Service[];
  albums: Album[];
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
  threads: Thread[];
  activity: Activity[];
  sessionStartedAt: string;
}
