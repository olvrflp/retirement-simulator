import { useT } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { currentStartMonth } from '../../state/defaults'

export function ScenarioList() {
  const t = useT()
  const { state, dispatch } = useAppState()
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-semibold text-slate-900">{t('compare.scenarios')}</h2>
      <ul className="space-y-2">
        {state.scenarios.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <input
              id={`sel-${s.id}`}
              type="checkbox"
              checked={state.selectedIds.includes(s.id)}
              onChange={() => dispatch({ type: 'toggleSelected', id: s.id })}
            />
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <label htmlFor={`sel-${s.id}`} className="min-w-0 flex-1 truncate">
              {s.name}
            </label>
            <span className="text-xs text-slate-500">{s.params.currency}</span>
            <button
              type="button"
              aria-label={`${t('compare.load')} ${s.name}`}
              onClick={() => dispatch({ type: 'loadScenario', id: s.id, startMonth: currentStartMonth() })}
              className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
            >
              {t('compare.load')}
            </button>
            <button
              type="button"
              aria-label={`${t('compare.delete')} ${s.name}`}
              onClick={() => {
                if (window.confirm(t('compare.confirmDelete', { name: s.name }))) dispatch({ type: 'deleteScenario', id: s.id })
              }}
              className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
            >
              {t('compare.delete')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
