import type { Currency, Params } from '../engine'
import { CURRENCY_SCALE } from '../format/currency'

export function currentStartMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function defaultParams(currency: Currency, startMonth: string): Params {
  const s = CURRENCY_SCALE[currency]
  return {
    currency,
    startMonth,
    currentAge: 38,
    targetAge: 75,
    slackYears: 5,
    startingCapital: 20_000 * s,
    monthlyWithdrawal: 1_000 * s,
    inflationPct: 5,
    p1Years: 15,
    p1ReturnPct: 8,
    monthlySavings: 500 * s,
    savingsGrowWithInflation: false,
    p2Years: 5,
    p2ReturnPct: 7,
    p3ReturnPct: 6,
    pensionAge: 62,
    monthlyPension: 600 * s,
  }
}
