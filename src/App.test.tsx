import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { AppStateProvider } from './state/AppStateContext'

const renderApp = () =>
  render(
    <AppStateProvider lang="en">
      <App />
    </AppStateProvider>,
  )

async function setField(name: string, value: string) {
  const box = screen.getByRole('textbox', { name })
  await userEvent.clear(box)
  await userEvent.type(box, value)
}

const metricValue = (label: string) => screen.getByText(label).nextElementSibling!.textContent

it('renders the title', () => {
  renderApp()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Retirement Runway Simulator')
})

it('save flow keeps pre-calculated trajectory', async () => {
  renderApp()
  await setField('Starting capital', '5000000000')
  const before = metricValue('Balance at 75')

  await userEvent.type(screen.getByRole('textbox', { name: 'Scenario name' }), 'Retire at 55')
  await userEvent.click(screen.getByRole('button', { name: 'Save scenario' }))
  expect(screen.getByRole('textbox', { name: 'Scenario name' })).toHaveValue('')

  await setField('Starting capital', '4000000000')
  expect(metricValue('Balance at 75')).not.toBe(before)

  await userEvent.click(screen.getByRole('tab', { name: 'Comparison Dashboard' }))
  expect(screen.getByRole('checkbox', { name: 'Retire at 55' })).toBeChecked()
  const row = within(screen.getByRole('table')).getAllByRole('row')[1]
  expect(row.lastElementChild!.textContent).toBe(before)

  await userEvent.click(screen.getByRole('button', { name: 'ES' }))
  expect(screen.getByRole('tab', { name: 'Panel comparativo' })).toBeInTheDocument()
})

it('invalid inputs hide results and disable save', async () => {
  renderApp()
  await setField('Pension age', '38')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByText('Fix these inputs to see results:')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Save scenario' })).toBeDisabled()
})
