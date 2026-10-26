import { initialState, reducer } from './reducer'
import { loadState, saveState, STORAGE_KEY } from './storage'

const withScenario = () =>
  reducer(initialState('en', '2026-10'), { type: 'saveScenario', id: 'a', createdAt: 'x', name: 'A' })

class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get length() { return this.m.size }
  clear() { this.m.clear() }
  getItem(k: string) { return this.m.get(k) ?? null }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  removeItem(k: string) { this.m.delete(k) }
  setItem(k: string, v: string) { this.m.set(k, v) }
}

const throwing = {
  getItem() { throw new Error('denied') },
  setItem() { throw new Error('quota') },
} as unknown as Storage

describe('storage', () => {
  it('round-trips scenarios and selection', () => {
    const st = new MemoryStorage()
    const s = withScenario()
    expect(saveState(st, s)).toBe(true)
    const loaded = loadState(st, 'en', '2026-10')
    expect(loaded.scenarios).toEqual(s.scenarios)
    expect(loaded.selectedIds).toEqual(s.selectedIds)
  })

  it('re-anchors the active start month on load', () => {
    const st = new MemoryStorage()
    saveState(st, withScenario())
    const loaded = loadState(st, 'en', '2027-05')
    expect(loaded.params.startMonth).toBe('2027-05')
    expect(loaded.scenarios[0].params.startMonth).toBe('2026-10')
  })

  it('recomputes results from stored params, ignoring any cached result', () => {
    const st = new MemoryStorage()
    saveState(st, withScenario())
    const raw = JSON.parse(st.getItem(STORAGE_KEY)!)
    raw.scenarios[0].engineVersion = 0
    raw.scenarios[0].result = { trajectory: [{ balance: -42 }] }
    st.setItem(STORAGE_KEY, JSON.stringify(raw))
    const loaded = loadState(st, 'en', '2026-10')
    expect(loaded.scenarios[0].result.trajectory[0].balance).toBe(loaded.scenarios[0].params.startingCapital)
    expect(loaded.scenarios[0].engineVersion).toBe(1)
  })

  it('falls back to defaults on corrupt JSON', () => {
    const st = new MemoryStorage()
    st.setItem(STORAGE_KEY, '{not json')
    expect(loadState(st, 'es', '2026-10')).toEqual(initialState('es', '2026-10'))
  })

  it('survives a storage that throws', () => {
    expect(loadState(throwing, 'en', '2026-10')).toEqual(initialState('en', '2026-10'))
    expect(saveState(throwing, withScenario())).toBe(false)
  })

  it('survives a missing storage', () => {
    expect(loadState(undefined, 'en', '2026-10')).toEqual(initialState('en', '2026-10'))
    expect(saveState(undefined, withScenario())).toBe(false)
  })
})
