export type Role = 'siteAdmin' | 'manager' | 'resident'

export type BuildingType = 'block' | 'building' | 'tower'
export type BuildingStatus = 'active' | 'disabled'

export type ChargeFormula = 'fixed' | 'area' | 'perPerson' | 'consumption'
export type ChargePeriod = 'monthly' | 'seasonal'
export type DebtParty = 'owner' | 'resident'
export type BillStatus = 'unpaid' | 'partial' | 'paid'
export type PollAudience = 'residents' | 'owners'
export type LedgerKind = 'expense' | 'income'

export interface BuildingMeta {
  id: string
  name: string
  address: string
  unitCount: number
  type: BuildingType
  status: BuildingStatus
  managerName: string
  managerPhone?: string
  /** Demo subscription: billed unit count (may differ from live units) */
  subscriptionUnits: number
  subscriptionMonths: number
}

export interface Unit {
  id: string
  number: string
  floor: number
  areaSqm: number
  occupants: number
  ownerName: string
  residentName: string
  parkingSpot?: string
  balance: number
}

export interface Resident {
  id: string
  unitId: string
  name: string
  phone: string
  roleInUnit: 'owner' | 'resident'
}

export interface ChargeSchedule {
  id: string
  title: string
  formula: ChargeFormula
  amountOrRate: number
  dayOfMonth: number
  period: ChargePeriod
  active: boolean
  ownerSharePercent: number
  lastRunAt?: string
}

export type InstallmentStatus = 'unpaid' | 'paid'

export interface Installment {
  id: string
  index: number
  amount: number
  dueAt: string
  status: InstallmentStatus
  paidAt?: string
  paymentId?: string
}

export interface Bill {
  id: string
  unitId: string
  title: string
  periodLabel: string
  total: number
  ownerShare: number
  residentShare: number
  paidOwner: number
  paidResident: number
  status: BillStatus
  createdAt: string
  formula: ChargeFormula
  /** Optional plan on remaining balance */
  installments?: Installment[]
}

export interface Payment {
  id: string
  billId: string
  unitId: string
  amount: number
  party: DebtParty
  trackingCode: string
  createdAt: string
  method: 'online-demo'
}

export interface LedgerEntry {
  id: string
  kind: LedgerKind
  category: string
  title: string
  amount: number
  note: string
  createdAt: string
  visibleToResidents: boolean
}

export interface PollOption {
  id: string
  label: string
  votes: number
}

export interface Poll {
  id: string
  title: string
  audience: PollAudience
  options: PollOption[]
  closesAt: string
  votedBy: string[]
}

export interface NewsItem {
  id: string
  title: string
  body: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  author: string
  body: string
  createdAt: string
}

export interface MeetingAttendee {
  id: string
  name: string
  residentId?: string
  unitId?: string
}

export interface Meeting {
  id: string
  title: string
  scheduledAt: string
  place?: string
  agenda?: string
  resolutions: string[]
  attendees: MeetingAttendee[]
  notifiedAt?: string
  status: 'upcoming' | 'done'
  createdAt: string
  updatedAt: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  kind: 'reminder' | 'payment' | 'poll' | 'news' | 'meeting' | 'suggestion' | 'sms-stub'
  read: boolean
}

export type SuggestionStatus = 'open' | 'resolved' | 'hidden'

export interface SuggestionCategory {
  id: string
  label: string
  active: boolean
}

export interface Suggestion {
  id: string
  categoryId: string
  title: string
  body: string
  /** Compressed JPEG/PNG data URL for localStorage demo */
  photoDataUrl?: string
  authorName: string
  unitId?: string
  status: SuggestionStatus
  createdAt: string
}

export interface BuildingData {
  fundBalance: number
  units: Unit[]
  residents: Resident[]
  schedules: ChargeSchedule[]
  bills: Bill[]
  payments: Payment[]
  ledger: LedgerEntry[]
  polls: Poll[]
  news: NewsItem[]
  chat: ChatMessage[]
  meetings: Meeting[]
  suggestionCategories: SuggestionCategory[]
  suggestions: Suggestion[]
  notifications: NotificationItem[]
}

export interface Session {
  role: Role
  buildingId?: string
  unitId?: string
  displayName: string
  /** Site admin temporarily managing a building as manager UI */
  viaSiteAdmin?: boolean
}

export interface PlatformState {
  session: Session | null
  buildings: BuildingMeta[]
  byId: Record<string, BuildingData>
}

/** Building-scoped view used by existing app screens */
export interface ScopedState extends BuildingData {
  buildingId: string
  buildingName: string
  session: Session
}

export const SITE_ADMIN_DEMO = {
  username: 'admin',
  password: 'admin123',
} as const

export const buildingTypeLabel: Record<BuildingType, string> = {
  block: 'بلوک',
  building: 'ساختمان',
  tower: 'برج',
}

export const buildingStatusLabel: Record<BuildingStatus, string> = {
  active: 'فعال',
  disabled: 'غیرفعال',
}
