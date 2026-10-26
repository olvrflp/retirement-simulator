import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runScenario, type Params } from '../../engine'
import { gapExample, realistic } from '../../engine/fixtures'
import { I18nProvider } from '../../i18n/I18nContext'
import { VerdictBanner } from './VerdictBanner'

const show = (params: Params, onUse = vi.fn()) => {
  render(
    <I18nProvider value="en">
      <VerdictBanner params={params} result={runScenario(params)} onUseEarliest={onUse} />
    </I18nProvider>,
  )
  return onUse
}

describe('VerdictBanner', () => {
  it('explains a gap before the pension', () => {
    show(gapExample)
    expect(screen.getByRole('status')).toHaveTextContent('before your pension starts')
  })
  it('says when money never runs out', () => {
    show({ ...realistic, startingCapital: 1e9 })
    expect(screen.getByRole('status')).toHaveTextContent("doesn't run out before age 100")
  })
  it('applies the earliest retirement on request', async () => {
    const params = { ...realistic, p1Years: 19 }
    const onUse = show(params)
    await userEvent.click(screen.getByRole('button', { name: 'Use this' }))
    expect(onUse).toHaveBeenCalledWith(runScenario(params).earliestRetirementMonths)
  })
})
