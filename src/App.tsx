import { useEffect } from 'react'
import { CompareTab } from './components/compare/CompareTab'
import { ConfigTab } from './components/config/ConfigTab'
import { Header } from './components/Header'
import { useT } from './i18n/I18nContext'
import { useAppState } from './state/AppStateContext'

export default function App() {
  const t = useT()
  const { state, storageWarning, dismissStorageWarning } = useAppState()

  useEffect(() => {
    document.documentElement.lang = state.language
  }, [state.language])

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      {storageWarning && (
        <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between gap-3 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <span>{t('storage.warning')}</span>
          <button type="button" onClick={dismissStorageWarning} className="text-xs font-medium underline">
            {t('storage.dismiss')}
          </button>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-4">{state.activeTab === 'config' ? <ConfigTab /> : <CompareTab />}</main>
    </div>
  )
}
