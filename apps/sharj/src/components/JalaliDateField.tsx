import {
  MONTHS_FA,
  daysInJalaliMonth,
  jalaliDateValueToIso,
  jalaliPartsToIso,
  toJalaliDateValue,
  toJalaliParts,
  toLocalInput,
  localInputToIso,
} from '../lib/format'

function yearOptions(center: number) {
  const years: number[] = []
  for (let y = center - 8; y <= center + 4; y++) years.push(y)
  return years
}

/** Shamsi date picker — stores/emits ISO via onChangeIso, or compact value via onChange */
export function JalaliDateField({
  label,
  valueIso,
  onChangeIso,
}: {
  label?: string
  valueIso: string
  onChangeIso: (iso: string) => void
}) {
  const parts = toJalaliParts(valueIso) ?? toJalaliParts(new Date().toISOString())!
  const maxDay = daysInJalaliMonth(parts.jy, parts.jm)
  const jd = Math.min(parts.jd, maxDay)

  const set = (patch: Partial<{ jy: number; jm: number; jd: number }>) => {
    const next = { jy: parts.jy, jm: parts.jm, jd, ...patch }
    const dim = daysInJalaliMonth(next.jy, next.jm)
    if (next.jd > dim) next.jd = dim
    onChangeIso(jalaliPartsToIso({ ...next, hour: 12, minute: 0 }))
  }

  return (
    <div className="field">
      {label ? <label>{label}</label> : null}
      <div className="jalali-picker">
        <select
          aria-label="روز"
          value={jd}
          onChange={(e) => set({ jd: Number(e.target.value) })}
        >
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label="ماه"
          value={parts.jm}
          onChange={(e) => set({ jm: Number(e.target.value) })}
        >
          {MONTHS_FA.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="سال"
          value={parts.jy}
          onChange={(e) => set({ jy: Number(e.target.value) })}
        >
          {yearOptions(parts.jy).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="sub" style={{ marginTop: 4 }}>
        تقویم شمسی · ذخیره داخلی ISO
      </div>
    </div>
  )
}

/** Value as compact Shamsi `YYYY-MM-DD` (ASCII) for simple form state */
export function JalaliDateValueField({
  label,
  value,
  onChange,
}: {
  label?: string
  value: string
  onChange: (jalaliYmd: string) => void
}) {
  const iso = value ? jalaliDateValueToIso(value) : new Date().toISOString()
  return (
    <JalaliDateField
      label={label}
      valueIso={iso}
      onChangeIso={(nextIso) => onChange(toJalaliDateValue(nextIso))}
    />
  )
}

export function JalaliDateTimeField({
  label,
  valueLocal,
  onChangeLocal,
}: {
  label?: string
  /** Shamsi wall `YYYY-MM-DDTHH:mm` from toLocalInput */
  valueLocal: string
  onChangeLocal: (local: string) => void
}) {
  const iso = valueLocal ? localInputToIso(valueLocal) : new Date().toISOString()
  const parts = toJalaliParts(iso) ?? toJalaliParts(new Date().toISOString())!
  const maxDay = daysInJalaliMonth(parts.jy, parts.jm)
  const jd = Math.min(parts.jd, maxDay)

  const emit = (patch: Partial<typeof parts>) => {
    const next = { ...parts, jd, ...patch }
    const dim = daysInJalaliMonth(next.jy, next.jm)
    if (next.jd > dim) next.jd = dim
    onChangeLocal(toLocalInput(jalaliPartsToIso(next)))
  }

  return (
    <div className="field">
      {label ? <label>{label}</label> : null}
      <div className="jalali-picker">
        <select value={jd} onChange={(e) => emit({ jd: Number(e.target.value) })}>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={parts.jm} onChange={(e) => emit({ jm: Number(e.target.value) })}>
          {MONTHS_FA.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select value={parts.jy} onChange={(e) => emit({ jy: Number(e.target.value) })}>
          {yearOptions(parts.jy).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="jalali-picker" style={{ marginTop: 8 }}>
        <select
          aria-label="ساعت"
          value={parts.hour}
          onChange={(e) => emit({ hour: Number(e.target.value) })}
        >
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select
          aria-label="دقیقه"
          value={parts.minute}
          onChange={(e) => emit({ minute: Number(e.target.value) })}
        >
          {[0, 15, 30, 45].concat(
            parts.minute % 15 === 0 ? [] : [parts.minute],
          ).sort((a, b) => a - b).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <span className="sub" style={{ alignSelf: 'center' }}>
          ساعت
        </span>
      </div>
    </div>
  )
}
