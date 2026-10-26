import { initialState, reducer, type AppState } from './reducer'
import { partitionByCurrency } from './selectors'

const save = (s: AppState, id: string) =>
  reducer(s, { type: 'saveScenario', id, createdAt: 'x', name: id })

describe('partitionByCurrency', () => {
  it('plots only the first selected currency, in selection order', () => {
    let s = save(initialState('en', '2026-10'), 'cop1')
    s = reducer(s, { type: 'setCurrency', currency: 'USD' })
    s = save(s, 'usd1')
    s = reducer(s, { type: 'setCurrency', currency: 'COP' })
    s = save(s, 'cop2')
    const { plotted, hidden } = partitionByCurrency(s.scenarios, ['cop2', 'usd1', 'cop1', 'ghost'])
    expect(plotted.map((x) => x.id)).toEqual(['cop2', 'cop1'])
    expect(hidden.map((x) => x.id)).toEqual(['usd1'])
  })
})
