import type { BuildingType } from './types'

export type FeatureModuleId =
  | 'charges'
  | 'finance'
  | 'payments'
  | 'polls'
  | 'meetings'
  | 'suggestions'
  | 'qarz'
  | 'news'
  | 'chat'
  | 'installments'
  | 'blockTickets'

/** included = base plan; period = billed 3/6/12; one_time = single purchase */
export type FeaturePricingMode = 'included' | 'period' | 'one_time'

export interface FeatureCatalogEntry {
  id: FeatureModuleId
  label: string
  hint?: string
  /** Default on when site admin creates a new building/block/tower */
  defaultEnabled: boolean
  /**
   * Paid add-on: stays inactive until a matching payment is approved/paid_demo,
   * even if toggled on in per-building features.
   */
  paidAddon: boolean
  pricingMode: FeaturePricingMode
  /** تومان — when pricingMode === 'period' */
  price3?: number
  price6?: number
  price12?: number
  /** تومان — when pricingMode === 'one_time' */
  oneTimePrice?: number
}

export const FEATURE_PRICING_LABEL: Record<FeaturePricingMode, string> = {
  included: 'پایه (بدون هزینه جدا)',
  period: 'دوره‌ای ۳/۶/۱۲ ماهه',
  one_time: 'یک‌بار پرداخت',
}

