import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatMoney } from '../../format/format'
import { currentStartMonth } from '../../state/defaults'
import { initialState, reducer, type Action, type AppState } from '../../state/reducer'
import { saveState } from '../../state/storage'
import { renderWithState } from '../../test/utils'
import { CompareTab } from './CompareTab'

const saveAs = (id: string): Action => ({ type: 'saveScenario', id, createdAt: 'x', name: id })

/** Persists a prepared state so the provider loads it. */
function seed(...actions: Action[]): AppState {
  const s = actions.reduce(reducer, { ...initialState('en', currentStartMonth()), activeTab: 'compare' as const })
  saveState(localStorage, s)
  return s
}

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('CompareTab', () => {
  it('shows an empty state', () => {
    renderWithState(<CompareTab />)
    expect(screen.getByText(/No saved scenarios yet/)).toBeInTheDocument()
  })

  it('lists saved scenarios checked with a table row each', () => {
    seed(saveAs('Plan A'), saveAs('Plan B'))
    renderWithState(<CompareTab />)
    expect(screen.getByRole('checkbox', { name: 'Plan A' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Plan B' })).toBeChecked()
    expect(rows()).toHaveLength(2)
  })

  it('unchecking removes the table row', async () => {
    seed(saveAs('Plan A'), saveAs('Plan B'))
    renderWithState(<CompareTab />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Plan A' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Plan B')
  })

  it('deletes after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    seed(saveAs('Plan A'), saveAs('Plan B'))
    renderWithState(<CompareTab />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete Plan A' }))
    expect(screen.queryByRole('checkbox', { name: 'Plan A' })).not.toBeInTheDocument()
    expect(rows()).toHaveLength(1)
  })

  it('notes scenarios hidden for using another currency', () => {
    seed(saveAs('Pesos'), { type: 'setCurrency', currency: 'USD' }, saveAs('Dollars'))
    renderWithState(<CompareTab />)
    expect(screen.getByText(/Hidden \(different currency\): Dollars/)).toBeInTheDocument()
  })

  it("shows each scenario's monthly spending and pension in today's money", () => {
    const s = seed(
      { type: 'setParam', key: 'monthlyWithdrawal', value: 2_000 },
      { type: 'setParam', key: 'monthlyPension', value: 700 },
      saveAs('Plan A'),
      { type: 'setParam', key: 'monthlyWithdrawal', value: 3_500 },
      { type: 'setParam', key: 'monthlyPension', value: 900 },
      saveAs('Plan B'),
    )
    renderWithState(<CompareTab />)
    const money = (n: number) => formatMoney(n, s.params.currency, 'en')
    const header = within(screen.getByRole('table')).getAllByRole('columnheader').map((h) => h.textContent)
    const spendingCol = header.indexOf('Monthly spending (today)')
    const pensionCol = header.indexOf('Monthly pension (today)')
    const cell = (row: number, col: number) => within(rows()[row]).getAllByRole('cell')[col].textContent
    expect(cell(0, spendingCol)).toBe(money(2_000))
    expect(cell(0, pensionCol)).toBe(money(700))
    expect(cell(1, spendingCol)).toBe(money(3_500))
    expect(cell(1, pensionCol)).toBe(money(900))
  })

  it('loads a scenario back into configuration', async () => {
    const s = seed(saveAs('Plan A'), { type: 'setParam', key: 'startingCapital', value: 1 })
    const { state } = renderWithState(<CompareTab />)
    await userEvent.click(screen.getByRole('button', { name: 'Load Plan A' }))
    expect(state().activeTab).toBe('config')
    expect(state().params.startingCapital).toBe(s.scenarios[0].params.startingCapital)
  })
})
