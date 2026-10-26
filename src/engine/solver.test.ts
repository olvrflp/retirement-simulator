import { findEarliestRetirementMonths } from './solver'
import { runScenario } from './index'
import { simulate } from './simulate'
import { summarize } from './summarize'
import { realistic } from './fixtures'
import type { Params } from './types'

const ok = (p: Params, n: number) => ['lasts', 'never'].includes(summarize(p, simulate(p, n), n).verdict)

describe('findEarliestRetirementMonths', () => {
  it('matches brute force', () => {
    const r = findEarliestRetirementMonths(realistic)
    expect(r).not.toBeNull()
    expect(ok(realistic, r!)).toBe(true)
    expect(r === 0 || !ok(realistic, r! - 1)).toBe(true)
  })
  it('is null when unreachable', () => {
    expect(findEarliestRetirementMonths({ ...realistic, monthlyWithdrawal: 1e12 })).toBeNull()
  })
  it('handles a zero-length search range', () => {
    const r = findEarliestRetirementMonths({ ...realistic, pensionAge: 43, p2Years: 5 })
    expect(r === 0 || r === null).toBe(true)
  })
})

describe('runScenario', () => {
  it('wires simulation, summary and solver', () => {
    const res = runScenario(realistic)
    expect(res.summary.verdict).toBe(summarize(realistic, simulate(realistic)).verdict)
    expect(res.earliestRetirementMonths).toBe(findEarliestRetirementMonths(realistic))
    expect(res.trajectory.length).toBe(simulate(realistic).length)
  })
})
