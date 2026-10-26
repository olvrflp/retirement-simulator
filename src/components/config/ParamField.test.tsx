import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParamField } from './ParamField'
import { parseLocaleNumber } from '../../format/parse'

describe('parseLocaleNumber', () => {
  it('accepts comma decimals', () => {
    expect(parseLocaleNumber('5,5')).toBe(5.5)
    expect(parseLocaleNumber('1.234.567,8')).toBe(1234567.8)
  })
  it('accepts dot decimals', () => {
    expect(parseLocaleNumber('1234.5')).toBe(1234.5)
  })
  it('reads English thousands separators when told the language', () => {
    expect(parseLocaleNumber('80,000,000', 'en')).toBe(80_000_000)
    expect(parseLocaleNumber('5,5', 'en')).toBe(5.5)
  })
  it('is NaN for empty input', () => {
    expect(Number.isNaN(parseLocaleNumber(''))).toBe(true)
  })
})

describe('ParamField', () => {
  const setup = (value = 5, error?: string) => {
    const onChange = vi.fn()
    const utils = render(
      <ParamField id="r" label="Rate" value={value} onChange={onChange} min={0} max={20} step={0.1} error={error} />,
    )
    return { onChange, ...utils }
  }

  it('passes comma decimals through as numbers', async () => {
    const { onChange } = setup()
    const box = screen.getByRole('textbox', { name: 'Rate' })
    await userEvent.clear(box)
    await userEvent.type(box, '7,5')
    expect(onChange).toHaveBeenLastCalledWith(7.5)
  })

  it('reports NaN when cleared without throwing', async () => {
    const { onChange } = setup()
    await userEvent.clear(screen.getByRole('textbox', { name: 'Rate' }))
    expect(onChange).toHaveBeenLastCalledWith(NaN)
  })

  it('resyncs text when the value changes from outside', () => {
    const { rerender } = setup(5)
    rerender(<ParamField id="r" label="Rate" value={9} onChange={() => {}} min={0} max={20} step={0.1} />)
    expect(screen.getByRole('textbox', { name: 'Rate' })).toHaveValue('9')
  })

  it('renders the error as an alert', () => {
    setup(5, 'Enter a number.')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number.')
  })
})
