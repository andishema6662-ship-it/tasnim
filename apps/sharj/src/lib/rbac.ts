import type { FeatureModuleId } from '../store/platformTypes'
import type { Role } from '../store/types'

/** Staff roles shown in login (resident is separate demo path). */
export const STAFF_ROLES: Role[] = [
  'siteAdmin',
  'complexManager',
  'manager',
  'financeManager',
]

export const roleLabel: Record<Role, string> = {
  siteAdmin: 'ادمین کل سایت',
  complexManager: 'مدیر شهرک',
  manager: 'مدیر بلوک',
  financeManager: 'مدیر مالی بلوک',
  resident: 'ساکن / واحد',
}

export const roleHint: Record<Role, string> = {
  siteAdmin: 'همه املاک، اشتراک، امکانات و کاربران',
  complexManager: 'تیکت فنی، تیم‌ها و بلوک‌های شهرک',
  manager: 'عملیات کامل ساختمان/بلوک',
  financeManager: 'شارژ، قبوض، مالی، قرض‌الحسنه — بدون تنظیمات کامل',
  resident: 'قبض، پرداخت و مشارکت واحد خود',
}

/** Routes a building-scoped role may open (feature toggles still apply). */
const ROLE_ROUTE_PREFIXES: Record<'manager' | 'financeManager' | 'resident', string[]> = {
  manager: [
    '/app',
    '/app/units',
    '/app/residents',
    '/app/charges',
    '/app/bills',
    '/app/payments',
    '/app/finance',
    '/app/debt',
    '/app/expenses',
    '/app/polls',
    '/app/news',
    '/app/chat',
    '/app/meetings',
    '/app/suggestions',
    '/app/qarz',
    '/app/block-tickets',
    '/app/notifications',
    '/app/more',
  ],
  financeManager: [
    '/app',
    '/app/charges',
    '/app/bills',
    '/app/payments',
    '/app/finance',
    '/app/debt',
    '/app/expenses',
    '/app/qarz',
    '/app/units',
    '/app/notifications',
    '/app/more',
  ],
  resident: [
    '/app',
    '/app/units',
    '/app/residents',
    '/app/bills',
    '/app/payments',
    '/app/debt',
    '/app/expenses',
    '/app/polls',
    '/app/news',
    '/app/chat',
    '/app/meetings',
    '/app/suggestions',
    '/app/qarz',
    '/app/notifications',
    '/app/more',
  ],
}

export function roleAllowsPath(role: Role, pathname: string): boolean {
  if (role === 'siteAdmin' || role === 'complexManager') return true
  const path = pathname.replace(/\/$/, '') || '/app'
  const allowed = ROLE_ROUTE_PREFIXES[role as 'manager' | 'financeManager' | 'resident']
  if (!allowed) return false
  return allowed.some((r) => path === r || (r !== '/app' && path.startsWith(r + '/')))
}

export function isFinanceScoped(role: Role): boolean {
  return role === 'financeManager'
}

export function canManageBuildingSettings(role: Role): boolean {
  return role === 'manager' || (role === 'siteAdmin')
}

export function canModerateSuggestions(role: Role): boolean {
  return role === 'manager'
}

export function canCreateQarzFund(role: Role): boolean {
  return role === 'manager' || role === 'siteAdmin'
}

export function canEditResidents(role: Role): boolean {
  return role === 'manager'
}

/** Feature modules finance manager cares about when linking menus */
export const FINANCE_FEATURE_FOCUS: FeatureModuleId[] = [
  'charges',
  'installments',
  'payments',
  'finance',
  'qarz',
]
