import type { VerdictKind } from '../../engine'

export const VERDICT_STYLE: Record<VerdictKind, { box: string; dot: string }> = {
  short: { box: 'border-red-500 bg-red-50 text-red-900', dot: 'bg-red-500' },
  gap: { box: 'border-red-500 bg-red-50 text-red-900', dot: 'bg-red-500' },
  thin: { box: 'border-amber-500 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
  lasts: { box: 'border-emerald-500 bg-emerald-50 text-emerald-900', dot: 'bg-emerald-500' },
  never: { box: 'border-emerald-500 bg-emerald-50 text-emerald-900', dot: 'bg-emerald-500' },
}
