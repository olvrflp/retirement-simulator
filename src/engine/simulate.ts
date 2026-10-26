import { monthlyRate, toMonths } from './rates'
import { phaseBounds, phaseOfMonth, type PhaseBounds } from './timeline'
import type { Params, Phase, TrajectoryPoint } from './types'

interface Rates {
  r1: number
  r2: number
  r3: number
  inf: number
}

interface StepResult {
  balance: number
  phase: Phase
  withdrawal: number
  pension: number
  netWithdrawal: number
  unmet: number
}

function ratesOf(p: Params): Rates {
  return {
    r1: monthlyRate(p.p1ReturnPct),
    r2: monthlyRate(p.p2ReturnPct),
    r3: monthlyRate(p.p3ReturnPct),
    inf: monthlyRate(p.inflationPct),
  }
}

/** Advances the balance through month m. Withdrawals come out first, contributions land after growth. */
function step(p: Params, b: PhaseBounds, r: Rates, m: number, balance: number): StepResult {
  const phase = phaseOfMonth(m, b)
  const f = Math.pow(1 + r.inf, m)
  if (phase === 1) {
    const savings = p.savingsGrowWithInflation ? p.monthlySavings * f : p.monthlySavings
    return { balance: balance * (1 + r.r1) + savings, phase, withdrawal: 0, pension: 0, netWithdrawal: 0, unmet: 0 }
  }
  const withdrawal = p.monthlyWithdrawal * f
  const pension = phase === 4 ? p.monthlyPension * f : 0
  const request = Math.max(0, withdrawal - pension)
  const paid = Math.min(request, balance)
  const rate = phase === 2 ? r.r2 : r.r3
  return {
    balance: (balance - paid) * (1 + rate),
    phase,
    withdrawal,
    pension,
    netWithdrawal: request,
    unmet: request - paid,
  }
}

export function simulate(params: Params, p1MonthsOverride?: number): TrajectoryPoint[] {
  const b = phaseBounds(params, p1MonthsOverride)
  const r = ratesOf(params)
  const age0 = toMonths(params.currentAge)
  const traj: TrajectoryPoint[] = [
    {
      k: 0,
      age: age0 / 12,
      phase: phaseOfMonth(0, b),
      balance: params.startingCapital,
      balanceReal: params.startingCapital,
      withdrawal: 0,
      pension: 0,
      netWithdrawal: 0,
      unmet: 0,
    },
  ]
  let balance = params.startingCapital
  for (let k = 1; k <= b.horizonMonth; k++) {
    const s = step(params, b, r, k - 1, balance)
    balance = s.balance
    traj.push({
      k,
      age: (age0 + k) / 12, // whole months, so equal ages compare equal across scenarios
      phase: s.phase,
      balance,
      balanceReal: balance / Math.pow(1 + r.inf, k),
      withdrawal: s.withdrawal,
      pension: s.pension,
      netWithdrawal: s.netWithdrawal,
      unmet: s.unmet,
    })
  }
  return traj
}

/** First month with unmet spending, or null. Allocates nothing per month (used by the solver). */
export function firstUnmetMonth(params: Params, p1MonthsOverride?: number): number | null {
  const b = phaseBounds(params, p1MonthsOverride)
  const r = ratesOf(params)
  let balance = params.startingCapital
  for (let m = 0; m < b.horizonMonth; m++) {
    const s = step(params, b, r, m, balance)
    if (s.unmet > 0) return m
    balance = s.balance
  }
  return null
}
