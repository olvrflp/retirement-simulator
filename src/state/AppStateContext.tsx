import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react'
import { runScenario, validateParams, type ScenarioResult, type ValidationIssue } from '../engine'
import type { Lang } from '../format/currency'
import { I18nProvider } from '../i18n/I18nContext'
import { currentStartMonth } from './defaults'
import { reducer, type Action, type AppState } from './reducer'
import { loadState, saveState, STORAGE_KEY } from './storage'

interface ActiveResult {
  issues: ValidationIssue[]
  result: ScenarioResult | null
}

interface Ctx {
  state: AppState
  active: ActiveResult
  dispatch: Dispatch<Action>
  storageWarning: boolean
  dismissStorageWarning: () => void
}

const AppStateContext = createContext<Ctx | null>(null)

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function AppStateProvider({ children, lang }: { children: ReactNode; lang?: Lang }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState(safeLocalStorage(), lang ?? detectLang(), currentStartMonth()),
  )
  const [storageWarning, setStorageWarning] = useState(false)
  // Don't write until the user changes something, so unreadable storage isn't overwritten on load.
  const initial = useRef(state)
  useEffect(() => {
    if (state === initial.current) return
    // The write result comes from an external system, so the warning can only be set here.
    // oxlint-disable-next-line react/set-state-in-effect
    if (!saveState(safeLocalStorage(), state)) setStorageWarning(true)
  }, [state])

  // Another tab saved or deleted scenarios: adopt its list so our next write doesn't erase them.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return
      const s = loadState(safeLocalStorage(), 'en', currentStartMonth())
      dispatch({ type: 'syncScenarios', scenarios: s.scenarios, selectedIds: s.selectedIds, nextColorIndex: s.nextColorIndex })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Computed once here so every consumer shares one engine + solver run per change.
  const active = useMemo<ActiveResult>(() => {
    const issues = validateParams(state.params)
    return { issues, result: issues.length ? null : runScenario(state.params) }
  }, [state.params])

  const value = useMemo(
    () => ({ state, active, dispatch, storageWarning, dismissStorageWarning: () => setStorageWarning(false) }),
    [state, active, storageWarning],
  )
  return (
    <AppStateContext.Provider value={value}>
      <I18nProvider value={state.language}>{children}</I18nProvider>
    </AppStateContext.Provider>
  )
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}

export function useActiveResult(): ActiveResult {
  return useAppState().active
}
