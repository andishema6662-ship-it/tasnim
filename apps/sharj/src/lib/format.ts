export function toman(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n)) + ' تومان'
}

export function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export function faDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function trackingCode(): string {
  const part = () => Math.floor(1000 + Math.random() * 9000)
  return `DS-${part()}-${part()}`
}
