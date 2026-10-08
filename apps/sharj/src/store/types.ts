export type Role = 'manager' | 'resident'

export type ChargeFormula = 'fixed' | 'area' | 'perPerson' | 'consumption'
export type ChargePeriod = 'monthly' | 'seasonal'
export type DebtParty = 'owner' | 'resident'
export type BillStatus = 'unpaid' | 'partial' | 'paid'
export type PollAudience = 'residents' | 'owners'
export type LedgerKind = 'expense' | 'income'

export interface Unit {
  id: string
  number: string
  floor: number
  areaSqm: number
  occupants: number
  ownerName: string
  residentName: string
  parkingSpot?: string
  balance: number // negative = debtor, positive = creditor
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
  ownerSharePercent: number // rest goes to resident
  lastRunAt?: string
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
  votedBy: string[] // session keys
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

export interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  kind: 'reminder' | 'payment' | 'poll' | 'news' | 'sms-stub'
  read: boolean
}

export interface Session {
  role: Role
  unitId?: string
  displayName: string
}

export interface AppState {
  buildingName: string
  fundBalance: number
  session: Session | null
  units: Unit[]
  residents: Resident[]
  schedules: ChargeSchedule[]
  bills: Bill[]
  payments: Payment[]
  ledger: LedgerEntry[]
  polls: Poll[]
  news: NewsItem[]
  chat: ChatMessage[]
  notifications: NotificationItem[]
}
