import { currentStartMonth, defaultParams } from './defaults'
import { validateParams } from '../engine'

describe('defaults', () => {
  it('formats the current month', () => {
    expect(currentStartMonth(new Date(2026, 9, 26))).toBe('2026-10')
  })
  it('scales amounts by currency', () => {
    expect(defaultParams('COP', '2026-10').startingCapital).toBe(80_000_000)
  })
  it('is valid', () => {
    expect(validateParams(defaultParams('USD', '2026-10'))).toEqual([])
  })
})
