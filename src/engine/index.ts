import { simulate } from './simulate'
import { summarize } from './summarize'
import { findEarliestRetirementMonths } from './solver'
import type { Params, Summary, TrajectoryPoint } from './types'

export interface ScenarioResult {
  trajectory: TrajectoryPoint[]
  summary: Summary
  earliestRetirementMonths: number | null
}

/** Precondition: validateParams(p) is empty. */
export function runScenario(p: Params): ScenarioResult {
  const trajectory = simulate(p)
  return {
    trajectory,
    summary: summarize(p, trajectory),
    earliestRetirementMonths: findEarliestRetirementMonths(p),
  }
}

export * from './types'
export * from './constants'
export { monthlyRate, toMonths } from './rates'
export { phaseBounds, phaseOfMonth, type PhaseBounds } from './timeline'
export { simulate, firstUnmetMonth } from './simulate'
export { summarize } from './summarize'
export { validateParams, type ValidationIssue, type IssueCode } from './validate'
export { findEarliestRetirementMonths } from './solver'
