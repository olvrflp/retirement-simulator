import type { Currency } from '../engine'

export type Lang = 'en' | 'es'

export const CURRENCIES: Currency[] = ['COP', 'USD', 'EUR', 'MXN']

/** Rough size of one USD in each currency; scales slider ranges and example defaults only. */
export const CURRENCY_SCALE: Record<Currency, number> = { USD: 1, EUR: 1, MXN: 20, COP: 4000 }

export function localeFor(lang: Lang): string {
  return lang === 'es' ? 'es-CO' : 'en-US'
}
