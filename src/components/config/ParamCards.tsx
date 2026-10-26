import type { ReactNode } from 'react'
import { phaseBounds, type Params } from '../../engine'
import { CURRENCY_SCALE } from '../../format/currency'
import { formatAge } from '../../format/format'
import { useLang, useT } from '../../i18n/I18nContext'
import type { StringKey } from '../../i18n/strings'
import { useActiveResult, useAppState } from '../../state/AppStateContext'
import { ParamField } from './ParamField'

type NumericKey = { [K in keyof Params]: Params[K] extends number ? K : never }[keyof Params]
type Kind = 'money' | 'age' | 'years' | 'slack' | 'rate' | 'inflation'

// Slider ranges; money ranges are in USD and scale with the selected currency.
const RANGES: Record<Kind, { min: number; max: number; step: number }> = {
  money: { min: 0, max: 20_000, step: 50 },
  age: { min: 18, max: 100, step: 1 },
  years: { min: 0, max: 40, step: 0.5 },
  slack: { min: 0, max: 20, step: 1 },
  rate: { min: -10, max: 20, step: 0.1 },
  inflation: { min: 0, max: 20, step: 0.1 },
}
const CAPITAL = { min: 0, max: 2_000_000, step: 1_000 }

function Field({ field, kind, hint }: { field: NumericKey; kind: Kind; hint?: string }) {
  const { state, dispatch } = useAppState()
  const { issues } = useActiveResult()
  const t = useT()
  const p = state.params
  const scale = kind === 'money' ? CURRENCY_SCALE[p.currency] : 1
  const r = field === 'startingCapital' ? CAPITAL : RANGES[kind]
  const issue = issues.find((i) => i.field === field)
  const suffix =
    kind === 'rate' ? t('rate.suffix') : kind === 'inflation' ? t('unit.percent') : kind === 'money' ? p.currency : undefined
  return (
    <ParamField
      id={`f-${field}`}
      label={t(`field.${field}` as StringKey)}
      value={p[field]}
      onChange={(v) => dispatch({ type: 'setParam', key: field, value: v })}
      min={r.min * scale}
      max={r.max * scale}
      step={r.step * scale}
      suffix={suffix}
      hint={hint}
      error={issue ? t(`issue.${issue.code}`) : undefined}
    />
  )
}

function Card({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </header>
      {children}
    </section>
  )
}

export function GlobalCard() {
  const t = useT()
  return (
    <Card title={t('card.global')}>
      <Field field="currentAge" kind="age" />
      <Field field="targetAge" kind="age" />
      <Field field="slackYears" kind="slack" />
      <Field field="startingCapital" kind="money" />
      <Field field="monthlyWithdrawal" kind="money" hint={t('hint.todayMoney')} />
      <Field field="inflationPct" kind="inflation" />
    </Card>
  )
}

export function Phase1Card() {
  const t = useT()
  const { state, dispatch } = useAppState()
  return (
    <Card title={t('card.p1')} desc={t('card.p1.desc')}>
      <Field field="p1Years" kind="years" />
      <Field field="p1ReturnPct" kind="rate" hint={t('hint.nominalReturn')} />
      <Field field="monthlySavings" kind="money" />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={state.params.savingsGrowWithInflation}
          onChange={(e) => dispatch({ type: 'setParam', key: 'savingsGrowWithInflation', value: e.target.checked })}
        />
        {t('field.savingsGrowWithInflation')}
      </label>
    </Card>
  )
}

export function Phase2Card() {
  const t = useT()
  return (
    <Card title={t('card.p2')} desc={t('card.p2.desc')}>
      <Field field="p2Years" kind="years" />
      <Field field="p2ReturnPct" kind="rate" hint={t('hint.nominalReturn')} />
    </Card>
  )
}

export function Phase3Card() {
  const t = useT()
  const lang = useLang()
  const { state } = useAppState()
  const { issues } = useActiveResult()
  const p3Issue = issues.find((i) => i.field === 'phase3')
  const p3 = phaseBounds(state.params).p3
  return (
    <Card title={t('card.p3')} desc={t('card.p3.desc')}>
      <Field field="p3ReturnPct" kind="rate" hint={`${t('hint.nominalReturn')} ${t('hint.volatileReturn')}`} />
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">{t('field.p3Duration')}</span>
        {p3Issue ? (
          <span role="alert" className="max-w-56 text-right text-xs text-red-600">
            {t('issue.phase3Negative')}
          </span>
        ) : (
          <span className="tabular-nums text-slate-900">{Number.isFinite(p3) && p3 >= 0 ? formatAge(p3, lang) : '—'}</span>
        )}
      </div>
    </Card>
  )
}

export function Phase4Card() {
  const t = useT()
  return (
    <Card title={t('card.p4')} desc={t('card.p4.desc')}>
      <Field field="pensionAge" kind="age" />
      <Field field="monthlyPension" kind="money" hint={t('hint.todayMoney')} />
    </Card>
  )
}
