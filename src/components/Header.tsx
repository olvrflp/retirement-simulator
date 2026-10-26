import type { Currency } from '../engine'
import { CURRENCIES, type Lang } from '../format/currency'
import { useT } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import type { Tab } from '../state/reducer'

export function Header() {
  const t = useT()
  const { state, dispatch } = useAppState()
  const tab = (id: Tab, key: 'tab.config' | 'tab.compare') => (
    <button
      type="button"
      role="tab"
      aria-selected={state.activeTab === id}
      onClick={() => dispatch({ type: 'setTab', tab: id })}
      className={`border-b-2 px-3 py-2 text-sm font-medium ${
        state.activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      {t(key)}
    </button>
  )
  const langButton = (lang: Lang) => (
    <button
      type="button"
      aria-pressed={state.language === lang}
      onClick={() => dispatch({ type: 'setLanguage', language: lang })}
      className={`px-2 py-1 text-xs font-semibold ${state.language === lang ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
    >
      {lang.toUpperCase()}
    </button>
  )

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-3 px-4 pt-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('app.title')}</h1>
          <p className="text-sm text-slate-500">{t('app.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 pb-1">
          <div role="group" aria-label={t('header.language')} className="inline-flex overflow-hidden rounded-md border border-slate-300">
            {langButton('es')}
            {langButton('en')}
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            {t('header.currency')}
            <select
              value={state.params.currency}
              onChange={(e) => dispatch({ type: 'setCurrency', currency: e.target.value as Currency })}
              className="rounded-md border border-slate-300 bg-white px-1 py-1 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav role="tablist" className="flex w-full gap-1">
          {tab('config', 'tab.config')}
          {tab('compare', 'tab.compare')}
        </nav>
      </div>
    </header>
  )
}
