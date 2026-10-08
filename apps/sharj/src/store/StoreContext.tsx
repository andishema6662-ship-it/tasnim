import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { computeUnitCharge } from '../lib/charges'
import { trackingCode } from '../lib/format'
import { createSeed, STORAGE_KEY } from './seed'
import type {
  AppState,
  Bill,
  ChargeSchedule,
  DebtParty,
  LedgerEntry,
  NewsItem,
  Poll,
  Role,
  Session,
} from './types'

interface StoreApi {
  state: AppState
  login: (role: Role, unitId?: string) => void
  logout: () => void
  resetDemo: () => void
  runSchedule: (scheduleId: string) => number
  upsertSchedule: (schedule: ChargeSchedule) => void
  payBill: (billId: string, party: DebtParty, amount?: number) => string | null
  addLedger: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => void
  votePoll: (pollId: string, optionId: string) => void
  addPoll: (poll: Omit<Poll, 'id' | 'votedBy' | 'options'> & { options: string[] }) => void
  addNews: (item: Omit<NewsItem, 'id' | 'createdAt'>) => void
  sendChat: (body: string) => void
  markNotificationsRead: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* ignore */
  }
  return createSeed()
}

function billStatus(b: Bill): Bill['status'] {
  const paid = b.paidOwner + b.paidResident
  if (paid <= 0) return 'unpaid'
  if (paid >= b.total) return 'paid'
  return 'partial'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const login = useCallback((role: Role, unitId?: string) => {
    setState((s) => {
      let displayName = 'مدیر ساختمان'
      if (role === 'resident') {
        const unit = s.units.find((u) => u.id === unitId)
        displayName = unit ? `واحد ${unit.number}` : 'ساکن'
      }
      const session: Session = { role, unitId, displayName }
      return { ...s, session }
    })
  }, [])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, session: null }))
  }, [])

  const resetDemo = useCallback(() => {
    const fresh = createSeed()
    setState(fresh)
  }, [])

  const runSchedule = useCallback((scheduleId: string) => {
    let created = 0
    setState((s) => {
      const schedule = s.schedules.find((x) => x.id === scheduleId)
      if (!schedule) return s
      const periodLabel =
        schedule.period === 'monthly' ? 'دوره ماهانه جاری' : 'دوره فصلی جاری'
      const newBills: Bill[] = s.units.map((unit) => {
        const total = computeUnitCharge(unit, schedule)
        const ownerShare = Math.round((total * schedule.ownerSharePercent) / 100)
        const residentShare = total - ownerShare
        created += 1
        return {
          id: `b-${scheduleId}-${unit.id}-${Date.now()}-${created}`,
          unitId: unit.id,
          title: schedule.title,
          periodLabel,
          total,
          ownerShare,
          residentShare,
          paidOwner: 0,
          paidResident: 0,
          status: 'unpaid',
          createdAt: new Date().toISOString(),
          formula: schedule.formula,
        }
      })
      const units = s.units.map((u) => {
        const bill = newBills.find((b) => b.unitId === u.id)!
        return { ...u, balance: u.balance - bill.total }
      })
      return {
        ...s,
        units,
        bills: [...newBills, ...s.bills],
        schedules: s.schedules.map((x) =>
          x.id === scheduleId ? { ...x, lastRunAt: new Date().toISOString() } : x,
        ),
        notifications: [
          {
            id: `nt-${Date.now()}`,
            title: 'شارژ دوره‌ای ثبت شد',
            body: `${schedule.title} برای ${created} واحد صادر شد.`,
            createdAt: new Date().toISOString(),
            kind: 'reminder' as const,
            read: false,
          },
          ...s.notifications,
        ],
      }
    })
    return created
  }, [])

  const upsertSchedule = useCallback((schedule: ChargeSchedule) => {
    setState((s) => {
      const exists = s.schedules.some((x) => x.id === schedule.id)
      return {
        ...s,
        schedules: exists
          ? s.schedules.map((x) => (x.id === schedule.id ? schedule : x))
          : [schedule, ...s.schedules],
      }
    })
  }, [])

  const payBill = useCallback((billId: string, party: DebtParty, amount?: number) => {
    let code: string | null = null
    setState((s) => {
      const bill = s.bills.find((b) => b.id === billId)
      if (!bill) return s
      const due =
        party === 'owner'
          ? Math.max(0, bill.ownerShare - bill.paidOwner)
          : Math.max(0, bill.residentShare - bill.paidResident)
      const pay = Math.min(amount ?? due, due)
      if (pay <= 0) return s
      code = trackingCode()
      const bills = s.bills.map((b) => {
        if (b.id !== billId) return b
        const next = {
          ...b,
          paidOwner: b.paidOwner + (party === 'owner' ? pay : 0),
          paidResident: b.paidResident + (party === 'resident' ? pay : 0),
        }
        return { ...next, status: billStatus(next) }
      })
      const units = s.units.map((u) =>
        u.id === bill.unitId ? { ...u, balance: u.balance + pay } : u,
      )
      return {
        ...s,
        bills,
        units,
        fundBalance: s.fundBalance + pay,
        payments: [
          {
            id: `pay-${Date.now()}`,
            billId,
            unitId: bill.unitId,
            amount: pay,
            party,
            trackingCode: code!,
            createdAt: new Date().toISOString(),
            method: 'online-demo' as const,
          },
          ...s.payments,
        ],
        ledger: [
          {
            id: `l-pay-${Date.now()}`,
            kind: 'income' as const,
            category: 'شارژ',
            title: `پرداخت آنلاین ${bill.title}`,
            amount: pay,
            note: `کد پیگیری ${code}`,
            createdAt: new Date().toISOString(),
            visibleToResidents: true,
          },
          ...s.ledger,
        ],
        notifications: [
          {
            id: `nt-pay-${Date.now()}`,
            title: 'رسید پرداخت ثبت شد',
            body: `مبلغ ${pay.toLocaleString('fa-IR')} تومان — کد ${code}`,
            createdAt: new Date().toISOString(),
            kind: 'payment' as const,
            read: false,
          },
          {
            id: `nt-sms-${Date.now()}`,
            title: 'پیامک — به‌زودی',
            body: 'اطلاع‌رسانی پیامکی به مدیر و واحد پس از اتصال SMS فعال می‌شود.',
            createdAt: new Date().toISOString(),
            kind: 'sms-stub' as const,
            read: false,
          },
          ...s.notifications,
        ],
      }
    })
    return code
  }, [])

  const addLedger = useCallback((entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
    setState((s) => {
      const delta = entry.kind === 'income' ? entry.amount : -entry.amount
      return {
        ...s,
        fundBalance: s.fundBalance + delta,
        ledger: [
          {
            ...entry,
            id: `l-${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
          ...s.ledger,
        ],
      }
    })
  }, [])

  const votePoll = useCallback((pollId: string, optionId: string) => {
    setState((s) => {
      if (!s.session) return s
      const voterKey = `${s.session.role}:${s.session.unitId ?? 'manager'}`
      return {
        ...s,
        polls: s.polls.map((p) => {
          if (p.id !== pollId || p.votedBy.includes(voterKey)) return p
          return {
            ...p,
            votedBy: [...p.votedBy, voterKey],
            options: p.options.map((o) =>
              o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
            ),
          }
        }),
      }
    })
  }, [])

  const addPoll = useCallback(
    (poll: Omit<Poll, 'id' | 'votedBy' | 'options'> & { options: string[] }) => {
      setState((s) => ({
        ...s,
        polls: [
          {
            id: `poll-${Date.now()}`,
            title: poll.title,
            audience: poll.audience,
            closesAt: poll.closesAt,
            votedBy: [],
            options: poll.options.map((label, i) => ({
              id: `opt-${i}`,
              label,
              votes: 0,
            })),
          },
          ...s.polls,
        ],
        notifications: [
          {
            id: `nt-poll-${Date.now()}`,
            title: 'نظرسنجی جدید',
            body: poll.title,
            createdAt: new Date().toISOString(),
            kind: 'poll' as const,
            read: false,
          },
          ...s.notifications,
        ],
      }))
    },
    [],
  )

  const addNews = useCallback((item: Omit<NewsItem, 'id' | 'createdAt'>) => {
    setState((s) => ({
      ...s,
      news: [
        { ...item, id: `n-${Date.now()}`, createdAt: new Date().toISOString() },
        ...s.news,
      ],
      notifications: [
        {
          id: `nt-news-${Date.now()}`,
          title: 'خبر ساختمان',
          body: item.title,
          createdAt: new Date().toISOString(),
          kind: 'news' as const,
          read: false,
        },
        ...s.notifications,
      ],
    }))
  }, [])

  const sendChat = useCallback((body: string) => {
    setState((s) => {
      if (!s.session || !body.trim()) return s
      return {
        ...s,
        chat: [
          ...s.chat,
          {
            id: `c-${Date.now()}`,
            author: s.session.displayName,
            body: body.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })
  }, [])

  const markNotificationsRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  const api = useMemo(
    () => ({
      state,
      login,
      logout,
      resetDemo,
      runSchedule,
      upsertSchedule,
      payBill,
      addLedger,
      votePoll,
      addPoll,
      addNews,
      sendChat,
      markNotificationsRead,
    }),
    [
      state,
      login,
      logout,
      resetDemo,
      runSchedule,
      upsertSchedule,
      payBill,
      addLedger,
      votePoll,
      addPoll,
      addNews,
      sendChat,
      markNotificationsRead,
    ],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
