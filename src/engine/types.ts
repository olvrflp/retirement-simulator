export type Currency = 'COP' | 'USD' | 'EUR' | 'MXN'
export type Phase = 1 | 2 | 3 | 4

export interface Params {
  currency: Currency
  startMonth: string // 'YYYY-MM', month index 0
  currentAge: number
  targetAge: number
  slackYears: number
  startingCapital: number
  monthlyWithdrawal: number // today's money
  inflationPct: number
  p1Years: number
  p1ReturnPct: number
  monthlySavings: number
  savingsGrowWithInflation: boolean
  p2Years: number
  p2ReturnPct: number
  p3ReturnPct: number
  pensionAge: number
  monthlyPension: number // today's money
}

export interface TrajectoryPoint {
  k: number // point index; balance at age currentAge + k/12
  age: number
  phase: Phase // phase of the month that produced this point (k=0 → phase of month 0)
  balance: number // nominal, ≥ 0
  balanceReal: number // balance / (1+i_inf)^k
  withdrawal: number // W_m (0 in phase 1)
  pension: number // Pen_m (0 before phase 4)
  netWithdrawal: number // amount requested from the balance this month
  unmet: number // requested − paid
}

export type VerdictKind = 'short' | 'gap' | 'thin' | 'lasts' | 'never'

export interface Summary {
  verdict: VerdictKind
  retirementMonth: number
  pensionMonth: number
  horizonMonth: number
  targetMonth: number
  slackMonth: number
  depletionMonth: number | null // first month with unmet spending
  runwayMonths: number // (depletionMonth ?? horizonMonth) − retirementMonth
  balanceAtTarget: { nominal: number; real: number } | null
  deficitAtTargetReal: number // unmet spending before the target, in today's money
  gapShortfallReal: number // unmet spending before the pension, in today's money
}
