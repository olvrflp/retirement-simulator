import { createContext, useCallback, useContext, type ReactNode } from 'react'
import type { Lang } from '../format/currency'
import { translate, type StringKey } from './strings'

const LangContext = createContext<Lang>('en')

export function I18nProvider({ value, children }: { value: Lang; children: ReactNode }) {
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): Lang {
  return useContext(LangContext)
}

export function useT(): (key: StringKey, vars?: Record<string, string | number>) => string {
  const lang = useLang()
  return useCallback((key, vars) => translate(lang, key, vars), [lang])
}
