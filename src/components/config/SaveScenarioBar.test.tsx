import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test/utils'
import { Phase4Card } from './ParamCards'
import { SaveScenarioBar } from './SaveScenarioBar'

describe('SaveScenarioBar', () => {
  it('saves with the typed name and clears the input', async () => {
    const { state } = renderWithState(<SaveScenarioBar />)
    const name = screen.getByRole('textbox', { name: 'Scenario name' })
    await userEvent.type(name, 'Retire at 55')
    await userEvent.click(screen.getByRole('button', { name: 'Save scenario' }))
    expect(name).toHaveValue('')
    expect(state().scenarios.map((s) => s.name)).toEqual(['Retire at 55'])
  })

  it('falls back to a numbered name', async () => {
    const { state } = renderWithState(<SaveScenarioBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Save scenario' }))
    expect(state().scenarios[0].name).toBe('Scenario 1')
  })

  it('is disabled while inputs are invalid', async () => {
    renderWithState(
      <>
        <Phase4Card />
        <SaveScenarioBar />
      </>,
    )
    const pension = screen.getByRole('textbox', { name: 'Pension age' })
    await userEvent.clear(pension)
    await userEvent.type(pension, '38')
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeDisabled()
  })
})