/** Seed / fallback catalog — editable copy lives in PlatformAdmin.featureCatalog */
export const DEFAULT_FEATURE_CATALOG: FeatureCatalogEntry[] = [
  {
    id: 'charges',
    label: 'شارژ و زمان‌بندی',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'installments',
    label: 'تقسیط شارژ',
    hint: 'در صفحه قبوض',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'payments',
    label: 'پرداخت آنلاین دمو',
    hint: 'رسیدها و پرداخت شبیه‌سازی',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'finance',
    label: 'مالی و شفافیت هزینه‌ها',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'polls',
    label: 'نظرسنجی',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'meetings',
    label: 'جلسات و مصوبات',
    hint: 'افزونه پولی — دوره‌ای',
    defaultEnabled: false,
    paidAddon: true,
    pricingMode: 'period',
    price3: 150_000,
    price6: 270_000,
    price12: 480_000,
  },
  {
    id: 'suggestions',
    label: 'نظرات و پیشنهادات',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'qarz',
    label: 'صندوق قرض‌الحسنه',
    hint: 'افزونه پولی — دوره‌ای',
    defaultEnabled: false,
    paidAddon: true,
    pricingMode: 'period',
    price3: 200_000,
    price6: 360_000,
    price12: 640_000,
  },
  {
    id: 'news',
    label: 'کانال خبری',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
  {
    id: 'chat',
    label: 'چت داخلی',
    hint: 'افزونه پولی — یک‌بار',
    defaultEnabled: false,
    paidAddon: true,
    pricingMode: 'one_time',
    oneTimePrice: 350_000,
  },
  {
    id: 'blockTickets',
    label: 'تیکت فنی بلوک',
    hint: 'ارجاع به مدیر شهرک',
    defaultEnabled: true,
    paidAddon: false,
    pricingMode: 'included',
  },
]

/** Lightweight labels for menus (prefer PlatformAdmin.featureCatalog when available). */
export const FEATURE_CATALOG: { id: FeatureModuleId; label: string; hint?: string }[] =
  DEFAULT_FEATURE_CATALOG.map(({ id, label, hint }) => ({ id, label, hint }))

/** App routes gated by a feature module */
export const FEATURE_ROUTES: Partial<Record<FeatureModuleId, string[]>> = {
  charges: ['/app/charges'],
  finance: ['/app/finance', '/app/expenses'],
  payments: ['/app/payments'],
  polls: ['/app/polls'],
  meetings: ['/app/meetings'],
  suggestions: ['/app/suggestions'],
  qarz: ['/app/qarz'],
  news: ['/app/news'],
  chat: ['/app/chat'],
  blockTickets: ['/app/block-tickets'],
}

export function featureForPath(pathname: string): FeatureModuleId | null {
  const path = pathname.replace(/\/$/, '') || pathname
  for (const [id, routes] of Object.entries(FEATURE_ROUTES) as [FeatureModuleId, string[]][]) {
    if (routes.some((r) => path === r || path.startsWith(r + '/'))) return id
  }
  return null
}

export interface Complex {
  id: string
  name: string
  city: string
  managerName: string
  /** Demo login */
  username: string
  password: string
  blockIds: string[]
  status: 'active' | 'disabled'
  /** Platform subscription for the complex manager account (not block subs) */
  subscriptionMonths?: SubPeriodMonths | number
  subscriptionAmount?: number
  subscriptionStatus?: SubPaymentStatus
  subscriptionExpiresAt?: string
  subscriptionTracking?: string
}

export interface TechnicalTeam {
  id: string
  /** Omit / empty = site-level team (not tied to one complex) */
  complexId?: string
  name: string
  specialty: string
  phone?: string
  note?: string
  active: boolean
}

export type SiteSupportStatus = 'open' | 'pending' | 'answered' | 'closed'
export type SiteSupportPriority = 'low' | 'normal' | 'high'

export const SITE_SUPPORT_STATUS_LABEL: Record<SiteSupportStatus, string> = {
  open: 'باز',
  pending: 'در انتظار',
  answered: 'پاسخ‌داده‌شده',
  closed: 'بسته‌شده',
}

export const SITE_SUPPORT_PRIORITY_LABEL: Record<SiteSupportPriority, string> = {
  low: 'کم',
  normal: 'عادی',
  high: 'بالا',
}

export interface SiteSupportMessage {
  id: string
  author: string
  body: string
  at: string
  fromStaff: boolean
}

export interface SiteSupportTicket {
  id: string
  subject: string
  category: string
  priority: SiteSupportPriority
  status: SiteSupportStatus
  requesterName: string
  requesterRole?: string
  complexId?: string
  buildingId?: string
  body: string
  messages: SiteSupportMessage[]
  createdAt: string
  updatedAt: string
}

export interface SiteChatThread {
  id: string
  title: string
  peerName: string
  peerRole: string
  unread: number
  updatedAt: string
}

export interface SiteChatMessage {
  id: string
  threadId: string
  author: string
  body: string
  at: string
  mine: boolean
}

export type ChangelogKind = 'new' | 'improve' | 'fix' | 'security'

export const CHANGELOG_KIND_LABEL: Record<ChangelogKind, string> = {
  new: 'جدید',
  improve: 'بهبود',
  fix: 'رفع اشکال',
  security: 'امنیت',
}

export interface ChangelogEntry {
  id: string
  version: string
  title: string
  body: string
  kind: ChangelogKind
  at: string
}

/** Individual contractor / technician assignable on tickets */
export interface TechnicalPerson {
  id: string
  complexId: string
  name: string
  specialty: string
  phone?: string
  active: boolean
}

export const STAFF_SPECIALTIES = [
  'تاسیسات',
  'برقکار',
  'پیمانکار',
  'آسانسور',
  'نظافت',
  'امنیت',
  'سایر',
] as const

export type ComplexTicketStatus = 'open' | 'in_progress' | 'resolved'

export interface ComplexTicket {
  id: string
  complexId: string
  buildingId: string
  category: string
  title: string
  body: string
  status: ComplexTicketStatus
  createdBy: string
  assignedTeamId?: string
  assignedPersonId?: string
  createdAt: string
  updatedAt: string
  resolutionNote?: string
}

export interface DiscountCode {
  id: string
  code: string
  percent: number
  maxUses: number
  usedCount: number
  active: boolean
  note?: string
}

export interface TariffTier {
  id: string
  name: string
  maxUnits: number
  monthlyPerUnit: number
  buildingTypes: BuildingType[]
}

export type SubPaymentMethod = 'gateway' | 'bank_receipt'
export type SubPaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid_demo'

export type SubPeriodMonths = 3 | 6 | 12

export const SUB_PERIOD_LABEL: Record<number, string> = {
  3: '۳ ماهه',
  6: '۶ ماهه',
  12: '۱۲ ماهه',
}

export const SUB_METHOD_LABEL: Record<SubPaymentMethod, string> = {
  gateway: 'درگاه پرداخت',
  bank_receipt: 'فیش بانکی',
}

export const SUB_STATUS_LABEL: Record<SubPaymentStatus, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأییدشده',
  rejected: 'ردشده',
  paid_demo: 'پرداخت‌شده (دمو)',
}

