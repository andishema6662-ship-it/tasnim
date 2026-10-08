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
import { billRemaining, buildInstallments } from '../lib/installments'
import {
  createEmptyBuildingData,
  createSeed,
  normalizeBuildingData,
  STORAGE_KEY,
} from './seed'
import type {
  Bill,
  BuildingData,
  BuildingMeta,
  ChargeSchedule,
  DebtParty,
  LedgerEntry,
  Meeting,
  NewsItem,
  PlatformState,
  Poll,
  ScopedState,
  Session,
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
} from './types'
import { SITE_ADMIN_DEMO } from './types'

interface StoreApi {
  platform: PlatformState
  session: Session | null
  /** Building-scoped view for manager/resident screens */
  state: ScopedState | null
  loginSiteAdmin: (username: string, password: string) => boolean
  loginBuilding: (role: 'manager' | 'resident', buildingId: string, unitId?: string) => boolean
  enterBuildingAsManager: (buildingId: string) => void
  returnToSiteAdmin: () => void
  logout: () => void
  resetDemo: () => void
  upsertBuilding: (meta: BuildingMeta) => void
  runSchedule: (scheduleId: string) => number
  upsertSchedule: (schedule: ChargeSchedule) => void
  payBill: (billId: string, party: DebtParty, amount?: number) => string | null
  createInstallmentPlan: (
    billId: string,
    count: number,
    startDate: string,
    intervalMonths?: number,
  ) => boolean
  payInstallment: (billId: string, installmentId: string, party?: DebtParty) => string | null
  addLedger: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => void
  votePoll: (pollId: string, optionId: string) => void
  addPoll: (poll: Omit<Poll, 'id' | 'votedBy' | 'options'> & { options: string[] }) => void
  addNews: (item: Omit<NewsItem, 'id' | 'createdAt'>) => void
  sendChat: (body: string) => void
  upsertMeeting: (meeting: Meeting) => void
  notifyMeeting: (meetingId: string) => void
  addSuggestion: (input: {
    categoryId: string
    title: string
    body: string
    photoDataUrl?: string
  }) => void
  setSuggestionStatus: (id: string, status: SuggestionStatus) => void
  upsertSuggestionCategory: (category: SuggestionCategory) => void
  markNotificationsRead: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

function loadState(): PlatformState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PlatformState
      if (parsed?.buildings && parsed?.byId) {
        const byId: PlatformState['byId'] = {}
        for (const [id, data] of Object.entries(parsed.byId)) {
          byId[id] = normalizeBuildingData(data)
        }
        return { ...parsed, byId }
      }
    }
  } catch {
    /* ignore */
  }
  return createSeed()
}

/** Apply a payment amount to owner/resident shares (party preference). */
function applyPaymentToShares(
  bill: Bill,
  amount: number,
  party: DebtParty,
): { paidOwner: number; paidResident: number } {
  let left = amount
  let paidOwner = bill.paidOwner
  let paidResident = bill.paidResident
  const ownerDue = Math.max(0, bill.ownerShare - paidOwner)
  const residentDue = Math.max(0, bill.residentShare - paidResident)

  if (party === 'owner') {
    const o = Math.min(left, ownerDue)
    paidOwner += o
    left -= o
    const r = Math.min(left, residentDue)
    paidResident += r
  } else {
    const r = Math.min(left, residentDue)
    paidResident += r
    left -= r
    const o = Math.min(left, ownerDue)
    paidOwner += o
  }
  return { paidOwner, paidResident }
}

function billStatus(b: Bill): Bill['status'] {
  const paid = b.paidOwner + b.paidResident
  if (paid <= 0) return 'unpaid'
  if (paid >= b.total) return 'paid'
  return 'partial'
}

