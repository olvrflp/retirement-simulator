import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Phase1Card, Phase3Card, GlobalCard } from '../components/config/ParamCards'
import { simulate } from '../engine'
import { base } from '../engine/fixtures'
import { AppStateProvider, useActiveResult } from '../state/AppStateContext'
import { currentStartMonth } from '../state/defaults'
import { initialState, reducer } from '../state/reducer'
import { loadState, saveState, STORAGE_KEY } from '../state/storage'
import { renderWithState } from './utils'

async function setField(name: string, value: string) {
  const box = screen.getByRole('textbox', { name })
  await userEvent.clear(box)
  if (value) await userEvent.type(box, value)
}

describe('review fixes', () => {
  it('phase 3 card never shows NaN or negative durations', async () => {
    renderWithState(
      <>
        <GlobalCard />
        <Phase1Card />
        <Phase3Card />
      </>,
    )
    await setField('Duration (years)', '')
    expect(document.body.textContent).not.toMatch(/NaN/)
    await setField('Duration (years)', '30')
    await setField('Target age (life expectancy)', '30')
    expect(screen.getByText('Duration (from your pension age)').nextElementSibling!.textContent).not.toMatch(/-\d/)
  })

  it('computes the active result once for all consumers', () => {
    const seen: unknown[] = []
    function Consumer() {
      seen.push(useActiveResult().result)
      return null
    }
    render(
      <AppStateProvider lang="en">
        <Consumer />
        <Consumer />
      </AppStateProvider>,
    )
    expect(seen.length).toBeGreaterThanOrEqual(2)
    expect(seen[0]).toBe(seen[1])
  })

  it('persists scenarios without trajectories and recomputes them on load', () => {
    const s = reducer(initialState('en', '2026-10'), { type: 'saveScenario', id: 'a', createdAt: 'x', name: 'A' })
    saveState(localStorage, s)
    const raw = localStorage.getItem(STORAGE_KEY)!
    expect(raw.length).toBeLessThan(5_000)
    expect(loadState(localStorage, 'en', '2026-10').scenarios[0].result).toEqual(s.scenarios[0].result)
  })

  it('ages line up exactly across different starting ages', () => {
    const a = simulate({ ...base, currentAge: 38 })
    const b = simulate({ ...base, currentAge: 45, pensionAge: 50 })
    for (let k = 0; k < b.length; k++) expect(a[k + 84].age).toBe(b[k].age)
  })

  it('picks up scenarios saved in another tab', () => {
    const { state } = renderWithState(null)
    const other = reducer(initialState('en', currentStartMonth()), { type: 'saveScenario', id: 'x', createdAt: 'x', name: 'X' })
    saveState(localStorage, other)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
    })
    expect(state().scenarios).toHaveLength(1)
  })
})