export interface SubscriptionPayment {
  id: string
  /** Block/building subscription — omit for complex-level platform sub */
  buildingId?: string
  /** Complex manager's own platform subscription */
  complexId?: string
  amount: number
  units: number
  months: number
  discountCode?: string
  method: SubPaymentMethod
  status: SubPaymentStatus
  receiptNote?: string
  trackingCode: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  /**
   * When set, this row is a paid feature add-on purchase (not base subscription).
   * Activation of that module happens only after approved / paid_demo.
   */
  addonFeatureId?: FeatureModuleId
  kind?: 'subscription' | 'feature_addon' | 'complex_platform'
}

export function isSubPaid(status: SubPaymentStatus): boolean {
  return status === 'approved' || status === 'paid_demo'
}

export function isSubDebt(status: SubPaymentStatus): boolean {
  return status === 'pending' || status === 'rejected'
}

export interface SmsConfig {
  enabled: boolean
  endpoint: string
  apiKey: string
  sender: string
  lastTestAt?: string
  lastTestResult?: string
}

export interface GatewayConfig {
  mode: 'gateway' | 'bank_receipt' | 'both'
  merchantId: string
  callbackUrl: string
  bankAccountInfo: string
  enabled: boolean
}

export interface ActivityEvent {
  id: string
  at: string
  kind: string
  label: string
  buildingId?: string
}

export type ComplexLedgerKind = 'expense' | 'income'

export interface ComplexLedgerEntry {
  id: string
  complexId: string
  kind: ComplexLedgerKind
  category: string
  title: string
  amount: number
  note?: string
  /** Optional link to a block in the complex */
  buildingId?: string
  at: string
  createdBy: string
}

export const COMPLEX_EXPENSE_CATEGORIES = [
  'تاسیسات',
  'برق',
  'نظافت',
  'امنیت',
  'پیمانکار',
  'آسانسور',
  'سایر',
] as const

export const COMPLEX_INCOME_CATEGORIES = [
  'سهم بلوک‌ها',
  'اجاره مشاعات',
  'کمک/سپرده',
  'سایر',
] as const

export type StaffRole = 'siteAdmin' | 'complexManager' | 'manager' | 'financeManager'

export interface PlatformUser {
  id: string
  username: string
  password: string
  role: StaffRole
  displayName: string
  buildingId?: string
  complexId?: string
  /** For SMS OTP login (demo) */
  phone?: string
  status: 'active' | 'disabled'
}

export type SiteSuggestionStatus = 'open' | 'reviewing' | 'resolved' | 'rejected'

/** Proposals from complex/block managers to site admin */
export interface SiteSuggestion {
  id: string
  title: string
  body: string
  category: string
  fromRole: 'complexManager' | 'manager'
  fromName: string
  fromUserId?: string
  complexId?: string
  buildingId?: string
  status: SiteSuggestionStatus
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
}

export const SITE_SUGGESTION_CATEGORIES = [
  'امکانات جدید',
  'تعرفه و اشتراک',
  'پشتیبانی فنی',
  'گزارش مشکل',
  'سایر',
] as const

/** Fixed demo OTP accepted by SMS stub */
export const DEMO_OTP_CODE = '12345'

