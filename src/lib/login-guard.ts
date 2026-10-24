/**
 * Client-side login throttling for static export only.
 * Real protection requires server-side authentication; localStorage can be cleared by an attacker.
 */

export const LOGIN_GUARD_KEY = "tasnim-admin-login-guard-v1";
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
export const MIN_ATTEMPT_INTERVAL_MS = 900;

export const GENERIC_LOGIN_ERROR = "نام کاربری یا رمز عبور نادرست است.";

interface LoginGuardState {
  failedCount: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

function readState(): LoginGuardState {
  if (typeof window === "undefined") {
    return { failedCount: 0, lockedUntil: null, lastAttemptAt: 0 };
  }
  try {
    const raw = window.localStorage.getItem(LOGIN_GUARD_KEY);
    if (!raw) return { failedCount: 0, lockedUntil: null, lastAttemptAt: 0 };
    const parsed = JSON.parse(raw) as Partial<LoginGuardState>;
    return {
      failedCount: typeof parsed.failedCount === "number" ? parsed.failedCount : 0,
      lockedUntil: typeof parsed.lockedUntil === "number" ? parsed.lockedUntil : null,
      lastAttemptAt: typeof parsed.lastAttemptAt === "number" ? parsed.lastAttemptAt : 0,
    };
  } catch {
    return { failedCount: 0, lockedUntil: null, lastAttemptAt: 0 };
  }
}

function writeState(state: LoginGuardState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function lockoutMessage(lockedUntil: number): string {
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60_000));
  return `به‌دلیل چند بار ورود ناموفق، ورود به مدت ${minutes} دقیقه مسدود است.`;
}

export function clearLoginGuard() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOGIN_GUARD_KEY);
  } catch {
    /* ignore */
  }
}

function normalizedState(now = Date.now(), persistExpired = false): LoginGuardState {
  const state = readState();
  if (state.lockedUntil && now >= state.lockedUntil) {
    const cleared = { failedCount: 0, lockedUntil: null, lastAttemptAt: state.lastAttemptAt };
    if (persistExpired) writeState(cleared);
    return cleared;
  }
  return state;
}

export function checkLoginAllowed(now = Date.now()): {
  allowed: boolean;
  message?: string;
  waitMs?: number;
} {
  const state = normalizedState(now, true);
  if (state.lockedUntil && now < state.lockedUntil) {
    return { allowed: false, message: lockoutMessage(state.lockedUntil) };
  }
  const elapsed = now - state.lastAttemptAt;
  if (state.lastAttemptAt && elapsed < MIN_ATTEMPT_INTERVAL_MS) {
    return { allowed: true, waitMs: MIN_ATTEMPT_INTERVAL_MS - elapsed };
  }
  return { allowed: true, waitMs: 0 };
}

export function recordFailedLoginAttempt(now = Date.now()) {
  const base = normalizedState(now);
  const failedCount = base.failedCount + 1;
  const lockedUntil =
    failedCount >= MAX_FAILED_LOGIN_ATTEMPTS ? now + LOGIN_LOCKOUT_MS : base.lockedUntil;
  writeState({
    failedCount,
    lockedUntil,
    lastAttemptAt: now,
  });
  if (lockedUntil && now < lockedUntil) {
    return lockoutMessage(lockedUntil);
  }
  return GENERIC_LOGIN_ERROR;
}

export function touchLoginAttempt(now = Date.now()) {
  const state = readState();
  writeState({ ...state, lastAttemptAt: now });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
