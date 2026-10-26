import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { Currency } from '../../engine'
import type { Lang } from '../../format/currency'
import { formatAge, formatMoney, formatMonthYear } from '../../format/format'
import { useT } from '../../i18n/I18nContext'
import type { ChartMode } from '../../state/reducer'
import type { ChartSeries, Marker } from './chartData'

interface Props {
  series: ChartSeries[]
  markers: Marker[]
  targetAges: number[]
  currency: Currency
  lang: Lang
  mode: ChartMode
  onModeChange: (m: ChartMode) => void
}

export function RunwayChart({ series, markers, targetAges, currency, lang, mode, onModeChange }: Props) {
  const t = useT()
  const renderTooltip = ({ active, label, payload }: TooltipContentProps) => {
    if (!active || !payload?.length || typeof label !== 'number') return null
    const first = payload[0]
    const point = first.payload as { k?: number; startMonth?: string } | undefined
    return (
      <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow">
        <div className="font-medium">
          {formatAge(label * 12, lang)}
          {point?.startMonth && point.k !== undefined ? ` · ${formatMonthYear(point.startMonth, point.k, lang)}` : ''}
        </div>
        {payload.map((e, i) => (
          <div key={i} style={{ color: e.color }} className="tabular-nums">
            {series.length > 1 ? `${e.name}: ` : ''}
            {formatMoney(Number(e.value ?? 0), currency, lang)}
          </div>
        ))}
      </div>
    )
  }

  const toggle = (m: ChartMode, key: 'chart.real' | 'chart.nominal') => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => onModeChange(m)}
      className={`px-3 py-1 text-xs font-medium ${mode === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
    >
      {t(key)}
    </button>
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex justify-end">
        <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
          {toggle('real', 'chart.real')}
          {toggle('nominal', 'chart.nominal')}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 16, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="age"
              domain={['dataMin', 100]}
              allowDuplicatedCategory={false}
              tickFormatter={(v: number) => String(Math.round(v))}
              label={{ value: t('chart.age'), position: 'insideBottomRight', offset: -2, fontSize: 11 }}
              fontSize={11}
            />
            <YAxis tickFormatter={(v: number) => formatMoney(v, currency, lang, { compact: true })} width={72} fontSize={11} />
            <Tooltip content={renderTooltip} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {markers.map((m) => (
              <ReferenceLine
                key={m.label}
                x={m.age}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: m.label, position: 'insideTopLeft', fontSize: 14, fill: '#475569' }}
              />
            ))}
            {targetAges.map((age) => (
              <ReferenceLine
                key={`target-${age}`}
                x={age}
                stroke="#ef4444"
                label={{ value: t('chart.target', { age }), position: 'insideTopRight', fontSize: 11, fill: '#b91c1c' }}
              />
            ))}
            {series.map((s) => (
              <Line
                key={s.id}
                data={s.points}
                dataKey="value"
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
