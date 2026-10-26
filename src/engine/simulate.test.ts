import { firstUnmetMonth, simulate } from './simulate'
import { toMonths } from './rates'
import { base, gapExample, ONE_PCT_MONTHLY_EA } from './fixtures'

describe('simulate', () => {
  it('trajectory spans to age 100', () => {
    const traj = simulate(base)
    expect(traj.length).toBe(toMonths(100) - toMonths(38) + 1)
    expect(traj.at(-1)!.age).toBeCloseTo(100, 9)
  })

  it('hand-checked gap example', () => {
    const traj = simulate(gapExample)
    expect(traj[12].balance).toBe(2200)
    expect(traj[24].balance).toBe(1000)
    expect(traj[34].balance).toBe(0)
    expect(traj[34].unmet).toBe(0)
    expect(traj[35].unmet).toBe(100)
    expect(traj[37].unmet).toBe(0)
    expect(traj[37].netWithdrawal).toBe(0)
    expect(firstUnmetMonth(gapExample)).toBe(34)
  })

  it('withdraw then grow', () => {
    const traj = simulate({
      ...base,
      p1Years: 0,
      p2ReturnPct: ONE_PCT_MONTHLY_EA,
      startingCapital: 1000,
      monthlyWithdrawal: 100,
    })
    expect(traj[1].balance).toBeCloseTo(909, 9)
  })

  it('phase 1 compounds contributions (end-of-month)', () => {
    const traj = simulate({ ...base, p1ReturnPct: ONE_PCT_MONTHLY_EA, monthlySavings: 100 })
    expect(traj[1].balance).toBeCloseTo(100, 9)
    expect(traj[2].balance).toBeCloseTo(201, 9)
  })

  it('withdrawals inflate from today', () => {
    const traj = simulate({
      ...base,
      inflationPct: ONE_PCT_MONTHLY_EA,
      startingCapital: 1_000_000,
      monthlyWithdrawal: 100,
    })
    expect(traj[13].withdrawal).toBeCloseTo(112.682503, 6)
    expect(traj[13].balanceReal).toBeCloseTo(traj[13].balance / 1.01 ** 13, 6)
  })

  it('pension offsets spending', () => {
    const traj = simulate({ ...base, startingCapital: 1e6, monthlyWithdrawal: 100, monthlyPension: 60 })
    const p4 = traj.find((p) => p.phase === 4)!
    expect(p4.netWithdrawal).toBe(40)
  })

  it('pension surplus is not saved', () => {
    const params = {
      ...base,
      startingCapital: 1e6,
      monthlyWithdrawal: 100,
      monthlyPension: 150,
      p3ReturnPct: ONE_PCT_MONTHLY_EA,
    }
    const traj = simulate(params)
    const k = traj.findIndex((p) => p.phase === 4)
    expect(traj[k].netWithdrawal).toBe(0)
    expect(traj[k].balance).toBeCloseTo(traj[k - 1].balance * 1.01, 6)
  })

  it('savings grow with inflation when toggled', () => {
    const params = {
      ...base,
      p1Years: 2,
      pensionAge: 42,
      inflationPct: ONE_PCT_MONTHLY_EA,
      monthlySavings: 100,
      savingsGrowWithInflation: true,
    }
    const traj = simulate(params)
    // Month 12 produces point 13; with 0 % return the step is the contribution.
    expect(traj[13].balance - traj[12].balance).toBeCloseTo(100 * 1.01 ** 12, 6)
  })

  it('phase 3 of zero length goes straight to pension', () => {
    const traj = simulate({ ...base, pensionAge: 40 })
    expect(traj.some((p) => p.phase === 3)).toBe(false)
  })

  it('extreme rates stay finite', () => {
    const traj = simulate({
      ...base,
      startingCapital: 1e9,
      monthlySavings: 1e6,
      inflationPct: 0,
      p1ReturnPct: -99,
      p2ReturnPct: 0,
      p3ReturnPct: -99,
      monthlyWithdrawal: 1e12,
    })
    for (const p of traj) {
      expect(Number.isFinite(p.balance)).toBe(true)
      expect(Number.isFinite(p.balanceReal)).toBe(true)
      expect(Number.isFinite(p.unmet)).toBe(true)
      expect(p.balance).toBeGreaterThanOrEqual(0)
    }
  })
})
