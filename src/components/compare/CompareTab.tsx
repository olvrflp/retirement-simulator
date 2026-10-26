import { useMemo } from 'react'
import { useLang, useT } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { partitionByCurrency } from '../../state/selectors'
import { toChartSeries } from '../results/chartData'
import { RunwayChart } from '../results/RunwayChart'
import { ComparisonTable } from './ComparisonTable'
import { ScenarioList } from './ScenarioList'

export function CompareTab() {
  const t = useT()
  const lang = useLang()
  const { state, dispatch } = useAppState()
  const { scenarios, selectedIds, chartMode } = state

  const { plotted, hidden, selected } = useMemo(() => {
    const parts = partitionByCurrency(scenarios, selectedIds)
    return { ...parts, selected: [...parts.plotted, ...parts.hidden] }
  }, [scenarios, selectedIds])
  // Derived on every change; stored trajectories are never touched.
  const series = useMemo(
    () => plotted.map((s) => toChartSeries(s.id, s.name, s.color, s.result, chartMode, s.params.startMonth)),
    [plotted, chartMode],
  )
  const targetAges = [...new Set(plotted.map((s) => s.params.targetAge))]

  if (scenarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-slate-600">{t('compare.empty')}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'setTab', tab: 'config' })}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('compare.goConfig')}
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_3fr]">
      <ScenarioList />
      <div className="min-w-0 space-y-4">
        <RunwayChart
          series={series}
          markers={[]}
          targetAges={targetAges}
          currency={plotted[0]?.params.currency ?? state.params.currency}
          lang={lang}
          mode={chartMode}
          onModeChange={(mode) => dispatch({ type: 'setChartMode', mode })}
        />
        {hidden.length > 0 && (
          <p className="text-sm text-amber-700">{t('compare.hiddenCurrency', { names: hidden.map((s) => s.name).join(', ') })}</p>
        )}
        {selected.length > 0 && <ComparisonTable scenarios={selected} />}
      </div>
    </div>
  )
}
