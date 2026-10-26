import { toMonths, type Params, type ScenarioResult } from '../../engine'
import { localeFor, type Lang } from '../../format/currency'
import { formatAge, formatMoney } from '../../format/format'
import { useLang, useT } from '../../i18n/I18nContext'
import { VERDICT_STYLE } from './verdictStyle'

const years = (months: number, lang: Lang) =>
  new Intl.NumberFormat(localeFor(lang), { maximumFractionDigits: 1 }).format(months / 12)

interface Props {
  params: Params
  result: ScenarioResult
  onUseEarliest: (p1Months: number) => void
}

export function VerdictBanner({ params, result, onUseEarliest }: Props) {
  const t = useT()
  const lang = useLang()
  const s = result.summary
  const age0 = toMonths(params.currentAge)
  const d = s.depletionMonth ?? 0
  const age = formatAge(age0 + d, lang)

  const message = {
    short: () => t('verdict.short', { age, years: years(s.targetMonth - d, lang), target: params.targetAge }),
    gap: () =>
      t('verdict.gap', {
        age,
        gap: formatAge(s.pensionMonth - d, lang),
        amount: formatMoney(s.gapShortfallReal, params.currency, lang),
      }),
    thin: () =>
      t('verdict.thin', { age, years: years(d - s.targetMonth, lang), target: params.targetAge, slack: params.slackYears }),
    lasts: () => t('verdict.lasts', { age, years: years(d - s.targetMonth, lang), target: params.targetAge }),
    never: () => t('verdict.never'),
  }[s.verdict]()

  const earliest = result.earliestRetirementMonths
  return (
    <div role="status" className={`rounded-xl border-l-4 p-4 ${VERDICT_STYLE[s.verdict].box}`}>
      <p className="font-semibold">{message}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {earliest === null ? (
          <span>{t('earliest.none')}</span>
        ) : (
          <>
            <span className="font-medium">{t('earliest.value', { age: formatAge(age0 + earliest, lang) })}</span>
            {earliest !== s.retirementMonth && (
              <button
                type="button"
                onClick={() => onUseEarliest(earliest)}
                className="rounded-md border border-current px-2 py-0.5 text-xs font-medium hover:bg-white/60"
              >
                {t('earliest.use')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
