import type { Params } from './types'

// Shared test fixtures. All rates zero so expected values can be checked by hand.
export const base: Params = {
  currency: 'USD',
  startMonth: '2026-10',
  currentAge: 38,
  targetAge: 75,
  slackYears: 5,
  startingCapital: 0,
  monthlyWithdrawal: 0,
  inflationPct: 0,
  p1Years: 1,
  p1ReturnPct: 0,
  monthlySavings: 0,
  savingsGrowWithInflation: false,
  p2Years: 1,
  p2ReturnPct: 0,
  p3ReturnPct: 0,
  pensionAge: 41,
  monthlyPension: 0,
}

// Savings empty exactly at the end of month 33, run short in months 34–35,
// then the pension covers all spending from month 36.
export const gapExample: Params = {
  ...base,
  startingCapital: 1000,
  monthlySavings: 100,
  monthlyWithdrawal: 100,
  monthlyPension: 100,
}

// Monthly rate of exactly 1 %.
export const ONE_PCT_MONTHLY_EA = 12.682503013196976

// Plausible USD plan where an earliest retirement exists before the pension age.
export const realistic: Params = {
  ...base,
  startingCapital: 20_000,
  monthlyWithdrawal: 1_000,
  inflationPct: 5,
  p1Years: 15,
  p1ReturnPct: 8,
  monthlySavings: 1_500,
  p2Years: 5,
  p2ReturnPct: 7,
  p3ReturnPct: 6,
  pensionAge: 62,
  monthlyPension: 600,
}
