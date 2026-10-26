import { toMonths, type Params, type ScenarioResult } from '../../engine'
import { formatAge, formatMoney, formatMonthYear } from '../../format/format'
import { useLang, useT } from '../../i18n/I18nContext'

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="text-xs tabular-nums text-slate-500">{sub}</div>}
    </div>
  )
}

export function MetricsRow({ params, result }: { params: Params; result: ScenarioResult }) {
  const t = useT()
  const lang = useLang()
  const s = result.summary
  const age0 = toMonths(params.currentAge)
  const money = (v: number) => formatMoney(v, params.currency, lang)
  const d = s.depletionMonth

  const atTarget =
    s.deficitAtTargetReal > 0 ? (
      <Metric
        label={t('metric.deficitAtTarget', { target: params.targetAge })}
        value={`−${money(s.deficitAtTargetReal)}`}
        sub={t('metric.todayMoney')}
      />
    ) : (
      <Metric
        label={t('metric.balanceAtTarget', { target: params.targetAge })}
        value={s.balanceAtTarget ? money(s.balanceAtTarget.real) : '—'}
        sub={s.balanceAtTarget ? t('metric.nominal', { amount: money(s.balanceAtTarget.nominal) }) : undefined}
      />
    )

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <Metric label={t('metric.retirementAge')} value={formatAge(age0 + s.retirementMonth, lang)} />
      <Metric label={t('metric.pensionAge')} value={formatAge(age0 + s.pensionMonth, lang)} />
      <Metric
        label={t('metric.runway')}
        value={t(s.verdict === 'never' ? 'metric.runwayOpen' : 'metric.runwayValue', { n: s.runwayMonths })}
      />
      <Metric
        label={t('metric.depletion')}
        value={d === null ? t('metric.depletionNone') : formatAge(age0 + d, lang)}
        sub={d === null ? undefined : formatMonthYear(params.startMonth, d, lang)}
      />
      {atTarget}
    </div>
  )
}
