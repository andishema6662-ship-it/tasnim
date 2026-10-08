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
  approvalProgress,
  buildDues,
  buildVotes,
  computeMonthlyPerUnit,
} from '../lib/qarz'
import { faDateTime } from '../lib/format'
import {
  createEmptyBuildingData,
  createSeed,
  normalizeBuildingData,
  normalizeBuildingMeta,
  STORAGE_KEY,
} from './seed'
import { resolveProgramStatus } from '../lib/broadcasts'
import { addonPrice, catalogOrDefault, defaultFeaturesFromCatalog } from '../lib/features'
import { createPlatformAdmin } from './seedAdmin'
import type {
  Complex,
  ComplexLedgerEntry,
  ComplexTicket,
  ComplexTicketStatus,
  DiscountCode,
  FeatureCatalogEntry,
  FeatureModuleId,
  GatewayConfig,
  ManagerBroadcast,
  PlatformUser,
  SideProgram,
  SiteSuggestion,
  SiteSuggestionStatus,
  SiteSupportStatus,
  SiteSupportTicket,
  SmsConfig,
  SubPeriodMonths,
  SubscriptionPayment,
  TariffTier,
  TechnicalPerson,
  TechnicalTeam,
} from './platformTypes'
import { DEMO_OTP_CODE } from './platformTypes'
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
  QarzApprovalThreshold,
  QarzFund,
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
  loginStaff: (username: string, password: string) => boolean
  loginBuilding: (
    role: 'manager' | 'financeManager' | 'resident',
    buildingId: string,
    unitId?: string,
  ) => boolean
  loginComplexManager: (username: string, password: string) => boolean
  /** SMS OTP stub: sends DEMO_OTP_CODE via configured SMS webservice stub */
  requestSmsOtp: (phone: string) => { ok: boolean; message: string; demoCode?: string }
  verifySmsOtp: (phone: string, code: string) => boolean
  enterBuildingAsManager: (buildingId: string) => void
  returnToSiteAdmin: () => void
  logout: () => void
  resetDemo: () => void
  addSiteSuggestion: (input: {
    title: string
    body: string
    category: string
    fromRole: 'complexManager' | 'manager'
    fromName: string
    complexId?: string
    buildingId?: string
  }) => void
  reviewSiteSuggestion: (
    id: string,
    status: SiteSuggestionStatus,
    reviewNote?: string,
  ) => void
  upsertBuilding: (meta: BuildingMeta) => void
  upsertUser: (user: PlatformUser) => void
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
  createQarzFund: (input: {
    title: string
    totalAmount: number
    periodMonths: number
    memberUnitIds: string[]
    approvalThreshold: QarzApprovalThreshold
    monthlyPerUnit?: number
    overrideMonthly?: boolean
    note?: string
    submitForApproval: boolean
    /** Site admin: create on this building (or first block of complex) */
    buildingId?: string
    assignedComplexId?: string
    createdBySiteAdmin?: boolean
  }) => string | null
  /** Site admin: create fund(s) for a block or every block in a complex */
  createSiteQarzAssignment: (input: {
    title: string
    totalAmount: number
    periodMonths: number
    approvalThreshold: QarzApprovalThreshold
    note?: string
    target: 'block' | 'complex'
    buildingId?: string
    complexId?: string
    submitForApproval?: boolean
  }) => number
  upsertTeam: (team: TechnicalTeam) => void
  removeTeam: (id: string) => void
  upsertSupportTicket: (ticket: SiteSupportTicket) => void
  replySupportTicket: (id: string, body: string, fromStaff?: boolean) => void
  setSupportTicketStatus: (id: string, status: SiteSupportStatus) => void
  sendSiteChat: (threadId: string, body: string) => void
  ensureSiteChatThread: (input: {
    title: string
    peerName: string
    peerRole: string
  }) => string
  submitQarzForApproval: (fundId: string) => boolean
  voteQarzFund: (fundId: string, approve: boolean) => boolean
  payQarzDue: (fundId: string, dueId: string, amount?: number) => string | null
  closeQarzFund: (fundId: string) => void
  upsertComplex: (complex: Complex) => void
  upsertDiscount: (code: DiscountCode) => void
  upsertTariff: (tier: TariffTier) => void
  updateSmsConfig: (sms: SmsConfig) => void
  testSmsStub: () => string
  updateGatewayConfig: (gw: GatewayConfig) => void
  reviewSubscriptionPayment: (
    id: string,
    status: 'approved' | 'rejected',
    asRole: 'siteAdmin' | 'manager',
  ) => void
  setBuildingStorageQuota: (buildingId: string, mb: number) => void
  setBuildingFeatures: (buildingId: string, features: FeatureModuleId[]) => void
  upsertFeatureCatalog: (catalog: FeatureCatalogEntry[]) => void
  /** Create pending/demo payment for a paid add-on; activates only when paid/approved */
  purchaseFeatureAddon: (input: {
    buildingId: string
    featureId: FeatureModuleId
    months?: SubPeriodMonths
    method?: SubscriptionPayment['method']
    status?: 'pending' | 'paid_demo'
    receiptNote?: string
  }) => string | null
  upsertBroadcast: (broadcast: ManagerBroadcast) => void
  deactivateBroadcast: (id: string) => void
  upsertSideProgram: (program: SideProgram) => void
  removeSideProgram: (id: string) => void
  createComplexTicket: (input: {
    title: string
    body: string
    category: string
  }) => string | null
  updateComplexTicket: (
    id: string,
    patch: {
      status?: ComplexTicketStatus
      assignedTeamId?: string | null
      assignedPersonId?: string | null
      resolutionNote?: string
      category?: string
    },
  ) => void
  upsertStaff: (person: TechnicalPerson) => void
  removeStaff: (id: string) => void
  upsertComplexLedger: (entry: ComplexLedgerEntry) => void
  removeComplexLedger: (id: string) => void
  logActivity: (label: string, kind?: string, buildingId?: string) => void
  markNotificationsRead: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

