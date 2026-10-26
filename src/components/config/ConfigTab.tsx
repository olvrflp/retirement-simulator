import { useMemo } from 'react'
import { useLang, useT } from '../../i18n/I18nContext'
import type { StringKey } from '../../i18n/strings'
import { useActiveResult, useAppState } from '../../state/AppStateContext'
import { MetricsRow } from '../results/MetricsRow'
import { phaseMarkers, toChartSeries } from '../results/chartData'
import { RunwayChart } from '../results/RunwayChart'
import { VerdictBanner } from '../results/VerdictBanner'
import { GlobalCard, Phase1Card, Phase2Card, Phase3Card, Phase4Card } from './ParamCards'
import { SaveScenarioBar } from './SaveScenarioBar'

const ACTIVE_COLOR = '#2563eb'

export function ConfigTab() {
  const t = useT()
  const lang = useLang()
  const { state, dispatch } = useAppState()
  const { issues, result } = useActiveResult()
  const { params, chartMode } = state

  const series = useMemo(
    () => (result ? [toChartSeries('active', t('tab.config'), ACTIVE_COLOR, result, chartMode, params.startMonth)] : []),
    [result, chartMode, params.startMonth, t],
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="order-2 space-y-4 lg:order-1">
        <GlobalCard />
        <Phase1Card />
        <Phase2Card />
        <Phase3Card />
        <Phase4Card />
        <SaveScenarioBar />
      </div>
      <div className="order-1 min-w-0 space-y-4 lg:sticky lg:top-4 lg:order-2 lg:self-start">
        {result ? (
          <>
            <VerdictBanner
              params={params}
              result={result}
              onUseEarliest={(months) => dispatch({ type: 'setParam', key: 'p1Years', value: months / 12 })}
            />
            <MetricsRow params={params} result={result} />
            <RunwayChart
              series={series}
              markers={phaseMarkers(params)}
              targetAges={[params.targetAge]}
              currency={params.currency}
              lang={lang}
              mode={chartMode}
              onModeChange={(mode) => dispatch({ type: 'setChartMode', mode })}
            />
          </>
        ) : (
          <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">{t('results.invalid')}</p>
            <ul className="mt-2 list-disc pl-5">
              {issues.map((i) => (
                <li key={`${i.field}-${i.code}`}>
                  {i.field === 'phase3' ? t('card.p3') : t(`field.${i.field}` as StringKey)}: {t(`issue.${i.code}`)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-slate-500">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
