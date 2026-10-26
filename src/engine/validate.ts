import { HORIZON_AGE } from './constants'
import { phaseBounds } from './timeline'
import type { Params } from './types'

export type IssueCode =
  | 'required'
  | 'negative'
  | 'rateOutOfRange'
  | 'targetNotAfterCurrent'
  | 'pensionNotAfterCurrent'
  | 'ageAboveHorizon'
  | 'phase3Negative'

export interface ValidationIssue {
  field: keyof Params | 'phase3'
  code: IssueCode
}

type NumericField = { [K in keyof Params]: Params[K] extends number ? K : never }[keyof Params]

const NON_NEGATIVE: NumericField[] = [
  'currentAge',
  'slackYears',
  'startingCapital',
  'monthlyWithdrawal',
  'monthlySavings',
  'monthlyPension',
  'p1Years',
  'p2Years',
]
const RATES: NumericField[] = ['inflationPct', 'p1ReturnPct', 'p2ReturnPct', 'p3ReturnPct']
const NUMERIC: NumericField[] = [...NON_NEGATIVE, ...RATES, 'targetAge', 'pensionAge']

export function validateParams(p: Params): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const missing = new Set<NumericField>()
  for (const f of NUMERIC) {
    if (!Number.isFinite(p[f])) {
      issues.push({ field: f, code: 'required' })
      missing.add(f)
    }
  }
  for (const f of NON_NEGATIVE) if (!missing.has(f) && p[f] < 0) issues.push({ field: f, code: 'negative' })
  for (const f of RATES) if (!missing.has(f) && p[f] < -99) issues.push({ field: f, code: 'rateOutOfRange' })

  const agesKnown = !missing.has('currentAge')
  if (!missing.has('targetAge')) {
    if (agesKnown && p.targetAge <= p.currentAge) issues.push({ field: 'targetAge', code: 'targetNotAfterCurrent' })
    if (p.targetAge > HORIZON_AGE) issues.push({ field: 'targetAge', code: 'ageAboveHorizon' })
  }
  if (!missing.has('pensionAge')) {
    if (agesKnown && p.pensionAge <= p.currentAge) issues.push({ field: 'pensionAge', code: 'pensionNotAfterCurrent' })
    if (p.pensionAge > HORIZON_AGE) issues.push({ field: 'pensionAge', code: 'ageAboveHorizon' })
  }
  const p3Inputs: NumericField[] = ['currentAge', 'p1Years', 'p2Years', 'pensionAge']
  if (p3Inputs.every((f) => !missing.has(f)) && phaseBounds(p).p3 < 0) {
    issues.push({ field: 'phase3', code: 'phase3Negative' })
  }
  return issues
}
