import { phaseBounds, type Params, type ScenarioResult } from '../../engine'
import type { ChartMode } from '../../state/reducer'

export interface ChartSeries {
  id: string
  name: string
  color: string
  startMonth: string
  points: { age: number; value: number; k: number; startMonth: string }[]
}

export interface Marker {
  age: number
  label: string
}

export function toChartSeries(
  id: string,
  name: string,
  color: string,
  result: ScenarioResult,
  mode: ChartMode,
  startMonth: string,
): ChartSeries {
  return {
    id,
    name,
    color,
    startMonth,
    points: result.trajectory.map((p) => ({
      age: p.age,
      k: p.k,
      startMonth,
      value: mode === 'real' ? p.balanceReal : p.balance,
    })),
  }
}

/** A marker at the start age of every phase that has a non-zero length. */
export function phaseMarkers(p: Params): Marker[] {
  const b = phaseBounds(p)
  const at = (months: number) => p.currentAge + months / 12
  const markers: Marker[] = []
  if (b.p1 > 0) markers.push({ age: at(0), label: '①' })
  if (b.p2 > 0) markers.push({ age: at(b.p1), label: '②' })
  if (b.p3 > 0) markers.push({ age: at(b.p1 + b.p2), label: '③' })
  if (b.pensionMonth < b.horizonMonth) markers.push({ age: at(b.pensionMonth), label: '④' })
  return markers
}
