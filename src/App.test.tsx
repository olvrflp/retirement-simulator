import { render, screen } from '@testing-library/react'
import App from './App'
import { AppStateProvider } from './state/AppStateContext'

it('renders', () => {
  render(
    <AppStateProvider lang="en">
      <App />
    </AppStateProvider>,
  )
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})
