/** Monthly compounding rate equivalent to an annual effective rate given in percent. */
export function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1
}

export function toMonths(years: number): number {
  return Math.round(years * 12)
}
