import { runScenario } from '../../engine'
import { base, realistic } from '../../engine/fixtures'
import { phaseMarkers, toChartSeries } from './chartData'

describe('toChartSeries', () => {
  const result = runScenario(realistic)
  it('uses real balances in real mode', () => {
    const s = toChartSeries('a', 'A', '#000', result, 'real', '2026-10')
    expect(s.points.length).toBe(result.trajectory.length)
    expect(s.points[50].value).toBe(result.trajectory[50].balanceReal)
  })
  it('uses nominal balances in nominal mode', () => {
    const s = toChartSeries('a', 'A', '#000', result, 'nominal', '2026-10')
    expect(s.points[50].value).toBe(result.trajectory[50].balance)
    expect(s.points[50].age).toBe(result.trajectory[50].age)
  })
})

describe('phaseMarkers', () => {
  it('marks the start of each phase', () => {
    const m = phaseMarkers({ ...base, p1Years: 15, p2Years: 5, pensionAge: 62 })
    expect(m.map((x) => x.age)).toEqual([38, 53, 58, 62])
    expect(m.map((x) => x.label)).toEqual(['①', '②', '③', '④'])
  })
  it('omits phases of zero length', () => {
    const m = phaseMarkers({ ...base, p1Years: 15, p2Years: 5, pensionAge: 58 })
    expect(m.map((x) => x.label)).toEqual(['①', '②', '④'])
  })
})
