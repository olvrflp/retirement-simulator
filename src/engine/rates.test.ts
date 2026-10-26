import { monthlyRate, toMonths } from './rates'
import { ONE_PCT_MONTHLY_EA } from './fixtures'

describe('monthlyRate', () => {
  it('converts effective annual to monthly compounding', () => {
    expect(monthlyRate(ONE_PCT_MONTHLY_EA)).toBeCloseTo(0.01, 12)
  })
  it('is zero for 0 %', () => {
    expect(monthlyRate(0)).toBe(0)
  })
  it('stays finite at -99 %', () => {
    expect(Number.isFinite(monthlyRate(-99))).toBe(true)
  })
})

describe('toMonths', () => {
  it('rounds years to whole months', () => {
    expect(toMonths(2.5)).toBe(30)
  })
})