function patchBuilding(
  platform: PlatformState,
  buildingId: string,
  fn: (data: BuildingData) => BuildingData,
): PlatformState {
  const current = platform.byId[buildingId]
  if (!current) return platform
  return {
    ...platform,
    byId: {
      ...platform.byId,
      [buildingId]: fn(current),
    },
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<PlatformState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(platform))
  }, [platform])

  const session = platform.session

  const state = useMemo<ScopedState | null>(() => {
    if (!session?.buildingId) return null
    if (session.role === 'siteAdmin' && !session.viaSiteAdmin) return null
    const data = platform.byId[session.buildingId]
    const meta = platform.buildings.find((b) => b.id === session.buildingId)
    if (!data || !meta) return null
    return {
      ...data,
      buildingId: meta.id,
      buildingName: meta.name,
      session,
    }
  }, [platform, session])

  const loginSiteAdmin = useCallback((username: string, password: string) => {
    if (username.trim() !== SITE_ADMIN_DEMO.username || password !== SITE_ADMIN_DEMO.password) {
      return false
    }
    setPlatform((p) => ({
      ...p,
      session: { role: 'siteAdmin', displayName: 'مدیر سایت' },
    }))
    return true
  }, [])

  const loginBuilding = useCallback(
    (role: 'manager' | 'resident', buildingId: string, unitId?: string) => {
      const meta = platform.buildings.find((b) => b.id === buildingId)
      const data = platform.byId[buildingId]
      if (!meta || !data || meta.status === 'disabled') return false
      let displayName = meta.managerName || 'مدیر ساختمان'
      if (role === 'resident') {
        const unit = data.units.find((u) => u.id === unitId)
        if (!unit) return false
        displayName = `واحد ${unit.number}`
      }
      setPlatform((p) => ({
        ...p,
        session: { role, buildingId, unitId, displayName },
      }))
      return true
    },
    [platform.buildings, platform.byId],
  )

  const enterBuildingAsManager = useCallback((buildingId: string) => {
    setPlatform((p) => {
      const meta = p.buildings.find((b) => b.id === buildingId)
      if (!meta) return p
      return {
        ...p,
        session: {
          role: 'manager',
          buildingId,
          displayName: `مدیر — ${meta.name}`,
          viaSiteAdmin: true,
        },
      }
    })
  }, [])

  const returnToSiteAdmin = useCallback(() => {
    setPlatform((p) => ({
      ...p,
      session: { role: 'siteAdmin', displayName: 'مدیر سایت' },
    }))
  }, [])

  const logout = useCallback(() => {
    setPlatform((p) => ({ ...p, session: null }))
  }, [])

  const resetDemo = useCallback(() => {
    setPlatform(createSeed())
  }, [])

  const upsertBuilding = useCallback((meta: BuildingMeta) => {
    setPlatform((p) => {
      const exists = p.buildings.some((b) => b.id === meta.id)
      const buildings = exists
        ? p.buildings.map((b) => (b.id === meta.id ? meta : b))
        : [meta, ...p.buildings]
      const byId = { ...p.byId }
      if (!byId[meta.id]) {
        byId[meta.id] = createEmptyBuildingData()
      }
      // keep unitCount in sync when possible
      const liveCount = byId[meta.id].units.length
      const synced = {
        ...meta,
        unitCount: liveCount > 0 ? liveCount : meta.unitCount,
      }
      return {
        ...p,
        buildings: buildings.map((b) => (b.id === synced.id ? synced : b)),
        byId,
      }
    })
  }, [])

  const withBuilding = useCallback((fn: (data: BuildingData) => BuildingData) => {
    setPlatform((p) => {
      const bid = p.session?.buildingId
      if (!bid) return p
      return patchBuilding(p, bid, fn)
    })
  }, [])

  const runSchedule = useCallback(
    (scheduleId: string) => {
      let created = 0
      setPlatform((p) => {
        const bid = p.session?.buildingId
        if (!bid) return p
        return patchBuilding(p, bid, (data) => {
          const schedule = data.schedules.find((x) => x.id === scheduleId)
          if (!schedule) return data
          const periodLabel =
            schedule.period === 'monthly' ? 'دوره ماهانه جاری' : 'دوره فصلی جاری'
          const newBills: Bill[] = data.units.map((unit) => {
            const total = computeUnitCharge(unit, schedule)
            const ownerShare = Math.round((total * schedule.ownerSharePercent) / 100)
            created += 1
            return {
              id: `b-${scheduleId}-${unit.id}-${Date.now()}-${created}`,
              unitId: unit.id,
              title: schedule.title,
              periodLabel,
              total,
              ownerShare,
              residentShare: total - ownerShare,
              paidOwner: 0,
              paidResident: 0,
              status: 'unpaid',
              createdAt: new Date().toISOString(),
              formula: schedule.formula,
            }
          })
          return {
            ...data,
            units: data.units.map((u) => {
              const bill = newBills.find((b) => b.unitId === u.id)!
              return { ...u, balance: u.balance - bill.total }
            }),
            bills: [...newBills, ...data.bills],
            schedules: data.schedules.map((x) =>
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
              ...data.notifications,
            ],
          }
        })
      })
      return created
    },
    [],
  )

  const upsertSchedule = useCallback(
    (schedule: ChargeSchedule) => {
      withBuilding((data) => {
        const exists = data.schedules.some((x) => x.id === schedule.id)
        return {
          ...data,
          schedules: exists
            ? data.schedules.map((x) => (x.id === schedule.id ? schedule : x))
            : [schedule, ...data.schedules],
        }
      })
    },
    [withBuilding],
  )

  const payBill = useCallback((billId: string, party: DebtParty, amount?: number) => {
    let code: string | null = null
    setPlatform((p) => {
      const bid = p.session?.buildingId
      if (!bid) return p
      return patchBuilding(p, bid, (data) => {
        const bill = data.bills.find((b) => b.id === billId)
        if (!bill) return data
        const due =
          party === 'owner'
            ? Math.max(0, bill.ownerShare - bill.paidOwner)
            : Math.max(0, bill.residentShare - bill.paidResident)
        const pay = Math.min(amount ?? due, due)
        if (pay <= 0) return data
        code = trackingCode()
        const bills = data.bills.map((b) => {
          if (b.id !== billId) return b
          const next = {
            ...b,
            paidOwner: b.paidOwner + (party === 'owner' ? pay : 0),
            paidResident: b.paidResident + (party === 'resident' ? pay : 0),
          }
          return { ...next, status: billStatus(next) }
        })
        return {
          ...data,
          bills,
          units: data.units.map((u) =>
            u.id === bill.unitId ? { ...u, balance: u.balance + pay } : u,
          ),
          fundBalance: data.fundBalance + pay,
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
            ...data.payments,
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
            ...data.ledger,
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
              body: 'اطلاع‌رسانی پیامکی پس از اتصال SMS فعال می‌شود.',
              createdAt: new Date().toISOString(),
              kind: 'sms-stub' as const,
              read: false,
            },
            ...data.notifications,
          ],
        }
      })
    })
    return code
  }, [])

  const addLedger = useCallback(
    (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
      withBuilding((data) => {
        const delta = entry.kind === 'income' ? entry.amount : -entry.amount
        return {
          ...data,
          fundBalance: data.fundBalance + delta,
          ledger: [
            { ...entry, id: `l-${Date.now()}`, createdAt: new Date().toISOString() },
            ...data.ledger,
          ],
        }
      })
    },
    [withBuilding],
  )

  const votePoll = useCallback(
    (pollId: string, optionId: string) => {
      setPlatform((p) => {
        const bid = p.session?.buildingId
        if (!bid || !p.session) return p
        const voterKey = `${p.session.role}:${p.session.unitId ?? 'manager'}`
        return patchBuilding(p, bid, (data) => ({
          ...data,
          polls: data.polls.map((poll) => {
            if (poll.id !== pollId || poll.votedBy.includes(voterKey)) return poll
            return {
              ...poll,
              votedBy: [...poll.votedBy, voterKey],
              options: poll.options.map((o) =>
                o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
              ),
            }
          }),
        }))
      })
    },
    [],
  )

  const addPoll = useCallback(
    (poll: Omit<Poll, 'id' | 'votedBy' | 'options'> & { options: string[] }) => {
      withBuilding((data) => ({
        ...data,
        polls: [
          {
            id: `poll-${Date.now()}`,
            title: poll.title,
            audience: poll.audience,
            closesAt: poll.closesAt,
            votedBy: [],
            options: poll.options.map((label, i) => ({ id: `opt-${i}`, label, votes: 0 })),
          },
          ...data.polls,
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
          ...data.notifications,
        ],
      }))
    },
    [withBuilding],
  )

  const addNews = useCallback(
    (item: Omit<NewsItem, 'id' | 'createdAt'>) => {
      withBuilding((data) => ({
        ...data,
        news: [{ ...item, id: `n-${Date.now()}`, createdAt: new Date().toISOString() }, ...data.news],
        notifications: [
          {
            id: `nt-news-${Date.now()}`,
            title: 'خبر ساختمان',
            body: item.title,
            createdAt: new Date().toISOString(),
            kind: 'news' as const,
            read: false,
          },
          ...data.notifications,
        ],
      }))
    },
    [withBuilding],
  )

  const sendChat = useCallback(
    (body: string) => {
      setPlatform((p) => {
        const bid = p.session?.buildingId
        if (!bid || !p.session || !body.trim()) return p
        const author = p.session.displayName
        return patchBuilding(p, bid, (data) => ({
          ...data,
          chat: [
            ...data.chat,
            { id: `c-${Date.now()}`, author, body: body.trim(), createdAt: new Date().toISOString() },
          ],
        }))
      })
    },
    [],
  )

  const upsertMeeting = useCallback(
    (meeting: Meeting) => {
      withBuilding((data) => {
        const exists = data.meetings.some((m) => m.id === meeting.id)
        const next = { ...meeting, updatedAt: new Date().toISOString() }
        return {
          ...data,
          meetings: exists
            ? data.meetings.map((m) => (m.id === meeting.id ? next : m))
            : [next, ...data.meetings],
        }
      })
    },
    [withBuilding],
  )

  const notifyMeeting = useCallback((meetingId: string) => {
    setPlatform((p) => {
      const bid = p.session?.buildingId
      if (!bid) return p
      return patchBuilding(p, bid, (data) => {
        const meeting = data.meetings.find((m) => m.id === meetingId)
        if (!meeting) return data
        const when = new Date(meeting.scheduledAt).toLocaleString('fa-IR')
        const place = meeting.place ? ` — ${meeting.place}` : ''
        return {
          ...data,
          meetings: data.meetings.map((m) =>
            m.id === meetingId ? { ...m, notifiedAt: new Date().toISOString() } : m,
          ),
          notifications: [
            {
              id: `nt-meet-${Date.now()}`,
              title: 'اطلاع‌رسانی جلسه',
              body: `${meeting.title} · ${when}${place}`,
              createdAt: new Date().toISOString(),
              kind: 'meeting' as const,
              read: false,
            },
            {
              id: `nt-meet-sms-${Date.now()}`,
              title: 'پیامک جلسه — به‌زودی',
              body: 'ارسال پیامک واقعی پس از اتصال SMS فعال می‌شود.',
              createdAt: new Date().toISOString(),
              kind: 'sms-stub' as const,
              read: false,
            },
            ...data.notifications,
          ],
        }
      })
    })
  }, [])

  const createInstallmentPlan = useCallback(
    (billId: string, count: number, startDate: string, intervalMonths = 1) => {
      let ok = false
      setPlatform((p) => {
        const bid = p.session?.buildingId
        if (!bid || p.session?.role !== 'manager') return p
        return patchBuilding(p, bid, (data) => {
          const bill = data.bills.find((b) => b.id === billId)
          if (!bill || bill.status === 'paid') return data
          const remaining = billRemaining(bill)
          if (remaining <= 0) return data
          const installments = buildInstallments(remaining, count, startDate, intervalMonths)
          ok = true
          return {
            ...data,
            bills: data.bills.map((b) => (b.id === billId ? { ...b, installments } : b)),
            notifications: [
              {
                id: `nt-inst-${Date.now()}`,
                title: 'تقسیط شارژ',
                body: `${bill.title} به ${installments.length} قسط تقسیم شد.`,
                createdAt: new Date().toISOString(),
                kind: 'payment' as const,
                read: false,
              },
              ...data.notifications,
            ],
          }
        })
      })
      return ok
    },
    [],
  )

  const payInstallment = useCallback(
    (billId: string, installmentId: string, party: DebtParty = 'resident') => {
      let code: string | null = null
      setPlatform((p) => {
        const bid = p.session?.buildingId
        if (!bid) return p
        return patchBuilding(p, bid, (data) => {
          const bill = data.bills.find((b) => b.id === billId)
          if (!bill?.installments) return data
          const inst = bill.installments.find((i) => i.id === installmentId)
          if (!inst || inst.status === 'paid') return data
          const pay = Math.min(inst.amount, billRemaining(bill))
          if (pay <= 0) return data
          code = trackingCode()
          const shares = applyPaymentToShares(bill, pay, party)
          const nextBill: Bill = {
            ...bill,
            ...shares,
            installments: bill.installments.map((i) =>
              i.id === installmentId
                ? {
                    ...i,
                    status: 'paid' as const,
                    paidAt: new Date().toISOString(),
                    paymentId: `pay-${Date.now()}`,
                  }
                : i,
            ),
          }
          nextBill.status = billStatus(nextBill)
          return {
            ...data,
            bills: data.bills.map((b) => (b.id === billId ? nextBill : b)),
            units: data.units.map((u) =>
              u.id === bill.unitId ? { ...u, balance: u.balance + pay } : u,
            ),
            fundBalance: data.fundBalance + pay,
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
              ...data.payments,
            ],
            ledger: [
              {
                id: `l-inst-${Date.now()}`,
                kind: 'income' as const,
                category: 'شارژ',
                title: `قسط ${inst.index} — ${bill.title}`,
                amount: pay,
                note: `کد پیگیری ${code}`,
                createdAt: new Date().toISOString(),
                visibleToResidents: true,
              },
              ...data.ledger,
            ],
            notifications: [
              {
                id: `nt-inst-pay-${Date.now()}`,
                title: 'پرداخت قسط',
                body: `قسط ${inst.index} پرداخت شد — کد ${code}`,
                createdAt: new Date().toISOString(),
                kind: 'payment' as const,
                read: false,
              },
              ...data.notifications,
            ],
          }
        })
      })
      return code
    },
    [],
  )

  const addSuggestion = useCallback(
    (input: { categoryId: string; title: string; body: string; photoDataUrl?: string }) => {
      setPlatform((p) => {
        const bid = p.session?.buildingId
        if (!bid || !p.session) return p
        const authorName = p.session.displayName
        const unitId = p.session.unitId
        const suggestion: Suggestion = {
          id: `sg-${Date.now()}`,
          categoryId: input.categoryId,
          title: input.title.trim(),
          body: input.body.trim(),
          photoDataUrl: input.photoDataUrl,
          authorName,
          unitId,
          status: 'open',
          createdAt: new Date().toISOString(),
        }
        return patchBuilding(p, bid, (data) => ({
          ...data,
          suggestions: [suggestion, ...data.suggestions],
          notifications: [
            {
              id: `nt-sg-${Date.now()}`,
              title: 'پیشنهاد جدید',
              body: suggestion.title,
              createdAt: new Date().toISOString(),
              kind: 'suggestion' as const,
              read: false,
            },
            ...data.notifications,
          ],
        }))
      })
    },
    [],
  )

  const setSuggestionStatus = useCallback((id: string, status: SuggestionStatus) => {
    withBuilding((data) => ({
      ...data,
      suggestions: data.suggestions.map((s) => (s.id === id ? { ...s, status } : s)),
    }))
  }, [withBuilding])

  const upsertSuggestionCategory = useCallback((category: SuggestionCategory) => {
    withBuilding((data) => {
      const exists = data.suggestionCategories.some((c) => c.id === category.id)
      return {
        ...data,
        suggestionCategories: exists
          ? data.suggestionCategories.map((c) => (c.id === category.id ? category : c))
          : [...data.suggestionCategories, category],
      }
    })
  }, [withBuilding])

  const markNotificationsRead = useCallback(() => {
    withBuilding((data) => ({
      ...data,
      notifications: data.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [withBuilding])

  const api = useMemo(
    () => ({
      platform,
      session,
      state,
      loginSiteAdmin,
      loginBuilding,
      enterBuildingAsManager,
      returnToSiteAdmin,
      logout,
      resetDemo,
      upsertBuilding,
      runSchedule,
      upsertSchedule,
      payBill,
      createInstallmentPlan,
      payInstallment,
      addLedger,
      votePoll,
      addPoll,
      addNews,
      sendChat,
      upsertMeeting,
      notifyMeeting,
      addSuggestion,
      setSuggestionStatus,
      upsertSuggestionCategory,
      markNotificationsRead,
    }),
    [
      platform,
      session,
      state,
      loginSiteAdmin,
      loginBuilding,
      enterBuildingAsManager,
      returnToSiteAdmin,
      logout,
      resetDemo,
      upsertBuilding,
      runSchedule,
      upsertSchedule,
      payBill,
      createInstallmentPlan,
      payInstallment,
      addLedger,
      votePoll,
      addPoll,
      addNews,
      sendChat,
      upsertMeeting,
      notifyMeeting,
      addSuggestion,
      setSuggestionStatus,
      upsertSuggestionCategory,
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

/** For building screens that require scoped state */
export function useBuildingState(): ScopedState {
  const { state } = useStore()
  if (!state) throw new Error('Building context required')
  return state
}
