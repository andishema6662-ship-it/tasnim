import type { BuildingType } from './types'

export type FeatureModuleId =
  | 'charges'
  | 'finance'
  | 'polls'
  | 'meetings'
  | 'suggestions'
  | 'qarz'
  | 'news'
  | 'chat'
  | 'installments'

export const FEATURE_CATALOG: { id: FeatureModuleId; label: string }[] = [
  { id: 'charges', label: 'شارژ و زمان‌بندی' },
  { id: 'installments', label: 'تقسیط قبوض' },
  { id: 'finance', label: 'مالی و شفافیت' },
  { id: 'polls', label: 'نظرسنجی' },
  { id: 'meetings', label: 'جلسات' },
  { id: 'suggestions', label: 'نظرات و پیشنهادات' },
  { id: 'qarz', label: 'صندوق قرض‌الحسنه' },
  { id: 'news', label: 'کانال خبری' },
  { id: 'chat', label: 'چت داخلی' },
]

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

export interface PlatformAdmin {
  complexes: Complex[]
  teams: TechnicalTeam[]
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