/** Who receives a manager broadcast (hierarchy-scoped). */
export type BroadcastAudience =
  | 'complex_managers'
  | 'block_managers'
  | 'complex_members'
  | 'building_members'

export const BROADCAST_AUDIENCE_LABEL: Record<BroadcastAudience, string> = {
  complex_managers: 'مدیران شهرک',
  block_managers: 'مدیران بلوک شهرک',
  complex_members: 'همه ساکنین/مدیران بلوک‌های شهرک',
  building_members: 'اعضای واحدهای این ساختمان',
}

export interface ManagerBroadcast {
  id: string
  title: string
  body: string
  createdByRole: StaffRole
  createdByName: string
  complexId?: string
  buildingId?: string
  audience: BroadcastAudience
  startsAt: string
  endsAt: string
  createdAt: string
  /** Manual deactivate before expiry */
  active: boolean
}

export type SideProgramType = 'shop' | 'cultural' | 'announcement' | 'fixed' | 'other'
export type SideProgramScope = 'complex' | 'building'

export const SIDE_PROGRAM_TYPE_LABEL: Record<SideProgramType, string> = {
  shop: 'فروشگاه',
  cultural: 'فرهنگی',
  announcement: 'اطلاع‌رسانی',
  fixed: 'برنامه ثابت',
  other: 'سایر',
}

export interface SideProgram {
  id: string
  scope: SideProgramScope
  complexId?: string
  buildingId?: string
  title: string
  type: SideProgramType
  description: string
  startsAt: string
  endsAt?: string
  createdByName: string
  createdByRole: StaffRole
  status: 'upcoming' | 'active' | 'ended'
}

export interface OtpChallenge {
  phone: string
  code: string
  expiresAt: number
  userId: string
}

export interface PlatformAdmin {
  users: PlatformUser[]
  complexes: Complex[]
  teams: TechnicalTeam[]
  staff: TechnicalPerson[]
  tickets: ComplexTicket[]
  complexLedger: ComplexLedgerEntry[]
  discounts: DiscountCode[]
  tariffs: TariffTier[]
  subscriptionPayments: SubscriptionPayment[]
  /** Editable site-wide feature defaults + paid add-on pricing */
  featureCatalog: FeatureCatalogEntry[]
  broadcasts: ManagerBroadcast[]
  sidePrograms: SideProgram[]
  siteSuggestions: SiteSuggestion[]
  /** Active OTP challenges (demo / stub SMS) */
  otpChallenges: OtpChallenge[]
  supportTickets: SiteSupportTicket[]
  siteChatThreads: SiteChatThread[]
  siteChatMessages: SiteChatMessage[]
  changelog: ChangelogEntry[]
  sms: SmsConfig
  gateway: GatewayConfig
  activity: ActivityEvent[]
}

export type SiteAdminSection =
  | 'dashboard'
  | 'properties'
  | 'users'
  | 'teams'
  | 'subscriptions'
  | 'tariffs'
  | 'discounts'
  | 'storage'
  | 'features'
  | 'finance'
  | 'activity'
  | 'changelog'
  | 'sms'
  | 'gateway'
  | 'qarz'
  | 'complex'
  | 'broadcasts'
  | 'programs'
  | 'proposals'
  | 'support'
  | 'chat'

/** User-list filter chips (manager subtypes by building type) */
export type SiteUserFilter =
  | 'all'
  | 'complexManager'
  | 'blockManager'
  | 'buildingManager'
  | 'towerManager'
  | 'financeManager'
  | 'siteAdmin'

export const SITE_USER_FILTER_LABEL: Record<SiteUserFilter, string> = {
  all: 'همه',
  complexManager: 'مدیر شهرک',
  blockManager: 'مدیر بلوک',
  buildingManager: 'مدیر ساختمان',
  towerManager: 'مدیر برج',
  financeManager: 'مدیر مالی',
  siteAdmin: 'ادمین کل',
}
