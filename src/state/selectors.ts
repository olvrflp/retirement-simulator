import type { Scenario } from './reducer'

export const PALETTE = ['#2563eb', '#ea580c', '#059669', '#9333ea', '#dc2626', '#0891b2', '#ca8a04', '#db2777']

/** Selected scenarios split by currency: only the first selected one's currency is plotted. */
export function partitionByCurrency(scenarios: Scenario[], selectedIds: string[]) {
  const byId = new Map(scenarios.map((s) => [s.id, s]))
  const selected = selectedIds.map((id) => byId.get(id)).filter((s): s is Scenario => s !== undefined)
  const currency = selected[0]?.params.currency
  return {
    plotted: selected.filter((s) => s.params.currency === currency),
    hidden: selected.filter((s) => s.params.currency !== currency),
  }
}
