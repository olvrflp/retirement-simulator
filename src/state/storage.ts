import { ENGINE_VERSION, runScenario, validateParams, type Params } from '../engine'
import type { Lang } from '../format/currency'
import { defaultParams } from './defaults'
import { initialState, type AppState, type Scenario } from './reducer'

export const STORAGE_KEY = 'runway-sim:v1'
const SCHEMA_VERSION = 1

// Scenarios are stored without their results: params are the source of truth and recomputing
// takes ~2 ms, while a cached trajectory would cost ~135k characters per scenario.
type StoredScenario = Omit<Scenario, 'result' | 'engineVersion'>

interface Persisted extends Pick<AppState, 'params' | 'selectedIds' | 'language' | 'chartMode' | 'nextColorIndex'> {
  schemaVersion: number
  scenarios: StoredScenario[]
}

export function loadState(storage: Storage | undefined, lang: Lang, startMonth: string): AppState {
  const fallback = initialState(lang, startMonth)
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<Persisted>
    if (p.schemaVersion !== SCHEMA_VERSION || !p.params || !Array.isArray(p.scenarios) || !Array.isArray(p.selectedIds)) {
      return fallback
    }
    const scenarios = p.scenarios.flatMap(restore)
    const ids = new Set(scenarios.map((s) => s.id))
    return {
      ...fallback,
      // Fill any field added since the data was written; the live plan is re-anchored to today.
      params: { ...defaultParams(p.params.currency ?? 'COP', startMonth), ...p.params, startMonth },
      scenarios,
      selectedIds: p.selectedIds.filter((id) => ids.has(id)),
      language: p.language ?? lang,
      chartMode: p.chartMode ?? fallback.chartMode,
      nextColorIndex: p.nextColorIndex ?? scenarios.length,
    }
  } catch {
    return fallback
  }
}

function restore(s: StoredScenario): Scenario[] {
  const params = s?.params as Params | undefined
  if (!params || validateParams(params).length > 0) return []
  return [{ ...s, engineVersion: ENGINE_VERSION, result: runScenario(params) }]
}

export function saveState(storage: Storage | undefined, s: AppState): boolean {
  if (!storage) return false
  const data: Persisted = {
    schemaVersion: SCHEMA_VERSION,
    params: s.params,
    scenarios: s.scenarios.map(({ id, name, createdAt, color, params }) => ({ id, name, createdAt, color, params })),
    selectedIds: s.selectedIds,
    language: s.language,
    chartMode: s.chartMode,
    nextColorIndex: s.nextColorIndex,
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
