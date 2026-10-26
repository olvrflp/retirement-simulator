import { toMonths } from './rates'
import { firstUnmetMonth } from './simulate'
import type { Params } from './types'

/**
 * Shortest Phase 1 (in months) for which the money lasts past target age + slack, keeping
 * Phase 2 and the pension age fixed. Linear scan: success isn't guaranteed to be monotonic.
 */
export function findEarliestRetirementMonths(p: Params): number | null {
  const maxP1 = toMonths(p.pensionAge) - toMonths(p.currentAge) - toMonths(p.p2Years)
  const slackMonth = toMonths(p.targetAge) - toMonths(p.currentAge) + toMonths(p.slackYears)
  for (let p1 = 0; p1 <= maxP1; p1++) {
    const d = firstUnmetMonth(p, p1)
    if (d === null || d >= slackMonth) return p1
  }
  return null
}
