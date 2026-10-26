import { validateParams } from './validate'
import { realistic } from './fixtures'

const issues = (over: object) => validateParams({ ...realistic, ...over })

describe('validateParams', () => {
  it('accepts a valid plan', () => {
    expect(validateParams(realistic)).toEqual([])
  })
  it('requires numbers', () => {
    expect(issues({ inflationPct: NaN })).toContainEqual({ field: 'inflationPct', code: 'required' })
  })
  it('rejects negative amounts', () => {
    expect(issues({ monthlySavings: -1 })).toContainEqual({ field: 'monthlySavings', code: 'negative' })
  })
  it('rejects rates below -99 %', () => {
    expect(issues({ p3ReturnPct: -100 })).toContainEqual({ field: 'p3ReturnPct', code: 'rateOutOfRange' })
  })
  it('target must be after current age', () => {
    expect(issues({ targetAge: 30 })).toContainEqual({ field: 'targetAge', code: 'targetNotAfterCurrent' })
  })
  it('pension must be after current age', () => {
    expect(issues({ pensionAge: 38 })).toContainEqual({ field: 'pensionAge', code: 'pensionNotAfterCurrent' })
  })
  it('ages cannot exceed the horizon', () => {
    expect(issues({ targetAge: 120 })).toContainEqual({ field: 'targetAge', code: 'ageAboveHorizon' })
    expect(issues({ pensionAge: 101 })).toContainEqual({ field: 'pensionAge', code: 'ageAboveHorizon' })
  })
  it('flags a negative phase 3', () => {
    expect(issues({ p1Years: 20, p2Years: 5 })).toContainEqual({ field: 'phase3', code: 'phase3Negative' })
  })
})
