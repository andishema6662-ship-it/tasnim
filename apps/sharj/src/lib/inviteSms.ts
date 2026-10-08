/** Live PWA install / open URL for resident invite SMS. */
export const SHARJ_INSTALL_URL = 'https://sharzhban.ir'

/** Optional sideload APK hosted next to the PWA (uploaded on deploy when available). */
export const SHARJ_APK_URL = 'https://sharzhban.ir/diyarsharj.apk'

/**
 * Fixed Persian SMS template for block managers inviting residents.
 * `{نام بلوک}` → buildingName; install link under «لینک نصب سامانه».
 */
export function buildResidentInviteSms(
  blockName: string,
  installUrl: string = SHARJ_INSTALL_URL,
): string {
  const name = blockName.trim() || 'بلوک'
  return [
    'باسلام',
    `عضویت شما در سامانه مدیریت شارژبان توسط مدیریت بلوک ${name} انجام شد شما با این سامانه میتوانید صورتحساب واحد خود را مشاهده و شارژ ساختمان را بصورت اینترنتی پرداخت نمایید .`,
    'لینک نصب سامانه',
    installUrl,
  ].join('\n')
}
