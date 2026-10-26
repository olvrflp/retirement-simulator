import { simulate } from './simulate'
import { summarize } from './summarize'
import { base, gapExample } from './fixtures'
import type { Params } from './types'

const run = (p: Params) => summarize(p, simulate(p))
// Same as gapExample but with no pension: unmet 100/month from month 34 onward.
const noPension: Params = { ...gapExample, monthlyPension: 0 }
// targetAge whose targetMonth (relative to age 38) is exactly n.
const targetAt = (n: number) => (38 * 12 + n) / 12

describe('summarize', () => {
  it('flags a gap before the pension', () => {
    const s = run(gapExample)
    expect(s.verdict).toBe('gap')
    expect(s.depletionMonth).toBe(34)
    expect(s.gapShortfallReal).toBe(200)
    expect(s.runwayMonths).toBe(22)
  })

  it('is short when the pension does not cover spending', () => {
    expect(run({ ...gapExample, monthlyPension: 50 }).verdict).toBe('short')
  })

  it('never runs out with huge capital', () => {
    const s = run({ ...gapExample, startingCapital: 1e9 })
    expect(s.verdict).toBe('never')
    expect(s.depletionMonth).toBeNull()
    expect(s.runwayMonths).toBe(s.horizonMonth - s.retirementMonth)
  })

  it('is thin when depletion lands exactly on the target', () => {
    expect(run({ ...noPension, targetAge: targetAt(34), slackYears: 1 }).verdict).toBe('thin')
  })

  it('lasts when depletion lands exactly on target + slack', () => {
    expect(run({ ...noPension, targetAge: targetAt(22), slackYears: 1 }).verdict).toBe('lasts')
  })

  it('reads the balance at the target month', () => {
    const p = { ...base, startingCapital: 5000, targetAge: targetAt(20) }
    const traj = simulate(p)
    const s = summarize(p, traj)
    expect(s.targetMonth).toBe(20)
    expect(s.balanceAtTarget).toEqual({ nominal: traj[20].balance, real: traj[20].balanceReal })
  })

  it('sums unmet spending before the target as the deficit', () => {
    expect(run({ ...noPension, targetAge: targetAt(40) }).deficitAtTargetReal).toBe(600)
  })
})
