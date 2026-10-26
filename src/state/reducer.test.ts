import { initialState, reducer, type AppState } from './reducer'

const fresh = () => initialState('en', '2026-10')
const save = (s: AppState, id: string, name = id) =>
  reducer(s, { type: 'saveScenario', id, createdAt: '2026-10-26T00:00:00Z', name })

describe('reducer', () => {
  it('save snapshots params and later edits do not change it', () => {
    let s = save(fresh(), 'a')
    const original = s.params.startingCapital
    s = reducer(s, { type: 'setParam', key: 'startingCapital', value: 1 })
    expect(s.params.startingCapital).toBe(1)
    expect(s.scenarios[0].params.startingCapital).toBe(original)
    expect(s.scenarios[0].result.trajectory[0].balance).toBe(original)
  })

  it('save appends, selects, and assigns stable distinct colours', () => {
    const s = save(save(fresh(), 'a'), 'b')
    expect(s.scenarios.map((x) => x.id)).toEqual(['a', 'b'])
    expect(s.selectedIds).toEqual(['a', 'b'])
    expect(s.scenarios[0].color).not.toBe(s.scenarios[1].color)
  })

  it('save is a no-op when invalid', () => {
    const invalid = reducer(fresh(), { type: 'setParam', key: 'pensionAge', value: 38 })
    expect(save(invalid, 'a')).toBe(invalid)
  })

  it('delete removes from selection', () => {
    const s = reducer(save(save(fresh(), 'a'), 'b'), { type: 'deleteScenario', id: 'a' })
    expect(s.scenarios.map((x) => x.id)).toEqual(['b'])
    expect(s.selectedIds).toEqual(['b'])
  })

  it('toggleSelected adds and removes', () => {
    let s = save(fresh(), 'a')
    s = reducer(s, { type: 'toggleSelected', id: 'a' })
    expect(s.selectedIds).toEqual([])
    s = reducer(s, { type: 'toggleSelected', id: 'a' })
    expect(s.selectedIds).toEqual(['a'])
  })

  it('setCurrency relabels without converting', () => {
    const s0 = fresh()
    const s = reducer(s0, { type: 'setCurrency', currency: 'USD' })
    expect(s.params.currency).toBe('USD')
    expect(s.params.startingCapital).toBe(s0.params.startingCapital)
  })

  it('loadScenario copies params, re-anchors startMonth, switches tab', () => {
    let s = save(fresh(), 'a')
    s = reducer(s, { type: 'setParam', key: 'startingCapital', value: 1 })
    s = reducer(s, { type: 'setTab', tab: 'compare' })
    s = reducer(s, { type: 'loadScenario', id: 'a', startMonth: '2027-03' })
    expect(s.activeTab).toBe('config')
    expect(s.params.startMonth).toBe('2027-03')
    expect(s.params.startingCapital).toBe(s.scenarios[0].params.startingCapital)
    expect(s.params).not.toBe(s.scenarios[0].params)
    expect(s.scenarios[0].params.startMonth).toBe('2026-10')
  })
})
