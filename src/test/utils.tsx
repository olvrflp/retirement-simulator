import { render } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { AppStateProvider, useAppState } from '../state/AppStateContext'
import type { AppState } from '../state/reducer'

/** Renders inside the app providers (English) and exposes the latest state. */
export function renderWithState(ui: ReactNode) {
  const ref: { current: AppState | null } = { current: null }
  function Probe() {
    const { state } = useAppState()
    useEffect(() => {
      ref.current = state
    })
    return null
  }
  const utils = render(
    <AppStateProvider lang="en">
      {ui}
      <Probe />
    </AppStateProvider>,
  )
  return { ...utils, state: () => ref.current! }
}
