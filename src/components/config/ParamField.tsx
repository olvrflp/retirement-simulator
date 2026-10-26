import { useState } from 'react'
import { localeFor, type Lang } from '../../format/currency'
import { useLang } from '../../i18n/I18nContext'
import { parseLocaleNumber } from '../../format/parse'

function display(value: number, lang: Lang): string {
  return Number.isFinite(value) ? new Intl.NumberFormat(localeFor(lang), { maximumFractionDigits: 6 }).format(value) : ''
}

interface Props {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  suffix?: string
  hint?: string
  error?: string
}

export function ParamField({ id, label, value, onChange, min, max, step, suffix, hint, error }: Props) {
  const lang = useLang()
  const [text, setText] = useState(() => display(value, lang))
  const [seen, setSeen] = useState({ value, lang })
  // Resync the text when the value changes from outside (slider, load, "use this"), not while typing.
  if (!Object.is(seen.value, value) || seen.lang !== lang) {
    setSeen({ value, lang })
    if (seen.lang !== lang || !Object.is(parseLocaleNumber(text, lang), value)) setText(display(value, lang))
  }

  const labelId = `${id}-label`
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label id={labelId} htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={text}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setText(e.target.value)
              onChange(parseLocaleNumber(e.target.value, lang))
            }}
            onBlur={() => setText(display(value, lang))}
            className={`w-32 rounded-md border px-2 py-1 text-right text-sm tabular-nums ${
              error ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        aria-labelledby={labelId}
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
