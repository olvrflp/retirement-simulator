import { monthlyRate, toMonths } from './rates'
import { phaseBounds } from './timeline'
import type { Params, Summary, TrajectoryPoint, VerdictKind } from './types'

export function summarize(params: Params, trajectory: TrajectoryPoint[], p1MonthsOverride?: number): Summary {
  const b = phaseBounds(params, p1MonthsOverride)
  const inf = monthlyRate(params.inflationPct)
  const targetMonth = toMonths(params.targetAge) - toMonths(params.currentAge)
  const slackMonth = targetMonth + toMonths(params.slackYears)

  let depletionMonth: number | null = null
  let deficitAtTargetReal = 0
  let gapShortfallReal = 0
  let unmetAfterPension = false
  // Point k carries the flows of month m = k − 1.
  for (let k = 1; k < trajectory.length; k++) {
    const m = k - 1
    const unmet = trajectory[k].unmet
    if (unmet <= 0) continue
    if (depletionMonth === null) depletionMonth = m
    const real = unmet / Math.pow(1 + inf, m)
    if (m < targetMonth) deficitAtTargetReal += real
    if (m < b.pensionMonth) gapShortfallReal += real
    else unmetAfterPension = true
  }

  const atTarget = targetMonth >= 0 && targetMonth <= b.horizonMonth ? trajectory[targetMonth] : undefined

  return {
    verdict: verdictOf(depletionMonth, targetMonth, slackMonth, b.pensionMonth, b.horizonMonth, unmetAfterPension),
    retirementMonth: b.retirementMonth,
    pensionMonth: b.pensionMonth,
    horizonMonth: b.horizonMonth,
    targetMonth,
    slackMonth,
    depletionMonth,
    runwayMonths: (depletionMonth ?? b.horizonMonth) - b.retirementMonth,
    balanceAtTarget: atTarget ? { nominal: atTarget.balance, real: atTarget.balanceReal } : null,
    deficitAtTargetReal,
    gapShortfallReal,
  }
}

function verdictOf(
  d: number | null,
  targetMonth: number,
  slackMonth: number,
  pensionMonth: number,
  horizonMonth: number,
  unmetAfterPension: boolean,
): VerdictKind {
  if (d === null) return 'never'
  if (d >= slackMonth) return 'lasts'
  if (d >= targetMonth) return 'thin'
  if (d < pensionMonth && pensionMonth < horizonMonth && !unmetAfterPension) return 'gap'
  return 'short'
}
