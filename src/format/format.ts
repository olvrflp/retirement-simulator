import type { Currency } from '../engine'
import { localeFor, type Lang } from './currency'

export function formatMoney(v: number, c: Currency, lang: Lang, opts?: { compact?: boolean }): string {
  return new Intl.NumberFormat(localeFor(lang), {
    style: 'currency',
    currency: c,
    minimumFractionDigits: 0,
    maximumFractionDigits: opts?.compact ? 1 : 0,
    notation: opts?.compact ? 'compact' : 'standard',
  }).format(v)
}

export function formatAge(totalMonths: number, lang: Lang): string {
  const m = Math.round(totalMonths)
  return `${Math.floor(m / 12)} ${lang === 'es' ? 'a' : 'y'} ${m % 12} m`
}

export function formatMonthYear(startMonth: string, offsetMonths: number, lang: Lang): string {
  const [y, mo] = startMonth.split('-').map(Number)
  const date = new Date(y, mo - 1 + Math.round(offsetMonths), 1)
  return new Intl.DateTimeFormat(localeFor(lang), { month: 'short', year: 'numeric' }).format(date)
}
