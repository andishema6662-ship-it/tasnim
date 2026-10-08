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

export const FEATURE_CATALOG: { id: FeatureModuleId; label: string; hint?: string }[] = [
  { id: 'charges', label: 'شارژ و زمان‌بندی' },
  { id: 'installments', label: 'تقسیط شارژ', hint: 'در صفحه قبوض' },
  { id: 'payments', label: 'پرداخت آنلاین دمو', hint: 'رسیدها و پرداخت شبیه‌سازی' },
  { id: 'finance', label: 'مالی و شفافیت هزینه‌ها' },
  { id: 'polls', label: 'نظرسنجی' },
  { id: 'meetings', label: 'جلسات و مصوبات' },
  { id: 'suggestions', label: 'نظرات و پیشنهادات' },
  { id: 'qarz', label: 'صندوق قرض‌الحسنه' },
  { id: 'news', label: 'کانال خبری' },
  { id: 'chat', label: 'چت داخلی' },
  { id: 'blockTickets', label: 'تیکت فنی بلوک', hint: 'ارجاع به مدیر شهرک' },
]

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
}

export interface TechnicalTeam {
  id: string
  complexId: string
  name: string
  specialty: string
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

export interface SubscriptionPayment {
  id: string
  buildingId: string
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

export type StaffRole = 'siteAdmin' | 'complexManager' | 'manager' | 'financeManager'

export interface PlatformUser {
  id: string
  username: string
  password: string
  role: StaffRole
  displayName: string
  buildingId?: string
  complexId?: string
  status: 'active' | 'disabled'
}

export interface PlatformAdmin {
  users: PlatformUser[]
  complexes: Complex[]
  teams: TechnicalTeam[]
  staff: TechnicalPerson[]
  tickets: ComplexTicket[]
  discounts: DiscountCode[]
  tariffs: TariffTier[]
  subscriptionPayments: SubscriptionPayment[]
  sms: SmsConfig
  gateway: GatewayConfig
  activity: ActivityEvent[]
}

export type SiteAdminSection =
  | 'properties'
  | 'users'
  | 'subscriptions'
  | 'tariffs'
  | 'discounts'
  | 'storage'
  | 'features'
  | 'finance'
  | 'activity'
  | 'sms'
  | 'gateway'
  | 'qarz'
  | 'complex'
