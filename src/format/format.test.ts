import { formatAge, formatMoney, formatMonthYear } from './format'

describe('formatMoney', () => {
  it('formats COP with Colombian separators', () => {
    expect(formatMoney(412_000_000, 'COP', 'es')).toContain('412.000.000')
  })
  it('formats USD with no decimals', () => {
    expect(formatMoney(1234.5, 'USD', 'en')).toBe('$1,235')
  })
  it('keeps trillions of pesos short in compact mode', () => {
    const s = formatMoney(4e12, 'COP', 'es', { compact: true })
    expect(s.length).toBeLessThan(15)
    expect(s).toContain('4')
  })
  it('shows trillions of pesos in full by default', () => {
    expect(formatMoney(4e12, 'COP', 'es')).toContain('4.000.000.000.000')
  })
})

describe('formatAge', () => {
  it('formats years and months', () => {
    expect(formatAge(71 * 12 + 4, 'en')).toBe('71 y 4 m')
    expect(formatAge(71 * 12 + 4, 'es')).toBe('71 a 4 m')
  })
})

describe('formatMonthYear', () => {
  it('offsets from the start month', () => {
    expect(formatMonthYear('2026-10', 12, 'en')).toContain('2027')
  })
})
