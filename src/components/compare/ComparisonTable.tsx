import { toMonths } from '../../engine'
import { formatAge, formatMoney } from '../../format/format'
import { useLang, useT } from '../../i18n/I18nContext'
import type { Scenario } from '../../state/reducer'
import { VERDICT_STYLE } from '../results/verdictStyle'

export function ComparisonTable({ scenarios }: { scenarios: Scenario[] }) {
  const t = useT()
  const lang = useLang()
  const age = (s: Scenario, months: number) => formatAge(toMonths(s.params.currentAge) + months, lang)
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">{t('compare.col.name')}</th>
            <th className="px-3 py-2">{t('compare.col.verdict')}</th>
            <th className="px-3 py-2">{t('compare.col.retire')}</th>
            <th className="px-3 py-2">{t('compare.col.earliest')}</th>
            <th className="px-3 py-2">{t('compare.col.depletes')}</th>
            <th className="px-3 py-2 text-right">{t('compare.col.balance')}</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const sum = s.result.summary
            const earliest = s.result.earliestRetirementMonths
            return (
              <tr key={s.id} className="border-t border-slate-100 tabular-nums">
                <td className="px-3 py-2">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                  {s.name}
                </td>
                <td className="px-3 py-2">
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${VERDICT_STYLE[sum.verdict].dot}`} />
                  {t(`verdictLabel.${sum.verdict}`)}
                </td>
                <td className="px-3 py-2">{age(s, sum.retirementMonth)}</td>
                <td className="px-3 py-2">{earliest === null ? '—' : age(s, earliest)}</td>
                <td className="px-3 py-2">{sum.depletionMonth === null ? '—' : age(s, sum.depletionMonth)}</td>
                <td className="px-3 py-2 text-right">
                  {sum.balanceAtTarget ? formatMoney(sum.balanceAtTarget.real, s.params.currency, lang) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
