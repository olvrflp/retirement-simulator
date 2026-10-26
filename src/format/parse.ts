import type { Lang } from './currency'

const ES_GROUPED = /^-?\d{1,3}(\.\d{3})+(,\d*)?$/
const EN_GROUPED = /^-?\d{1,3}(,\d{3})+(\.\d*)?$/

/**
 * Parses a number typed by a person. Spanish rules by default: a comma is the decimal
 * separator and dots in groups of three are thousands. A lone comma is always a decimal,
 * so "5,5" means 5.5 in either language.
 */
export function parseLocaleNumber(text: string, lang: Lang = 'es'): number {
  const t = text.replace(/\s/g, '')
  if (t === '') return NaN
  if (lang === 'en' && EN_GROUPED.test(t)) return Number(t.replace(/,/g, ''))
  if (lang === 'es' && ES_GROUPED.test(t)) return Number(t.replace(/\./g, '').replace(',', '.'))
  return Number(t.replace(',', '.'))
}
