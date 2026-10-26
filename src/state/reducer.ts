import { ENGINE_VERSION, runScenario, validateParams, type Currency, type Params, type ScenarioResult } from '../engine'
import type { Lang } from '../format/currency'
import { defaultParams } from './defaults'
import { PALETTE } from './selectors'

export interface Scenario {
  id: string
  name: string
  createdAt: string
  color: string
  params: Params
  engineVersion: number
  result: ScenarioResult
}

export type ChartMode = 'real' | 'nominal'
export type Tab = 'config' | 'compare'

export interface AppState {
  params: Params
  scenarios: Scenario[]
  selectedIds: string[]
  language: Lang
  chartMode: ChartMode
  activeTab: Tab
  nextColorIndex: number
}

export type Action =
  | { type: 'setParam'; key: keyof Params; value: Params[keyof Params] }
  | { type: 'setParams'; params: Partial<Params> }
  | { type: 'setCurrency'; currency: Currency }
  | { type: 'saveScenario'; id: string; createdAt: string; name: string }
  | { type: 'deleteScenario'; id: string }
  | { type: 'toggleSelected'; id: string }
  | { type: 'loadScenario'; id: string; startMonth: string }
  | { type: 'setLanguage'; language: Lang }
  | { type: 'setChartMode'; mode: ChartMode }
  | { type: 'setTab'; tab: Tab }

export function initialState(lang: Lang, startMonth: string): AppState {
  return {
    params: defaultParams('COP', startMonth),
    scenarios: [],
    selectedIds: [],
    language: lang,
    chartMode: 'real',
    activeTab: 'config',
    nextColorIndex: 0,
  }
}

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'setParam':
      return { ...s, params: { ...s.params, [a.key]: a.value } }
    case 'setParams':
      return { ...s, params: { ...s.params, ...a.params } }
    case 'setCurrency':
      return { ...s, params: { ...s.params, currency: a.currency } }
    case 'saveScenario': {
      if (validateParams(s.params).length > 0) return s
      // Snapshot from the reducer's own state so a stale UI closure can never be saved.
      const params = structuredClone(s.params)
      const scenario: Scenario = {
        id: a.id,
        name: a.name,
        createdAt: a.createdAt,
        color: PALETTE[s.nextColorIndex % PALETTE.length],
        params,
        engineVersion: ENGINE_VERSION,
        result: runScenario(params),
      }
      return {
        ...s,
        scenarios: [...s.scenarios, scenario],
        selectedIds: [...s.selectedIds, a.id],
        nextColorIndex: s.nextColorIndex + 1,
      }
    }
    case 'deleteScenario':
      return {
        ...s,
        scenarios: s.scenarios.filter((x) => x.id !== a.id),
        selectedIds: s.selectedIds.filter((id) => id !== a.id),
      }
    case 'toggleSelected':
      return {
        ...s,
        selectedIds: s.selectedIds.includes(a.id)
          ? s.selectedIds.filter((id) => id !== a.id)
          : [...s.selectedIds, a.id],
      }
    case 'loadScenario': {
      const sc = s.scenarios.find((x) => x.id === a.id)
      if (!sc) return s
      return { ...s, params: { ...structuredClone(sc.params), startMonth: a.startMonth }, activeTab: 'config' }
    }
    case 'setLanguage':
      return { ...s, language: a.language }
    case 'setChartMode':
      return { ...s, chartMode: a.mode }
    case 'setTab':
      return { ...s, activeTab: a.tab }
  }
}
