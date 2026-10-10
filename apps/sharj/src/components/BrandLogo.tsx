type BrandLogoProps = {
  /** full = wordmark mockup; mark = copper monogram only; stacked = mark + text */
  variant?: 'full' | 'mark' | 'stacked'
  tag?: string
  className?: string
  /** Hide the text name when using stacked (e.g. if tag alone is enough) */
  showName?: boolean
}

const TAGLINE = 'سامانه مدیریت ساختمان و پرداخت شارژ'

/**
 * شارژبان brand mark — image assets from public/logo*.
 * Prefer full mockup on auth screens; mark+name in app chrome.
 */
export function BrandLogo({
  variant = 'stacked',
  tag,
  className = '',
  showName = true,
}: BrandLogoProps) {
  if (variant === 'full') {
    return (
      <div className={`brand-logo brand-logo--full ${className}`.trim()}>
        <picture>
          <source srcSet="/logo.webp" type="image/webp" />
          <img
            src="/logo.jpg"
            alt="شارژبان — سامانه مدیریت ساختمان و پرداخت شارژ"
            className="brand-logo__full-img"
            width={320}
            height={368}
            decoding="async"
          />
        </picture>
      </div>
    )
  }

  if (variant === 'mark') {
    return (
      <picture className={`brand-logo brand-logo--mark ${className}`.trim()}>
        <source srcSet="/logo-mark.webp" type="image/webp" />
        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden
          className="brand-logo__mark-img"
          width={44}
          height={44}
          decoding="async"
        />
      </picture>
    )
  }

  return (
    <div className={`brand-mark brand-logo brand-logo--stacked ${className}`.trim()}>
      <picture className="brand-logo--mark">
        <source srcSet="/logo-mark.webp" type="image/webp" />
        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden
          className="brand-logo__mark-img"
          width={44}
          height={44}
          decoding="async"
        />
      </picture>
      {(showName || tag) && (
        <div>
          {showName && <div className="name">شارژبان</div>}
          {tag != null && tag !== '' && <span className="tag">{tag}</span>}
        </div>
      )}
    </div>
  )
}

export const SHARZHBAN_TAGLINE = TAGLINE
