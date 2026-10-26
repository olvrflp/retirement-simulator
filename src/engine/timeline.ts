import { HORIZON_AGE } from './constants'
import { toMonths } from './rates'
import type { Params, Phase } from './types'

export interface PhaseBounds {
  p1: number
  p2: number
  p3: number // may be negative; validation reports it
  retirementMonth: number
  pensionMonth: number
  horizonMonth: number
}

export function phaseBounds(params: Params, p1MonthsOverride?: number): PhaseBounds {
  const p1 = p1MonthsOverride ?? toMonths(params.p1Years)
  const p2 = toMonths(params.p2Years)
  const p3 = toMonths(params.pensionAge) - toMonths(params.currentAge) - p1 - p2
  return {
    p1,
    p2,
    p3,
    retirementMonth: p1,
    pensionMonth: p1 + p2 + p3,
    horizonMonth: toMonths(HORIZON_AGE) - toMonths(params.currentAge),
  }
}

export function phaseOfMonth(m: number, b: PhaseBounds): Phase {
  if (m < b.p1) return 1
  if (m < b.p1 + b.p2) return 2
  if (m < b.pensionMonth) return 3
  return 4
}