function loadState(): PlatformState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('diyarsharj-v3') ||
      localStorage.getItem('diyarsharj-v2')
    if (raw) {
      const parsed = JSON.parse(raw) as PlatformState
      if (parsed?.buildings && parsed?.byId) {
        const byId: PlatformState['byId'] = {}
        for (const [id, data] of Object.entries(parsed.byId)) {
          byId[id] = normalizeBuildingData(data)
        }
        const buildings = parsed.buildings.map(normalizeBuildingMeta)
        const seeded = createPlatformAdmin()
        const admin = {
          ...seeded,
          ...parsed.admin,
          staff: Array.isArray(parsed.admin?.staff) ? parsed.admin.staff : seeded.staff,
          complexLedger: Array.isArray(parsed.admin?.complexLedger)
            ? parsed.admin.complexLedger
            : seeded.complexLedger,
          featureCatalog: catalogOrDefault(parsed.admin?.featureCatalog),
          subscriptionPayments: Array.isArray(parsed.admin?.subscriptionPayments)
            ? parsed.admin.subscriptionPayments
            : seeded.subscriptionPayments,
          broadcasts: Array.isArray(parsed.admin?.broadcasts)
            ? parsed.admin.broadcasts
            : seeded.broadcasts,
          sidePrograms: Array.isArray(parsed.admin?.sidePrograms)
            ? parsed.admin.sidePrograms
            : seeded.sidePrograms,
          siteSuggestions: Array.isArray(parsed.admin?.siteSuggestions)
            ? parsed.admin.siteSuggestions
            : seeded.siteSuggestions,
          otpChallenges: Array.isArray(parsed.admin?.otpChallenges)
            ? parsed.admin.otpChallenges
            : [],
          teams: (Array.isArray(parsed.admin?.teams) ? parsed.admin.teams : seeded.teams).map(
            (t) => ({
              ...t,
              active: t.active !== false,
            }),
          ),
          supportTickets: Array.isArray(parsed.admin?.supportTickets)
            ? parsed.admin.supportTickets
            : seeded.supportTickets,
          siteChatThreads: Array.isArray(parsed.admin?.siteChatThreads)
            ? parsed.admin.siteChatThreads
            : seeded.siteChatThreads,
          siteChatMessages: Array.isArray(parsed.admin?.siteChatMessages)
            ? parsed.admin.siteChatMessages
            : seeded.siteChatMessages,
          changelog: Array.isArray(parsed.admin?.changelog)
            ? parsed.admin.changelog
            : seeded.changelog,
          users: (() => {
            const base =
              Array.isArray(parsed.admin?.users) && parsed.admin.users.length > 0
                ? parsed.admin.users
                : seeded.users
            const byUsername = new Map(base.map((u) => [u.username, u]))
            for (const seed of seeded.users) {
              if (!byUsername.has(seed.username)) byUsername.set(seed.username, seed)
            }
            return [...byUsername.values()].map((u) => {
              const seed = seeded.users.find((s) => s.id === u.id || s.username === u.username)
              return { ...u, phone: u.phone ?? seed?.phone }
            })
          })(),
          complexes: (Array.isArray(parsed.admin?.complexes)
            ? parsed.admin.complexes
            : seeded.complexes
          ).map((c) => {
            const seed = seeded.complexes.find((s) => s.id === c.id)
            return {
              ...c,
              subscriptionMonths: c.subscriptionMonths ?? seed?.subscriptionMonths,
              subscriptionAmount: c.subscriptionAmount ?? seed?.subscriptionAmount,
              subscriptionStatus: c.subscriptionStatus ?? seed?.subscriptionStatus,
              subscriptionExpiresAt: c.subscriptionExpiresAt ?? seed?.subscriptionExpiresAt,
              subscriptionTracking: c.subscriptionTracking ?? seed?.subscriptionTracking,
            }
          }),
        }
        return { ...parsed, buildings, byId, admin }
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
    if (session.role === 'complexManager') return null
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

  const applyStaffSession = useCallback((user: PlatformUser) => {
    if (user.role === 'siteAdmin') {
      setPlatform((p) => ({
        ...p,
        session: { role: 'siteAdmin', displayName: user.displayName || 'ادمین کل سایت' },
      }))
      return true
    }
    if (user.role === 'complexManager') {
      const complexId = user.complexId
      const complex = platform.admin.complexes.find((c) => c.id === complexId)
      if (!complex || complex.status !== 'active') return false
      setPlatform((p) => ({
        ...p,
        session: {
          role: 'complexManager',
          complexId: complex.id,
          displayName: `مدیر شهرک — ${complex.name}`,
        },
      }))
      return true
    }
    if (user.role === 'manager' || user.role === 'financeManager') {
      const buildingId = user.buildingId
      const meta = platform.buildings.find((b) => b.id === buildingId)
      if (!meta || meta.status === 'disabled' || !platform.byId[buildingId!]) return false
      setPlatform((p) => ({
        ...p,
        session: {
          role: user.role,
          buildingId: meta.id,
          displayName:
            user.role === 'financeManager'
              ? `مدیر مالی — ${meta.name}`
              : user.displayName || meta.managerName || 'مدیر بلوک',
        },
      }))
      return true
    }
    return false
  }, [platform.admin.complexes, platform.buildings, platform.byId])

  const loginStaff = useCallback(
    (username: string, password: string) => {
      const user = (platform.admin.users ?? []).find(
        (u) =>
          u.username === username.trim() &&
          u.password === password &&
          u.status === 'active',
      )
      if (user) return applyStaffSession(user)
      // Fallbacks for older seeds
      if (
        username.trim() === SITE_ADMIN_DEMO.username &&
        password === SITE_ADMIN_DEMO.password
      ) {
        setPlatform((p) => ({
          ...p,
          session: { role: 'siteAdmin', displayName: 'ادمین کل سایت' },
        }))
        return true
      }
      const complex = platform.admin.complexes.find(
        (c) =>
          c.username === username.trim() &&
          c.password === password &&
          c.status === 'active',
      )
      if (complex) {
        setPlatform((p) => ({
          ...p,
          session: {
            role: 'complexManager',
            complexId: complex.id,
            displayName: `مدیر شهرک — ${complex.name}`,
          },
        }))
        return true
      }
      return false
    },
    [platform.admin.users, platform.admin.complexes, applyStaffSession],
  )

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^98/, '0')

  const requestSmsOtp = useCallback(
    (phone: string) => {
      const normalized = normalizePhone(phone)
      const user = (platform.admin.users ?? []).find(
        (u) => u.status === 'active' && u.phone && normalizePhone(u.phone) === normalized,
      )
      if (!user) {
        return { ok: false, message: 'شماره‌ای با این موبایل در سیستم نیست.' }
      }
      const code = DEMO_OTP_CODE
      setPlatform((p) => ({
        ...p,
        admin: {
          ...p.admin,
          otpChallenges: [
            {
              phone: normalized,
              code,
              expiresAt: Date.now() + 5 * 60 * 1000,
              userId: user.id,
            },
            ...(p.admin.otpChallenges ?? []).filter((c) => c.phone !== normalized),
          ].slice(0, 20),
          sms: {
            ...p.admin.sms,
            lastTestAt: new Date().toISOString(),
            lastTestResult: p.admin.sms.enabled
              ? `stub OTP به ${normalized} از ${p.admin.sms.endpoint}`
              : `stub OTP (SMS خاموش) — کد دمو ${code}`,
          },
          activity: [
            {
              id: `act-otp-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'sms',
              label: `ارسال کد ورود به ${normalized} (stub)`,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }))
      return {
        ok: true,
        message: 'کد تأیید ارسال شد (شبیه‌سازی پیامک).',
        demoCode: code,
      }
    },
    [platform.admin.users],
  )

  const verifySmsOtp = useCallback(
    (phone: string, code: string) => {
      const normalized = normalizePhone(phone)
      const challenge = (platform.admin.otpChallenges ?? []).find(
        (c) => c.phone === normalized && c.expiresAt > Date.now(),
      )
      const accepted =
        code.trim() === DEMO_OTP_CODE ||
        (challenge != null && code.trim() === challenge.code)
      if (!accepted) return false
      const userId = challenge?.userId
      const user = (platform.admin.users ?? []).find(
        (u) =>
          u.status === 'active' &&
          (u.id === userId ||
            (u.phone && normalizePhone(u.phone) === normalized)),
      )
      if (!user) return false
      return applyStaffSession(user)
    },
    [platform.admin.otpChallenges, platform.admin.users, applyStaffSession],
  )

  const addSiteSuggestion = useCallback(
    (input: {
      title: string
      body: string
      category: string
      fromRole: 'complexManager' | 'manager'
      fromName: string
      complexId?: string
      buildingId?: string
    }) => {
      setPlatform((p) => {
        const role = p.session?.role
        if (role !== 'complexManager' && role !== 'manager') return p
        const suggestion: SiteSuggestion = {
          id: `ssug-${Date.now()}`,
          title: input.title,
          body: input.body,
          category: input.category,
          fromRole: input.fromRole,
          fromName: input.fromName,
          complexId: input.complexId,
          buildingId: input.buildingId,
          status: 'open',
          createdAt: new Date().toISOString(),
        }
        return {
          ...p,
          admin: {
            ...p.admin,
            siteSuggestions: [suggestion, ...(p.admin.siteSuggestions ?? [])],
            activity: [
              {
                id: `act-ssug-${Date.now()}`,
                at: new Date().toISOString(),
                kind: 'suggestion',
                label: `پیشنهاد به ادمین: ${suggestion.title}`,
                buildingId: suggestion.buildingId,
              },
              ...p.admin.activity,
            ].slice(0, 80),
          },
        }
      })
    },
    [],
  )

  const reviewSiteSuggestion = useCallback(
    (id: string, status: SiteSuggestionStatus, reviewNote?: string) => {
      setPlatform((p) => {
        if (p.session?.role !== 'siteAdmin') return p
        return {
          ...p,
          admin: {
            ...p.admin,
            siteSuggestions: (p.admin.siteSuggestions ?? []).map((s) =>
              s.id === id
                ? {
                    ...s,
                    status,
                    reviewNote,
                    reviewedAt: new Date().toISOString(),
                  }
                : s,
            ),
          },
        }
      })
    },
    [],
  )

  const loginSiteAdmin = useCallback(
    (username: string, password: string) => {
      const user = (platform.admin.users ?? []).find(
        (u) =>
          u.username === username.trim() &&
          u.password === password &&
          u.status === 'active' &&
          u.role === 'siteAdmin',
      )
      if (user) return applyStaffSession(user)
      if (
        username.trim() === SITE_ADMIN_DEMO.username &&
        password === SITE_ADMIN_DEMO.password
      ) {
        setPlatform((p) => ({
          ...p,
          session: { role: 'siteAdmin', displayName: 'ادمین کل سایت' },
        }))
        return true
      }
      return false
    },
    [platform.admin.users, applyStaffSession],
  )

  const loginBuilding = useCallback(
    (
      role: 'manager' | 'financeManager' | 'resident',
      buildingId: string,
      unitId?: string,
    ) => {
      const meta = platform.buildings.find((b) => b.id === buildingId)
      const data = platform.byId[buildingId]
      if (!meta || !data || meta.status === 'disabled') return false
      let displayName = meta.managerName || 'مدیر بلوک'
      if (role === 'financeManager') displayName = `مدیر مالی — ${meta.name}`
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

  const upsertUser = useCallback((user: PlatformUser) => {
    setPlatform((p) => {
      const exists = (p.admin.users ?? []).some((u) => u.id === user.id)
      const users = exists
        ? (p.admin.users ?? []).map((u) => (u.id === user.id ? user : u))
        : [user, ...(p.admin.users ?? [])]
      let complexes = p.admin.complexes
      if (user.role === 'complexManager' && user.complexId) {
        complexes = complexes.map((c) =>
          c.id === user.complexId
            ? {
                ...c,
                managerName: user.displayName || c.managerName,
                username: user.username,
                password: user.password,
              }
            : c,
        )
      }
      return {
        ...p,
        admin: {
          ...p.admin,
          users,
          complexes,
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'user',
              label: exists
                ? `ویرایش کاربر ${user.username}`
                : `افزودن کاربر ${user.username}`,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

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
      // Only site admin may create/edit buildings, blocks, towers
      if (p.session?.role !== 'siteAdmin') return p
      const exists = p.buildings.some((b) => b.id === meta.id)
      const withDefaults: BuildingMeta = exists
        ? meta
        : {
            ...meta,
            enabledFeatures:
              meta.enabledFeatures?.length > 0
                ? meta.enabledFeatures
                : defaultFeaturesFromCatalog(p.admin.featureCatalog),
          }
      const normalized = normalizeBuildingMeta(withDefaults)
      const byId = { ...p.byId }
      if (!byId[normalized.id]) {
        byId[normalized.id] = createEmptyBuildingData()
      }
      const liveCount = byId[normalized.id].units.length
      const synced = {
        ...normalized,
        unitCount: liveCount > 0 ? liveCount : normalized.unitCount,
      }
      const buildings = exists
        ? p.buildings.map((b) => (b.id === synced.id ? synced : b))
        : [synced, ...p.buildings]
      return {
        ...p,
        buildings,
        byId,
        admin: {
          ...p.admin,
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'property',
              label: exists ? `ویرایش ${synced.name}` : `افزودن ${synced.name}`,
              buildingId: synced.id,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const loginComplexManager = useCallback(
    (username: string, password: string) => {
      const user = (platform.admin.users ?? []).find(
        (u) =>
          u.username === username.trim() &&
          u.password === password &&
          u.status === 'active' &&
          u.role === 'complexManager',
      )
      if (user) return applyStaffSession(user)
      const complex = platform.admin.complexes.find(
        (c) =>
          c.username === username.trim() &&
          c.password === password &&
          c.status === 'active',
      )
      if (!complex) return false
      setPlatform((p) => ({
        ...p,
        session: {
          role: 'complexManager',
          complexId: complex.id,
          displayName: `مدیر شهرک — ${complex.name}`,
        },
      }))
      return true
    },
    [platform.admin.users, platform.admin.complexes, applyStaffSession],
  )

  const upsertComplex = useCallback((complex: Complex) => {
    setPlatform((p) => {
      // Only site admin may create/edit complexes (شهرک)
      if (p.session?.role !== 'siteAdmin') return p
      const exists = p.admin.complexes.some((c) => c.id === complex.id)
      const complexes = exists
        ? p.admin.complexes.map((c) => (c.id === complex.id ? complex : c))
        : [complex, ...p.admin.complexes]
      // Keep building.complexId in sync with blockIds
      const blockSet = new Set(complex.blockIds)
      const buildings = p.buildings.map((b) => {
        if (blockSet.has(b.id)) return { ...b, complexId: complex.id }
        if (b.complexId === complex.id && !blockSet.has(b.id)) {
          const { complexId: _, ...rest } = b
          return { ...rest } as typeof b
        }
        return b
      })
      return {
        ...p,
        buildings,
        admin: {
          ...p.admin,
          complexes,
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'complex',
              label: exists
                ? `به‌روزرسانی شهرک ${complex.name}`
                : `افزودن شهرک ${complex.name}`,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const logActivity = useCallback((label: string, kind = 'info', buildingId?: string) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        activity: [
          {
            id: `act-${Date.now()}`,
            at: new Date().toISOString(),
            kind,
            label,
            buildingId,
          },
          ...p.admin.activity,
        ].slice(0, 80),
      },
    }))
  }, [])

  const upsertDiscount = useCallback((code: DiscountCode) => {
    setPlatform((p) => {
      const exists = p.admin.discounts.some((d) => d.id === code.id)
      return {
        ...p,
        admin: {
          ...p.admin,
          discounts: exists
            ? p.admin.discounts.map((d) => (d.id === code.id ? code : d))
            : [code, ...p.admin.discounts],
        },
      }
    })
  }, [])

  const upsertTariff = useCallback((tier: TariffTier) => {
    setPlatform((p) => {
      const exists = p.admin.tariffs.some((t) => t.id === tier.id)
      return {
        ...p,
        admin: {
          ...p.admin,
          tariffs: exists
            ? p.admin.tariffs.map((t) => (t.id === tier.id ? tier : t))
            : [tier, ...p.admin.tariffs],
        },
      }
    })
  }, [])

  const updateSmsConfig = useCallback((sms: SmsConfig) => {
    setPlatform((p) => ({ ...p, admin: { ...p.admin, sms } }))
  }, [])

  const testSmsStub = useCallback(() => {
    const msg = 'تست پیامک شبیه‌سازی شد — اتصال واقعی به‌زودی'
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        sms: {
          ...p.admin.sms,
          lastTestAt: new Date().toISOString(),
          lastTestResult: msg,
        },
        activity: [
          {
            id: `act-sms-${Date.now()}`,
            at: new Date().toISOString(),
            kind: 'sms',
            label: 'تست وب‌سرویس پیامک (stub)',
          },
          ...p.admin.activity,
        ].slice(0, 80),
      },
    }))
    return msg
  }, [])

  const updateGatewayConfig = useCallback((gw: GatewayConfig) => {
    setPlatform((p) => ({ ...p, admin: { ...p.admin, gateway: gw } }))
  }, [])

  const reviewSubscriptionPayment = useCallback(
    (id: string, status: 'approved' | 'rejected', asRole: 'siteAdmin' | 'manager') => {
      setPlatform((p) => {
        const target = p.admin.subscriptionPayments.find((sp) => sp.id === id)
        let buildings = p.buildings
        if (status === 'approved' && target?.addonFeatureId) {
          const fid = target.addonFeatureId
          buildings = p.buildings.map((b) =>
            b.id === target.buildingId && !b.enabledFeatures.includes(fid)
              ? { ...b, enabledFeatures: [...b.enabledFeatures, fid] }
              : b,
          )
        }
        const label =
          target?.addonFeatureId != null
            ? `${status === 'approved' ? 'تأیید' : 'رد'} افزونه ${target.addonFeatureId}`
            : `${status === 'approved' ? 'تأیید' : 'رد'} پرداخت اشتراک ${id}`
        return {
          ...p,
          buildings,
          admin: {
            ...p.admin,
            subscriptionPayments: p.admin.subscriptionPayments.map((sp) =>
              sp.id === id
                ? {
                    ...sp,
                    status,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy:
                      asRole === 'siteAdmin'
                        ? 'مدیر سایت'
                        : p.session?.displayName ?? 'مدیر بلوک',
                  }
                : sp,
            ),
            activity: [
              {
                id: `act-sub-${Date.now()}`,
                at: new Date().toISOString(),
                kind: target?.addonFeatureId ? 'feature' : 'payment',
                label,
                buildingId: target?.buildingId,
              },
              ...p.admin.activity,
            ].slice(0, 80),
          },
        }
      })
    },
    [],
  )

  const upsertFeatureCatalog = useCallback((catalog: FeatureCatalogEntry[]) => {
    setPlatform((p) => {
      if (p.session?.role !== 'siteAdmin') return p
      return {
        ...p,
        admin: {
          ...p.admin,
          featureCatalog: catalog.map((e) => ({ ...e })),
          activity: [
            {
              id: `act-cat-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'feature',
              label: 'به‌روزرسانی کاتالوگ پیش‌فرض امکانات',
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const purchaseFeatureAddon = useCallback(
    (input: {
      buildingId: string
      featureId: FeatureModuleId
      months?: SubPeriodMonths
      method?: SubscriptionPayment['method']
      status?: 'pending' | 'paid_demo'
      receiptNote?: string
    }): string | null => {
      let createdId: string | null = null
      setPlatform((p) => {
        if (p.session?.role !== 'siteAdmin' && p.session?.role !== 'complexManager') {
          return p
        }
        if (
          p.session.role === 'complexManager' &&
          !p.admin.complexes
            .find((c) => c.id === p.session?.complexId)
            ?.blockIds.includes(input.buildingId)
        ) {
          return p
        }
        const catalog = catalogOrDefault(p.admin.featureCatalog)
        const entry = catalog.find((e) => e.id === input.featureId)
        if (!entry?.paidAddon) return p
        const months: SubPeriodMonths =
          entry.pricingMode === 'one_time' ? 12 : (input.months ?? 12)
        const amount = addonPrice(entry, entry.pricingMode === 'one_time' ? 12 : months)
        const status = input.status ?? 'pending'
        createdId = `sp-addon-${Date.now()}`
        const payment: SubscriptionPayment = {
          id: createdId,
          buildingId: input.buildingId,
          amount,
          units: 1,
          months: entry.pricingMode === 'one_time' ? 0 : months,
          method: input.method ?? 'bank_receipt',
          status,
          trackingCode: trackingCode(),
          createdAt: new Date().toISOString(),
          reviewedAt: status === 'paid_demo' ? new Date().toISOString() : undefined,
          reviewedBy: status === 'paid_demo' ? p.session?.displayName : undefined,
          receiptNote:
            input.receiptNote ??
            `خرید افزونه «${entry.label}» — ${
              entry.pricingMode === 'one_time' ? 'یک‌بار' : `${months} ماهه`
            }`,
          addonFeatureId: input.featureId,
          kind: 'feature_addon',
        }
        let buildings = p.buildings
        if (status === 'paid_demo') {
          buildings = p.buildings.map((b) =>
            b.id === input.buildingId && !b.enabledFeatures.includes(input.featureId)
              ? { ...b, enabledFeatures: [...b.enabledFeatures, input.featureId] }
              : b.id === input.buildingId
                ? b
                : b,
          )
          // ensure feature listed even if already present
          buildings = buildings.map((b) =>
            b.id === input.buildingId && !b.enabledFeatures.includes(input.featureId)
              ? { ...b, enabledFeatures: [...b.enabledFeatures, input.featureId] }
              : b,
          )
        } else {
          // Mark desired but FeatureGate keeps it off until paid
          buildings = p.buildings.map((b) =>
            b.id === input.buildingId && !b.enabledFeatures.includes(input.featureId)
              ? { ...b, enabledFeatures: [...b.enabledFeatures, input.featureId] }
              : b,
          )
        }
        return {
          ...p,
          buildings,
          admin: {
            ...p.admin,
            subscriptionPayments: [payment, ...p.admin.subscriptionPayments],
            activity: [
              {
                id: `act-addon-${Date.now()}`,
                at: new Date().toISOString(),
                kind: 'feature',
                label:
                  status === 'paid_demo'
                    ? `فعال‌سازی افزونه ${entry.label} (پرداخت دمو)`
                    : `درخواست افزونه ${entry.label}`,
                buildingId: input.buildingId,
              },
              ...p.admin.activity,
            ].slice(0, 80),
          },
        }
      })
      return createdId
    },
    [],
  )

  const setBuildingStorageQuota = useCallback((buildingId: string, mb: number) => {
    setPlatform((p) => ({
      ...p,
      buildings: p.buildings.map((b) =>
        b.id === buildingId ? { ...b, storageQuotaMb: Math.max(50, mb) } : b,
      ),
    }))
  }, [])

  const setBuildingFeatures = useCallback(
    (buildingId: string, features: FeatureModuleId[]) => {
      setPlatform((p) => ({
        ...p,
        buildings: p.buildings.map((b) =>
          b.id === buildingId ? { ...b, enabledFeatures: features } : b,
        ),
        admin: {
          ...p.admin,
          activity: [
            {
              id: `act-feat-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'feature',
              label: 'به‌روزرسانی امکانات بلوک',
              buildingId,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }))
    },
    [],
  )

  const upsertBroadcast = useCallback((broadcast: ManagerBroadcast) => {
    setPlatform((p) => {
      const role = p.session?.role
      if (
        role !== 'siteAdmin' &&
        role !== 'complexManager' &&
        role !== 'manager'
      ) {
        return p
      }
      const exists = (p.admin.broadcasts ?? []).some((b) => b.id === broadcast.id)
      const broadcasts = exists
        ? (p.admin.broadcasts ?? []).map((b) => (b.id === broadcast.id ? broadcast : b))
        : [broadcast, ...(p.admin.broadcasts ?? [])]

      // Fan-out notification into relevant building inboxes
      const byId = { ...p.byId }
      const targetBuildingIds = new Set<string>()
      if (broadcast.audience === 'building_members' && broadcast.buildingId) {
        targetBuildingIds.add(broadcast.buildingId)
      } else if (
        (broadcast.audience === 'complex_members' ||
          broadcast.audience === 'block_managers') &&
        broadcast.complexId
      ) {
        for (const b of p.buildings) {
          if (b.complexId === broadcast.complexId) targetBuildingIds.add(b.id)
        }
      } else if (broadcast.audience === 'complex_managers') {
        for (const c of p.admin.complexes) {
          for (const id of c.blockIds) targetBuildingIds.add(id)
        }
      }
      if (!exists) {
        for (const bid of targetBuildingIds) {
          const data = byId[bid]
          if (!data) continue
          byId[bid] = {
            ...data,
            notifications: [
              {
                id: `n-bc-${broadcast.id}-${bid}`,
                title: `پیام مدیر: ${broadcast.title}`,
                body: broadcast.body,
                createdAt: broadcast.createdAt,
                kind: 'broadcast' as const,
                read: false,
              },
              ...data.notifications,
            ].slice(0, 60),
          }
        }
      }

      return {
        ...p,
        byId,
        admin: {
          ...p.admin,
          broadcasts,
          activity: [
            {
              id: `act-bc-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'broadcast',
              label: exists
                ? `ویرایش پیام مدیر «${broadcast.title}»`
                : `ارسال پیام مدیر «${broadcast.title}»`,
              buildingId: broadcast.buildingId,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const deactivateBroadcast = useCallback((id: string) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        broadcasts: (p.admin.broadcasts ?? []).map((b) =>
          b.id === id ? { ...b, active: false } : b,
        ),
      },
    }))
  }, [])

  const upsertSideProgram = useCallback((program: SideProgram) => {
    setPlatform((p) => {
      const role = p.session?.role
      if (role !== 'siteAdmin' && role !== 'complexManager' && role !== 'manager') {
        return p
      }
      if (role === 'complexManager' && program.scope === 'complex') {
        if (program.complexId !== p.session?.complexId) return p
      }
      if (role === 'manager') {
        if (program.scope !== 'building' || program.buildingId !== p.session?.buildingId) {
          return p
        }
      }
      const withStatus: SideProgram = {
        ...program,
        status: resolveProgramStatus(program.startsAt, program.endsAt),
      }
      const list = p.admin.sidePrograms ?? []
      const exists = list.some((x) => x.id === withStatus.id)
      const sidePrograms = exists
        ? list.map((x) => (x.id === withStatus.id ? withStatus : x))
        : [withStatus, ...list]

      const byId = { ...p.byId }
      if (!exists) {
        const targets =
          withStatus.scope === 'building' && withStatus.buildingId
            ? [withStatus.buildingId]
            : p.buildings
                .filter((b) => b.complexId === withStatus.complexId)
                .map((b) => b.id)
        for (const bid of targets) {
          const data = byId[bid]
          if (!data) continue
          byId[bid] = {
            ...data,
            notifications: [
              {
                id: `n-prg-${withStatus.id}-${bid}`,
                title: `برنامه جانبی: ${withStatus.title}`,
                body: withStatus.description,
                createdAt: new Date().toISOString(),
                kind: 'program' as const,
                read: false,
              },
              ...data.notifications,
            ].slice(0, 60),
          }
        }
      }

      return {
        ...p,
        byId,
        admin: {
          ...p.admin,
          sidePrograms,
          activity: [
            {
              id: `act-prg-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'program',
              label: exists
                ? `ویرایش برنامه «${withStatus.title}»`
                : `ثبت برنامه «${withStatus.title}»`,
              buildingId: withStatus.buildingId,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const removeSideProgram = useCallback((id: string) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        sidePrograms: (p.admin.sidePrograms ?? []).filter((x) => x.id !== id),
      },
    }))
  }, [])

  const createComplexTicket = useCallback(
    (input: { title: string; body: string; category: string }) => {
      let id: string | null = null
      setPlatform((p) => {
        if (p.session?.role !== 'manager' || !p.session.buildingId) return p
        const building = p.buildings.find((b) => b.id === p.session!.buildingId)
        if (!building?.complexId) return p
        id = `tkt-${Date.now()}`
        const ticket: ComplexTicket = {
          id,
          complexId: building.complexId,
          buildingId: building.id,
          category: input.category.trim() || 'سایر',
          title: input.title.trim(),
          body: input.body.trim(),
          status: 'open',
          createdBy: `${p.session.displayName} (مدیر بلوک)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return {
          ...p,
          admin: {
            ...p.admin,
            tickets: [ticket, ...p.admin.tickets],
            activity: [
              {
                id: `act-tkt-${Date.now()}`,
                at: new Date().toISOString(),
                kind: 'ticket',
                label: `تیکت جدید: ${ticket.title}`,
                buildingId: building.id,
              },
              ...p.admin.activity,
            ].slice(0, 80),
          },
        }
      })
      return id
    },
    [],
  )

  const updateComplexTicket = useCallback(
    (
      id: string,
      patch: {
        status?: ComplexTicketStatus
        assignedTeamId?: string | null
        assignedPersonId?: string | null
        resolutionNote?: string
        category?: string
      },
    ) => {
      setPlatform((p) => ({
        ...p,
        admin: {
          ...p.admin,
          tickets: p.admin.tickets.map((t) => {
            if (t.id !== id) return t
            const next = { ...t, updatedAt: new Date().toISOString() }
            if (patch.status !== undefined) next.status = patch.status
            if (patch.category !== undefined) next.category = patch.category
            if (patch.resolutionNote !== undefined) next.resolutionNote = patch.resolutionNote
            if (patch.assignedTeamId !== undefined) {
              next.assignedTeamId = patch.assignedTeamId || undefined
            }
            if (patch.assignedPersonId !== undefined) {
              next.assignedPersonId = patch.assignedPersonId || undefined
            }
            return next
          }),
        },
      }))
    },
    [],
  )

  const upsertStaff = useCallback((person: TechnicalPerson) => {
    setPlatform((p) => {
      const list = p.admin.staff ?? []
      const exists = list.some((s) => s.id === person.id)
      return {
        ...p,
        admin: {
          ...p.admin,
          staff: exists
            ? list.map((s) => (s.id === person.id ? person : s))
            : [person, ...list],
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'staff',
              label: exists
                ? `ویرایش نیروی فنی ${person.name}`
                : `افزودن نیروی فنی ${person.name}`,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const removeStaff = useCallback((id: string) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        staff: (p.admin.staff ?? []).filter((s) => s.id !== id),
        tickets: p.admin.tickets.map((t) =>
          t.assignedPersonId === id ? { ...t, assignedPersonId: undefined } : t,
        ),
      },
    }))
  }, [])

  const upsertComplexLedger = useCallback((entry: ComplexLedgerEntry) => {
    setPlatform((p) => {
      const list = p.admin.complexLedger ?? []
      const exists = list.some((e) => e.id === entry.id)
      return {
        ...p,
        admin: {
          ...p.admin,
          complexLedger: exists
            ? list.map((e) => (e.id === entry.id ? entry : e))
            : [entry, ...list],
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'complex-finance',
              label: `${entry.kind === 'expense' ? 'هزینه' : 'درآمد'} شهرک: ${entry.title}`,
              buildingId: entry.buildingId,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const removeComplexLedger = useCallback((id: string) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        complexLedger: (p.admin.complexLedger ?? []).filter((e) => e.id !== id),
      },
    }))
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
        const when = faDateTime(meeting.scheduledAt)
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

  const createQarzFund = useCallback(
    (input: {
      title: string
      totalAmount: number
      periodMonths: number
      memberUnitIds: string[]
      approvalThreshold: QarzApprovalThreshold
      monthlyPerUnit?: number
      overrideMonthly?: boolean
      note?: string
      submitForApproval: boolean
      buildingId?: string
      assignedComplexId?: string
      createdBySiteAdmin?: boolean
    }) => {
      let id: string | null = null
      setPlatform((p) => {
        const role = p.session?.role
        const bid =
          input.buildingId ||
          (role === 'manager' || role === 'siteAdmin' ? p.session?.buildingId : undefined)
        if (!bid) return p
        if (role !== 'manager' && role !== 'siteAdmin') return p
        const members = input.memberUnitIds.filter(Boolean)
        if (!input.title.trim() || members.length < 1 || input.periodMonths < 1) return p
        const override = Boolean(input.overrideMonthly && input.monthlyPerUnit)
        const monthly = override
          ? Math.round(input.monthlyPerUnit!)
          : computeMonthlyPerUnit(input.totalAmount, members.length, input.periodMonths)
        id = `qf-${Date.now()}`
        const fund: QarzFund = {
          id,
          title: input.title.trim(),
          totalAmount: input.totalAmount,
          periodMonths: input.periodMonths,
          monthlyPerUnit: monthly,
          overrideMonthly: override,
          memberUnitIds: members,
          approvalThreshold: input.approvalThreshold,
          status: input.submitForApproval ? 'awaiting_approval' : 'draft',
          votes: buildVotes(members),
          dues: [],
          payments: [],
          note: input.note?.trim() || undefined,
          createdAt: new Date().toISOString(),
          createdBySiteAdmin: input.createdBySiteAdmin || role === 'siteAdmin',
          assignedComplexId: input.assignedComplexId,
        }
        return patchBuilding(p, bid, (data) => ({
          ...data,
          qarzFunds: [fund, ...data.qarzFunds],
          notifications: input.submitForApproval
            ? [
                {
                  id: `nt-qarz-${Date.now()}`,
                  title: 'تأیید صندوق قرض‌الحسنه',
                  body: `${fund.title} در انتظار رأی واحدهای عضو است.`,
                  createdAt: new Date().toISOString(),
                  kind: 'qarz' as const,
                  read: false,
                },
                ...data.notifications,
              ]
            : data.notifications,
        }))
      })
      return id
    },
    [],
  )

  const createSiteQarzAssignment = useCallback(
    (input: {
      title: string
      totalAmount: number
      periodMonths: number
      approvalThreshold: QarzApprovalThreshold
      note?: string
      target: 'block' | 'complex'
      buildingId?: string
      complexId?: string
      submitForApproval?: boolean
    }) => {
      let created = 0
      setPlatform((p) => {
        if (p.session?.role !== 'siteAdmin') return p
        if (!input.title.trim() || input.periodMonths < 1) return p
        let buildingIds: string[] = []
        if (input.target === 'block' && input.buildingId) {
          buildingIds = [input.buildingId]
        } else if (input.target === 'complex' && input.complexId) {
          const cpx = p.admin.complexes.find((c) => c.id === input.complexId)
          buildingIds = cpx?.blockIds?.length
            ? [...cpx.blockIds]
            : p.buildings.filter((b) => b.complexId === input.complexId).map((b) => b.id)
        }
        if (buildingIds.length === 0) return p
        let next = p
        const stamp = Date.now()
        for (let i = 0; i < buildingIds.length; i++) {
          const bid = buildingIds[i]
          const data = next.byId[bid]
          if (!data) continue
          const members = data.units.map((u) => u.id)
          if (members.length < 1) continue
          const monthly = computeMonthlyPerUnit(
            input.totalAmount,
            members.length,
            input.periodMonths,
          )
          const fund: QarzFund = {
            id: `qf-site-${stamp}-${i}`,
            title: input.title.trim(),
            totalAmount: input.totalAmount,
            periodMonths: input.periodMonths,
            monthlyPerUnit: monthly,
            overrideMonthly: false,
            memberUnitIds: members,
            approvalThreshold: input.approvalThreshold,
            status: input.submitForApproval ? 'awaiting_approval' : 'draft',
            votes: buildVotes(members),
            dues: [],
            payments: [],
            note: input.note?.trim() || undefined,
            createdAt: new Date().toISOString(),
            createdBySiteAdmin: true,
            assignedComplexId:
              input.target === 'complex' ? input.complexId : undefined,
          }
          created += 1
          next = patchBuilding(next, bid, (d) => ({
            ...d,
            qarzFunds: [fund, ...d.qarzFunds],
          }))
        }
        if (created === 0) return p
        return {
          ...next,
          admin: {
            ...next.admin,
            activity: [
              {
                id: `act-${stamp}`,
                at: new Date().toISOString(),
                kind: 'qarz',
                label: `ایجاد مرکزی صندوق «${input.title.trim()}» (${created} محل)`,
              },
              ...next.admin.activity,
            ].slice(0, 80),
          },
        }
      })
      return created
    },
    [],
  )

  const upsertTeam = useCallback((team: TechnicalTeam) => {
    setPlatform((p) => {
      const list = p.admin.teams ?? []
      const exists = list.some((t) => t.id === team.id)
      const next = { ...team, active: team.active !== false }
      return {
        ...p,
        admin: {
          ...p.admin,
          teams: exists
            ? list.map((t) => (t.id === team.id ? next : t))
            : [next, ...list],
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'team',
              label: exists ? `ویرایش تیم ${team.name}` : `افزودن تیم ${team.name}`,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const removeTeam = useCallback((id: string) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        teams: (p.admin.teams ?? []).filter((t) => t.id !== id),
        tickets: p.admin.tickets.map((t) =>
          t.assignedTeamId === id ? { ...t, assignedTeamId: undefined } : t,
        ),
      },
    }))
  }, [])

  const upsertSupportTicket = useCallback((ticket: SiteSupportTicket) => {
    setPlatform((p) => {
      const list = p.admin.supportTickets ?? []
      const exists = list.some((t) => t.id === ticket.id)
      return {
        ...p,
        admin: {
          ...p.admin,
          supportTickets: exists
            ? list.map((t) => (t.id === ticket.id ? ticket : t))
            : [ticket, ...list],
          activity: [
            {
              id: `act-${Date.now()}`,
              at: new Date().toISOString(),
              kind: 'support',
              label: exists
                ? `بروزرسانی تیکت پشتیبانی: ${ticket.subject}`
                : `تیکت پشتیبانی جدید: ${ticket.subject}`,
              buildingId: ticket.buildingId,
            },
            ...p.admin.activity,
          ].slice(0, 80),
        },
      }
    })
  }, [])

  const replySupportTicket = useCallback(
    (id: string, body: string, fromStaff = true) => {
      const text = body.trim()
      if (!text) return
      setPlatform((p) => ({
        ...p,
        admin: {
          ...p.admin,
          supportTickets: (p.admin.supportTickets ?? []).map((t) => {
            if (t.id !== id) return t
            const at = new Date().toISOString()
            return {
              ...t,
              status: fromStaff ? ('answered' as SiteSupportStatus) : t.status,
              updatedAt: at,
              messages: [
                ...t.messages,
                {
                  id: `sm-${Date.now()}`,
                  author: fromStaff
                    ? p.session?.displayName || 'پشتیبانی'
                    : t.requesterName,
                  body: text,
                  at,
                  fromStaff,
                },
              ],
            }
          }),
        },
      }))
    },
    [],
  )

  const setSupportTicketStatus = useCallback((id: string, status: SiteSupportStatus) => {
    setPlatform((p) => ({
      ...p,
      admin: {
        ...p.admin,
        supportTickets: (p.admin.supportTickets ?? []).map((t) =>
          t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
        ),
      },
    }))
  }, [])

  const sendSiteChat = useCallback((threadId: string, body: string) => {
    const text = body.trim()
    if (!text) return
    setPlatform((p) => {
      const at = new Date().toISOString()
      return {
        ...p,
        admin: {
          ...p.admin,
          siteChatMessages: [
            ...(p.admin.siteChatMessages ?? []),
            {
              id: `scm-${Date.now()}`,
              threadId,
              author: p.session?.displayName || 'ادمین',
              body: text,
              at,
              mine: true,
            },
          ],
          siteChatThreads: (p.admin.siteChatThreads ?? []).map((th) =>
            th.id === threadId ? { ...th, updatedAt: at, unread: 0 } : th,
          ),
        },
      }
    })
  }, [])

  const ensureSiteChatThread = useCallback(
    (input: { title: string; peerName: string; peerRole: string }) => {
      let id = `sch-${Date.now()}`
      setPlatform((p) => {
        const existing = (p.admin.siteChatThreads ?? []).find(
          (t) => t.peerName === input.peerName && t.title === input.title,
        )
        if (existing) {
          id = existing.id
          return p
        }
        return {
          ...p,
          admin: {
            ...p.admin,
            siteChatThreads: [
              {
                id,
                title: input.title,
                peerName: input.peerName,
                peerRole: input.peerRole,
                unread: 0,
                updatedAt: new Date().toISOString(),
              },
              ...(p.admin.siteChatThreads ?? []),
            ],
          },
        }
      })
      return id
    },
    [],
  )

  const submitQarzForApproval = useCallback((fundId: string) => {
    let ok = false
    setPlatform((p) => {
      const bid = p.session?.buildingId
      if (!bid || p.session?.role !== 'manager') return p
      return patchBuilding(p, bid, (data) => {
        const fund = data.qarzFunds.find((f) => f.id === fundId)
        if (!fund || fund.status !== 'draft') return data
        ok = true
        return {
          ...data,
          qarzFunds: data.qarzFunds.map((f) =>
            f.id === fundId ? { ...f, status: 'awaiting_approval' as const } : f,
          ),
          notifications: [
            {
              id: `nt-qarz-sub-${Date.now()}`,
              title: 'تأیید صندوق قرض‌الحسنه',
              body: `${fund.title} در انتظار رأی واحدهای عضو است.`,
              createdAt: new Date().toISOString(),
              kind: 'qarz' as const,
              read: false,
            },
            ...data.notifications,
          ],
        }
      })
    })
    return ok
  }, [])

  const voteQarzFund = useCallback((fundId: string, approve: boolean) => {
    let ok = false
    setPlatform((p) => {
      const bid = p.session?.buildingId
      const unitId = p.session?.unitId
      if (!bid || p.session?.role !== 'resident' || !unitId) return p
      return patchBuilding(p, bid, (data) => {
        const fund = data.qarzFunds.find((f) => f.id === fundId)
        if (!fund || fund.status !== 'awaiting_approval') return data
        if (!fund.memberUnitIds.includes(unitId)) return data
        const votes = fund.votes.map((v) =>
          v.unitId === unitId
            ? { ...v, approved: approve, votedAt: new Date().toISOString() }
            : v,
        )
        let next: QarzFund = { ...fund, votes }
        const progress = approvalProgress(next)
        if (progress.passed) {
          next = {
            ...next,
            status: 'active',
            activatedAt: new Date().toISOString(),
            dues: buildDues(
              next.memberUnitIds,
              next.monthlyPerUnit,
              next.periodMonths,
              new Date().toISOString(),
            ),
          }
        }
        ok = true
        return {
          ...data,
          qarzFunds: data.qarzFunds.map((f) => (f.id === fundId ? next : f)),
          notifications: progress.passed
            ? [
                {
                  id: `nt-qarz-on-${Date.now()}`,
                  title: 'صندوق قرض‌الحسنه فعال شد',
                  body: `${next.title} پس از تأیید اعضا فعال گردید.`,
                  createdAt: new Date().toISOString(),
                  kind: 'qarz' as const,
                  read: false,
                },
                ...data.notifications,
              ]
            : data.notifications,
        }
      })
    })
    return ok
  }, [])

  const payQarzDue = useCallback((fundId: string, dueId: string, amount?: number) => {
    let code: string | null = null
    setPlatform((p) => {
      const bid = p.session?.buildingId
      if (!bid || !p.session) return p
      return patchBuilding(p, bid, (data) => {
        const fund = data.qarzFunds.find((f) => f.id === fundId)
        if (!fund || fund.status !== 'active') return data
        const due = fund.dues.find((d) => d.id === dueId)
        if (!due) return data
        // resident may only pay own unit; manager any
        if (p.session!.role === 'resident' && p.session!.unitId !== due.unitId) return data
        const remain = Math.max(0, due.amount - due.paidAmount)
        const pay = Math.min(amount ?? remain, remain)
        if (pay <= 0) return data
        code = trackingCode()
        const paidAmount = due.paidAmount + pay
        const status =
          paidAmount >= due.amount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'
        const dues = fund.dues.map((d) =>
          d.id === dueId ? { ...d, paidAmount, status: status as typeof d.status } : d,
        )
        const payments = [
          {
            id: `qp-${Date.now()}`,
            fundId,
            unitId: due.unitId,
            dueId,
            amount: pay,
            trackingCode: code!,
            createdAt: new Date().toISOString(),
            recordedBy: p.session!.displayName,
          },
          ...fund.payments,
        ]
        const allPaid = dues.every((d) => d.status === 'paid')
        const next: QarzFund = {
          ...fund,
          dues,
          payments,
          status: allPaid ? 'completed' : fund.status,
          closedAt: allPaid ? new Date().toISOString() : fund.closedAt,
        }
        return {
          ...data,
          fundBalance: data.fundBalance + pay,
          qarzFunds: data.qarzFunds.map((f) => (f.id === fundId ? next : f)),
          ledger: [
            {
              id: `l-qarz-${Date.now()}`,
              kind: 'income' as const,
              category: 'قرض‌الحسنه',
              title: `${fund.title} — ماه ${due.monthIndex}`,
              amount: pay,
              note: `کد ${code}`,
              createdAt: new Date().toISOString(),
              visibleToResidents: true,
            },
            ...data.ledger,
          ],
          notifications: [
            {
              id: `nt-qarz-pay-${Date.now()}`,
              title: 'پرداخت صندوق قرض‌الحسنه',
              body: `مبلغ ${pay.toLocaleString('fa-IR')} تومان — کد ${code}`,
              createdAt: new Date().toISOString(),
              kind: 'qarz' as const,
              read: false,
            },
            ...data.notifications,
          ],
        }
      })
    })
    return code
  }, [])

  const closeQarzFund = useCallback((fundId: string) => {
    withBuilding((data) => ({
      ...data,
      qarzFunds: data.qarzFunds.map((f) =>
        f.id === fundId
          ? { ...f, status: 'closed' as const, closedAt: new Date().toISOString() }
          : f,
      ),
    }))
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
      loginStaff,
      loginBuilding,
      loginComplexManager,
      requestSmsOtp,
      verifySmsOtp,
      enterBuildingAsManager,
      returnToSiteAdmin,
      logout,
      resetDemo,
      addSiteSuggestion,
      reviewSiteSuggestion,
      upsertBuilding,
      upsertUser,
      upsertComplex,
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
      createQarzFund,
      createSiteQarzAssignment,
      submitQarzForApproval,
      voteQarzFund,
      payQarzDue,
      closeQarzFund,
      upsertDiscount,
      upsertTariff,
      updateSmsConfig,
      testSmsStub,
      updateGatewayConfig,
      reviewSubscriptionPayment,
      setBuildingStorageQuota,
      setBuildingFeatures,
      upsertFeatureCatalog,
      purchaseFeatureAddon,
      upsertBroadcast,
      deactivateBroadcast,
      upsertSideProgram,
      removeSideProgram,
      createComplexTicket,
      updateComplexTicket,
      upsertStaff,
      removeStaff,
      upsertTeam,
      removeTeam,
      upsertSupportTicket,
      replySupportTicket,
      setSupportTicketStatus,
      sendSiteChat,
      ensureSiteChatThread,
      upsertComplexLedger,
      removeComplexLedger,
      logActivity,
      markNotificationsRead,
    }),
    [
      platform,
      session,
      state,
      loginSiteAdmin,
      loginStaff,
      loginBuilding,
      loginComplexManager,
      requestSmsOtp,
      verifySmsOtp,
      enterBuildingAsManager,
      returnToSiteAdmin,
      logout,
      resetDemo,
      addSiteSuggestion,
      reviewSiteSuggestion,
      upsertBuilding,
      upsertUser,
      upsertComplex,
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
      createQarzFund,
      createSiteQarzAssignment,
      submitQarzForApproval,
      voteQarzFund,
      payQarzDue,
      closeQarzFund,
      upsertDiscount,
      upsertTariff,
      updateSmsConfig,
      testSmsStub,
      updateGatewayConfig,
      reviewSubscriptionPayment,
      setBuildingStorageQuota,
      setBuildingFeatures,
      upsertFeatureCatalog,
      purchaseFeatureAddon,
      upsertBroadcast,
      deactivateBroadcast,
      upsertSideProgram,
      removeSideProgram,
      createComplexTicket,
      updateComplexTicket,
      upsertStaff,
      removeStaff,
      upsertTeam,
      removeTeam,
      upsertSupportTicket,
      replySupportTicket,
      setSupportTicketStatus,
      sendSiteChat,
      ensureSiteChatThread,
      upsertComplexLedger,
      removeComplexLedger,
      logActivity,
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
