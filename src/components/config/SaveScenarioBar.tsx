import { useState } from 'react'
import { useT } from '../../i18n/I18nContext'
import { useActiveResult, useAppState } from '../../state/AppStateContext'

export function SaveScenarioBar() {
  const t = useT()
  const { state, dispatch } = useAppState()
  const { issues } = useActiveResult()
  const [draft, setDraft] = useState('')
  const disabled = issues.length > 0

  const save = () => {
    if (disabled) return
    dispatch({
      type: 'saveScenario',
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: draft.trim() || t('scenario.defaultName', { n: state.scenarios.length + 1 }),
    })
    setDraft('')
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <input
        type="text"
        aria-label={t('save.placeholder')}
        placeholder={t('save.placeholder')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {t('save.button')}
      </button>
    </form>
  )
}
