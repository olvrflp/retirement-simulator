import { ENGINE_VERSION, runScenario } from '../engine'
import type { Lang } from '../format/currency'
import { defaultParams } from './defaults'
import { initialState, type AppState, type Scenario } from './reducer'

export const STORAGE_KEY = 'runway-sim:v1'
const SCHEMA_VERSION = 1

type Persisted = Pick<AppState, 'params' | 'scenarios' | 'selectedIds' | 'language' | 'chartMode' | 'nextColorIndex'> & {
  schemaVersion: number
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
    const scenarios = p.scenarios.map(refresh)
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

/** Params are the source of truth; a result cached by another engine version is recomputed. */
function refresh(s: Scenario): Scenario {
  if (s.engineVersion === ENGINE_VERSION) return s
  return { ...s, engineVersion: ENGINE_VERSION, result: runScenario(s.params) }
}

export function saveState(storage: Storage | undefined, s: AppState): boolean {
  if (!storage) return false
  const data: Persisted = {
    schemaVersion: SCHEMA_VERSION,
    params: s.params,
    scenarios: s.scenarios,
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
