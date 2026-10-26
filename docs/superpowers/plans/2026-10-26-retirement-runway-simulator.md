# Retirement Runway Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (ES/EN) React app that simulates a four-phase savings runway month by month, tells the user whether their money lasts to their target age, computes the earliest retirement age, and saves and compares scenarios on one chart.

**Architecture:** A pure TypeScript engine (`src/engine/`) with no React imports does all the math: simulation, verdict, validation, and the earliest-retirement solver. App state lives in a single `useReducer`, so "Save scenario" snapshots and computes from the reducer's current state, never a stale closure. That state persists to `localStorage`. Components read state through a context and render the results. Both tabs share one chart component.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Recharts, Vitest + React Testing Library + jsdom. Node 26 / npm 11 are available locally.

**Spec:** `docs/superpowers/specs/2026-10-26-retirement-runway-simulator-design.md`. Read it before starting any task. Section numbers below (§N) refer to it.

## Global Constraints

- Output must be a static bundle that works locally and from any CDN/sub-path: `vite.config.ts` sets `base: './'`.
- `src/engine/**` must not import React or anything from `src/state`, `src/components`, `src/i18n`.
- All user-visible copy comes from `src/i18n/strings.ts`, with no string literals in components except punctuation. Every key exists in both `en` and `es`.
- Percent inputs are stored as percent numbers (`5` means 5 %). Convert with `monthlyRate(pct) = (1 + pct/100)^(1/12) − 1`.
- Month conversion everywhere: `toMonths(years) = Math.round(years * 12)`.
- Horizon age is the constant `HORIZON_AGE = 100`.
- Currencies: `'COP' | 'USD' | 'EUR' | 'MXN'`, default `'COP'`. Currency only changes formatting, never converts.
- Default language: `'es'` if `navigator.language` starts with `es`, else `'en'`.
- Lists and chart series are keyed by scenario `id`, never by array index.
- Saved scenarios are immutable after creation. The only allowed operation is delete.
- `localStorage` key: `runway-sim:v1`. All access is wrapped in try/catch.
- Disclaimer copy must be visible on the Configuration tab: EN "Educational estimate, not financial advice." / ES "Estimación educativa, no es asesoría financiera."
- `npm test`, `npm run build` (includes `tsc -b`), and `npm run lint` must all pass at the end of every task.

## Review Focus

1. **Comma decimals.** Spanish-speaking users type `5,5` for 5.5 %. The number fields must accept a comma as the decimal separator, and must not show NaN or crash. Pinned in Task 8.
2. **Zero or negative rates.** 0 % inflation, 0 % returns, and returns down to −99 % must produce finite numbers everywhere: no NaN or Infinity in the trajectory or summary. Pinned in Task 2.
3. **Huge COP amounts.** Balances in the trillions of pesos must format compactly on chart axes (for example "$4 bill." / "$4T") and in full in the metrics. Pinned in Task 5.
4. **`localStorage` unavailable or throwing** (private mode, quota exceeded, corrupt JSON). The app still loads with defaults and keeps working, and a failed write shows a non-blocking warning instead of crashing. Pinned in Task 7.
5. **Impossible ages.** If the target age ≤ current age, pension age ≤ current age, or an age is above 100, the app shows a field error and hides the results. It must not chart garbage or loop forever in the solver. Pinned in Task 4.

---

## File Structure

```
index.html
vite.config.ts            # base './', react, tailwind, vitest (jsdom, setup file)
src/
  main.tsx                # mounts <App/> inside <AppStateProvider>
  index.css               # @import "tailwindcss";
  test/setup.ts           # jest-dom, ResizeObserver polyfill, localStorage reset
  engine/
    types.ts              # Params, TrajectoryPoint, Summary, ScenarioResult, Currency, VerdictKind
    constants.ts          # HORIZON_AGE, ENGINE_VERSION
    rates.ts              # monthlyRate, toMonths
    timeline.ts           # phaseBounds, phaseOfMonth
    simulate.ts           # simulate, firstUnmetMonth (shared step function)
    summarize.ts          # summarize
    validate.ts           # validateParams
    solver.ts             # findEarliestRetirementMonths
    index.ts              # runScenario + re-exports
  format/
    currency.ts           # CURRENCY_SCALE, CURRENCIES, localeFor
    format.ts             # formatMoney, formatAge, formatMonthYear
  state/
    defaults.ts           # defaultParams, currentStartMonth
    reducer.ts            # AppState, Action, reducer, initialState
    storage.ts            # loadState, saveState
    selectors.ts          # partitionByCurrency, PALETTE
    AppStateContext.tsx   # provider, useAppState, useActiveResult
  i18n/
    strings.ts            # en, es dictionaries
    I18nContext.tsx       # useT (reads language from app state)
  components/
    Header.tsx
    config/ParamField.tsx
    config/ParamCards.tsx       # GlobalCard, Phase1Card…Phase4Card
    config/SaveScenarioBar.tsx
    config/ConfigTab.tsx
    results/VerdictBanner.tsx
    results/MetricsRow.tsx
    results/chartData.ts        # toChartSeries, phaseMarkers
    results/RunwayChart.tsx
    compare/ScenarioList.tsx
    compare/ComparisonTable.tsx
    compare/CompareTab.tsx
  App.tsx
```

Tests sit next to the code as `*.test.ts(x)`.

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json` (+ `tsconfig.app.json`/`tsconfig.node.json` if using the Vite template layout), `eslint.config.js`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`, `src/App.test.tsx`
- Modify: `.gitignore` (already exists; keep its entries)

**Interfaces:**
- Produces: npm scripts `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `test:watch`, `lint` (`eslint .`).

The directory isn't empty (it already has `docs/` and `.gitignore`), so scaffold with `npm create vite@latest scaffold-tmp -- --template react-ts` into a temporary subfolder. Move its files to the repo root, then delete the folder. Install `recharts tailwindcss @tailwindcss/vite`, plus dev deps `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`.

- [ ] **Step 1: Scaffold, install, configure**
  - Set `base: './'` in `vite.config.ts`.
  - Add the `tailwindcss()` plugin.
  - Add a `test` block: `environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`, `globals: true`.
  - `src/test/setup.ts`:
    - imports `@testing-library/jest-dom/vitest`
    - defines a no-op `ResizeObserver` on `globalThis` if it is missing (Recharts needs it)
    - calls `localStorage.clear()` in `afterEach`
  - `src/index.css` is `@import "tailwindcss";`.
  - `App.tsx` renders `<h1>Runway</h1>` for now.

- [ ] **Step 2: Write smoke test** `src/App.test.tsx`: `it('renders', () => { render(<App/>); expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(); })`

- [ ] **Step 3: Verify**
  - `npm test` → 1 passed.
  - `npm run build` → creates `dist/index.html`, whose asset URLs start with `./`.
  - `npm run lint` → no errors.

- [ ] **Step 4: Commit** `chore: scaffold Vite React TS app with Tailwind, Recharts, Vitest`

---

### Task 2: Engine — types, rates, timeline, month-by-month simulation

**Files:**
- Create: `src/engine/types.ts`, `src/engine/constants.ts`, `src/engine/rates.ts`, `src/engine/timeline.ts`, `src/engine/simulate.ts`
- Test: `src/engine/rates.test.ts`, `src/engine/simulate.test.ts`

**Interfaces:**
- Produces:
```ts
// types.ts
export type Currency = 'COP' | 'USD' | 'EUR' | 'MXN';
export type Phase = 1 | 2 | 3 | 4;
export interface Params {
  currency: Currency;
  startMonth: string;            // 'YYYY-MM', month index 0
  currentAge: number; targetAge: number; slackYears: number;
  startingCapital: number; monthlyWithdrawal: number; inflationPct: number;
  p1Years: number; p1ReturnPct: number; monthlySavings: number; savingsGrowWithInflation: boolean;
  p2Years: number; p2ReturnPct: number;
  p3ReturnPct: number;
  pensionAge: number; monthlyPension: number;
}
export interface TrajectoryPoint {
  k: number;            // point index; balance at age currentAge + k/12
  age: number;          // currentAge + k/12
  phase: Phase;         // phase of the month that produced this point (k=0 → phase of month 0)
  balance: number;      // nominal, ≥ 0
  balanceReal: number;  // balance / (1+i_inf)^k
  withdrawal: number;   // W_m (0 in phase 1)
  pension: number;      // Pen_m (0 before phase 4)
  netWithdrawal: number;// amount actually requested from balance this month
  unmet: number;        // requested − paid (> 0 only when balance couldn't cover it)
}
// constants.ts
export const HORIZON_AGE = 100;
export const ENGINE_VERSION = 1;
// rates.ts
export function monthlyRate(annualPct: number): number;
export function toMonths(years: number): number;
// timeline.ts
export interface PhaseBounds { p1: number; p2: number; p3: number; retirementMonth: number; pensionMonth: number; horizonMonth: number; }
export function phaseBounds(params: Params, p1MonthsOverride?: number): PhaseBounds;
export function phaseOfMonth(m: number, b: PhaseBounds): Phase;
// simulate.ts
export function simulate(params: Params, p1MonthsOverride?: number): TrajectoryPoint[];
export function firstUnmetMonth(params: Params, p1MonthsOverride?: number): number | null;
```

`phaseBounds` values:
- `p1 = override ?? toMonths(p1Years)`
- `p2 = toMonths(p2Years)`
- `p3 = toMonths(pensionAge) − toMonths(currentAge) − p1 − p2`. It may be negative; validation catches that.
- `retirementMonth = p1`
- `pensionMonth = p1 + p2 + p3`
- `horizonMonth = toMonths(HORIZON_AGE) − toMonths(currentAge)`

`phaseOfMonth`:
- m < p1 → 1
- m < p1+p2 → 2
- m < pensionMonth → 3
- otherwise → 4

Simulation semantics (spec §7):
- Point `k = 0` is the starting capital.
- For `k = 1..horizonMonth`, month `m = k − 1` produces point k, with `f_m = (1+i_inf)^m`.
- Monthly cash flows:
  - withdrawal `W_m = W0·f_m`
  - pension `Pen_m = Pen0·f_m`
  - savings `S_m = savingsGrowWithInflation ? S·f_m : S`
- Balance update by phase:
  - Phase 1: `B = (B + S_m)·(1+i1)`
  - Phases 2–3: request `W_m`
  - Phase 4: request `max(0, W_m − Pen_m)`
- Paying a request: `paid = min(request, B)`, `unmet = request − paid`, then `B = (B − paid)·(1+i)`, where `i` is the phase's rate (phase 4 uses r3).
- Put the per-month update in one internal `step` function. `simulate` and `firstUnmetMonth` both call it. `firstUnmetMonth` allocates no arrays and returns the first `m` with `unmet > 0`.

- [ ] **Step 1: Write failing tests** `rates.test.ts`:
  - `monthlyRate(12.682503013196976)` ≈ `0.01` (1e-12)
  - `monthlyRate(0) === 0`
  - `monthlyRate(-99)` is finite
  - `toMonths(2.5) === 30`

- [ ] **Step 2: Write failing tests** `simulate.test.ts`. Put the `base: Params` fixture in `src/engine/fixtures.ts` (later tasks reuse it):
  - `currency 'USD'`, `startMonth '2026-10'`
  - `currentAge 38`, `targetAge 75`, `slackYears 5`
  - `p1Years 1`, `p2Years 1`, `pensionAge 41`
  - every rate and inflation 0, every amount 0, `savingsGrowWithInflation false`

  Each test overrides fields with a spread.
  - `'trajectory spans to age 100'`: `simulate(base).length === toMonths(100) − toMonths(38) + 1` and `at(-1).age === 100`.
  - `'hand-checked gap example'`, with `startingCapital 1000, monthlySavings 100, p1Years 1, p2Years 1, pensionAge 41, monthlyWithdrawal 100, monthlyPension 100`, all rates and inflation 0:
    - `traj[12].balance === 2200`
    - `traj[24].balance === 1000`
    - `traj[34].balance === 0 && traj[34].unmet === 0`, since month 33 empties the balance exactly
    - `traj[35].unmet === 100`
    - `traj[37].unmet === 0 && traj[37].netWithdrawal === 0`
    - `firstUnmetMonth(params) === 34`
  - `'withdraw then grow'`: `p1Years 0, p2ReturnPct 12.682503013196976, startingCapital 1000, monthlyWithdrawal 100` → `traj[1].balance` ≈ 909 (1e-9).
  - `'phase 1 compounds contributions'`: `p1ReturnPct 12.682503013196976, startingCapital 0, monthlySavings 100` → `traj[1].balance` ≈ 101 and `traj[2].balance` ≈ 203.01.
  - `'withdrawals inflate from today'`: `inflationPct 12.682503013196976, p1Years 1, monthlyWithdrawal 100` → `traj[13].withdrawal` ≈ 112.6825030 (1e-6). Also `traj[13].balanceReal` ≈ `traj[13].balance / 1.01**13`.
  - `'pension offsets spending'`: in phase 4 with `monthlyWithdrawal 100, monthlyPension 60` and 0 inflation, `netWithdrawal === 40`.
  - `'pension surplus is not saved'`: with `monthlyPension 150 > monthlyWithdrawal 100`, the phase-4 balance after one month equals the previous balance × (1+i3).
  - `'savings grow with inflation when toggled'`: month 12 contribution = `S·f_12`.
  - `'phase 3 of zero length goes straight to pension'`: with `pensionAge = 38 + p1 + p2`, no point has `phase === 3`.
  - Review Focus 2, `'extreme rates stay finite'`:
    - inputs: `inflationPct 0, p1ReturnPct −99, p2ReturnPct 0, p3ReturnPct −99`, large withdrawal
    - assert: every `balance`, `balanceReal`, `unmet` is `Number.isFinite` and `balance ≥ 0`

- [ ] **Step 3: Run** `npx vitest run src/engine` → FAIL (modules missing).
- [ ] **Step 4: Implement** the types, constants, rates, timeline and simulate per the Interfaces block.
- [ ] **Step 5: Run** `npx vitest run src/engine` → all pass. Then run `npm run build` and `npm run lint` → pass.
- [ ] **Step 6: Commit** `feat(engine): month-by-month four-phase simulation`

---

### Task 3: Engine — summary and verdict

**Files:**
- Create: `src/engine/summarize.ts`
- Modify: `src/engine/types.ts` (add `VerdictKind`, `Summary`)
- Test: `src/engine/summarize.test.ts`

**Interfaces:**
- Consumes: `simulate`, `phaseBounds`, `toMonths`, `TrajectoryPoint`
- Produces:
```ts
export type VerdictKind = 'short' | 'gap' | 'thin' | 'lasts' | 'never';
export interface Summary {
  verdict: VerdictKind;
  retirementMonth: number; pensionMonth: number; horizonMonth: number;
  targetMonth: number;            // toMonths(targetAge) − toMonths(currentAge)
  slackMonth: number;             // targetMonth + toMonths(slackYears)
  depletionMonth: number | null;  // first m with unmet > 0
  runwayMonths: number;           // (depletionMonth ?? horizonMonth) − retirementMonth
  balanceAtTarget: { nominal: number; real: number } | null; // trajectory[targetMonth], null if outside [0, horizonMonth]
  deficitAtTargetReal: number;    // Σ_{m < targetMonth} unmet_m / f_m
  gapShortfallReal: number;       // Σ_{m < pensionMonth} unmet_m / f_m
}
export function summarize(params: Params, trajectory: TrajectoryPoint[], p1MonthsOverride?: number): Summary;
```

Verdict rules (spec §8; `d = depletionMonth`):
- `d === null` → `'never'`
- `d ≥ slackMonth` → `'lasts'`
- `d ≥ targetMonth` → `'thin'`
- otherwise (d < targetMonth):
  - `'gap'` if all three hold:
    - `d < pensionMonth`
    - `pensionMonth < horizonMonth`
    - no month `m ≥ pensionMonth` has `unmet > 0`
  - else `'short'`

Note that `unmet_m` lives on point `k = m+1`.

- [ ] **Step 1: Write failing tests** (reuse `base` from `src/engine/fixtures.ts`). The "hand-checked gap example" is `{ ...base, startingCapital 1000, monthlySavings 100, monthlyWithdrawal 100, monthlyPension 100 }`. Export it as `gapExample`.
  - The hand-checked gap example → `verdict 'gap'`, `depletionMonth 34`, `gapShortfallReal 200`, `runwayMonths 22`.
  - The same example with `monthlyPension 50` → `'short'`.
  - Huge starting capital → `'never'`, `runwayMonths === horizonMonth − retirementMonth`.
  - Construct depletion at exactly `targetMonth` → `'thin'`. At exactly `slackMonth` → `'lasts'`.
  - `balanceAtTarget.nominal === trajectory[targetMonth].balance`.
  - `deficitAtTargetReal` equals the hand sum for a 0-inflation case.
- [ ] **Step 2: Run** `npx vitest run src/engine/summarize.test.ts` → FAIL.
- [ ] **Step 3: Implement** `summarize`.
- [ ] **Step 4: Run** → pass. Then run `npm run build` and `npm run lint`.
- [ ] **Step 5: Commit** `feat(engine): verdict and summary metrics`

---

### Task 4: Engine — validation, earliest-retirement solver, runScenario

**Files:**
- Create: `src/engine/validate.ts`, `src/engine/solver.ts`, `src/engine/index.ts`
- Test: `src/engine/validate.test.ts`, `src/engine/solver.test.ts`

**Interfaces:**
- Consumes: `firstUnmetMonth`, `phaseBounds`, `simulate`, `summarize`, `toMonths`
- Produces:
```ts
export type IssueCode = 'required' | 'negative' | 'rateOutOfRange' | 'targetNotAfterCurrent'
  | 'pensionNotAfterCurrent' | 'ageAboveHorizon' | 'phase3Negative';
export interface ValidationIssue { field: keyof Params | 'phase3'; code: IssueCode; }
export function validateParams(p: Params): ValidationIssue[];
export function findEarliestRetirementMonths(p: Params): number | null; // Phase 1 length in months
export interface ScenarioResult { trajectory: TrajectoryPoint[]; summary: Summary; earliestRetirementMonths: number | null; }
export function runScenario(p: Params): ScenarioResult; // precondition: validateParams(p).length === 0
// index.ts re-exports everything public from engine/*
```

Validation rules:
- Any numeric field NaN → `required`.
- Amounts or durations < 0 → `negative`. This covers `startingCapital`, `monthlyWithdrawal`, `monthlySavings`, `monthlyPension`, `p1Years`, `p2Years`, `slackYears`, and `currentAge`.
- Any `*Pct` < −99 → `rateOutOfRange`.
- `targetAge ≤ currentAge` → `targetNotAfterCurrent`.
- `pensionAge ≤ currentAge` → `pensionNotAfterCurrent`.
- `targetAge > 100` or `pensionAge > 100` → `ageAboveHorizon` on that field.
- `phaseBounds(p).p3 < 0` → `{ field: 'phase3', code: 'phase3Negative' }`.

Solver (spec §9):
- `maxP1 = toMonths(pensionAge) − toMonths(currentAge) − toMonths(p2Years)`. If `maxP1 < 0`, return null.
- Linear scan `p1 = 0..maxP1`. Return the first `p1` where `d === null || d ≥ slackMonth`, with `d = firstUnmetMonth(p, p1)`. Return null if none passes.
- It must not call `simulate` (performance).

- [ ] **Step 1: Write failing tests** `validate.test.ts`: one test per code, each asserting the exact `{field, code}`. The default-like fixture → `[]`. Review Focus 5: `targetAge 30, currentAge 38` → contains `targetNotAfterCurrent`; `pensionAge 38` → contains `pensionNotAfterCurrent`; `targetAge 120` → `ageAboveHorizon`.
- [ ] **Step 2: Write failing tests** `solver.test.ts`:
  - `'matches brute force'`: for a realistic fixture, the result `r` satisfies these, where `ok(n) = ['lasts','never'].includes(summarize(p, simulate(p, n), n).verdict)`:
    - `ok(r)` is true
    - `r === 0 || !ok(r − 1)` is true
  - `'null when unreachable'`: `monthlyWithdrawal` 1e12 → null.
  - `'maxP1 zero'`: `pensionAge = currentAge + p2Years` → result is 0 or null, and nothing throws.
  - `'runScenario wires everything'`: `runScenario(p).summary.verdict` equals `summarize(p, simulate(p)).verdict`, and `earliestRetirementMonths` equals the solver result.
- [ ] **Step 3: Run** `npx vitest run src/engine` → new tests FAIL.
- [ ] **Step 4: Implement** validate, solver, index.
- [ ] **Step 5: Run** → all pass. Then run `npm run build` and `npm run lint`.
- [ ] **Step 6: Commit** `feat(engine): validation and earliest-retirement solver`

---

### Task 5: Formatting, currency scale, defaults

**Files:**
- Create: `src/format/currency.ts`, `src/format/format.ts`, `src/state/defaults.ts`
- Test: `src/format/format.test.ts`, `src/state/defaults.test.ts`

**Interfaces:**
- Produces:
```ts
export type Lang = 'en' | 'es';
export const CURRENCIES: Currency[] = ['COP', 'USD', 'EUR', 'MXN'];
export const CURRENCY_SCALE: Record<Currency, number> = { USD: 1, EUR: 1, MXN: 20, COP: 4000 };
export function localeFor(lang: Lang): string; // 'es-CO' | 'en-US'
export function formatMoney(v: number, c: Currency, lang: Lang, opts?: { compact?: boolean }): string; // 0 decimals
export function formatAge(totalMonths: number, lang: Lang): string; // 'en' → "71 y 4 m", 'es' → "71 a 4 m"
export function formatMonthYear(startMonth: string, offsetMonths: number, lang: Lang): string; // "Mar 2070" / "mar 2070"
export function currentStartMonth(now?: Date): string; // 'YYYY-MM'
export function defaultParams(currency: Currency, startMonth: string): Params;
```
`Lang` lives in `format/currency.ts`, and i18n imports it from there.

`defaultParams` uses USD-base amounts × `CURRENCY_SCALE[currency]`:

| Field | Default |
|---|---|
| `startingCapital` | 20 000 |
| `monthlyWithdrawal` | 1 000 |
| `monthlySavings` | 500 |
| `monthlyPension` | 600 |
| `currentAge` | 38 |
| `targetAge` | 75 |
| `slackYears` | 5 |
| `inflationPct` | 5 |
| `p1Years` | 15 |
| `p1ReturnPct` | 8 |
| `savingsGrowWithInflation` | false |
| `p2Years` | 5 |
| `p2ReturnPct` | 7 |
| `p3ReturnPct` | 6 |
| `pensionAge` | 62 |

- [ ] **Step 1: Write failing tests**:
  - `formatMoney(412_000_000, 'COP', 'es')` contains `412.000.000`.
  - `formatMoney(1234.5, 'USD', 'en') === '$1,235'`.
  - Review Focus 3: `formatMoney(4e12, 'COP', 'es', { compact: true })` has length < 15 and contains `4`. Also `formatMoney(4e12, 'COP', 'es')` contains `4.000.000.000.000`.
  - `formatAge(71*12+4, 'en') === '71 y 4 m'`.
  - `formatMonthYear('2026-10', 12, 'en')` contains `2027`.
  - `currentStartMonth(new Date(2026, 9, 26)) === '2026-10'`.
  - `defaultParams('COP','2026-10').startingCapital === 80_000_000`.
  - `validateParams(defaultParams('USD','2026-10'))` is `[]`.
- [ ] **Step 2: Run** `npx vitest run src/format src/state` → FAIL.
- [ ] **Step 3: Implement** with `Intl.NumberFormat(localeFor(lang), { style: 'currency', currency, maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' })` and `Intl.DateTimeFormat(localeFor(lang), { month: 'short', year: 'numeric' })`.
- [ ] **Step 4: Run** → pass. Then run `npm run build` and `npm run lint`.
- [ ] **Step 5: Commit** `feat: money/age/date formatting and default params`

---

### Task 6: Internationalisation

**Files:**
- Create: `src/i18n/strings.ts`, `src/i18n/I18nContext.tsx`
- Test: `src/i18n/strings.test.ts`

**Interfaces:**
- Consumes: `Lang`
- Produces:
```ts
export const en = { /* key: 'English text with {placeholders}' */ } as const;
export type StringKey = keyof typeof en;
export const es: Record<StringKey, string>;
export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string;
export function useT(): (key: StringKey, vars?: Record<string, string | number>) => string; // language from useAppState() (Task 7); until Task 7 lands, accept lang via an I18nProvider prop
```
For `useT`, implement an `I18nProvider value={lang}`. Task 7's provider wraps it.

Required keys and exact EN copy (verdicts from spec §8; ES translations are the builder's):
- `verdict.short`: "Your money runs out at {age}, {years} years short of your target of {target}."
- `verdict.gap`: "Your savings run out at {age}, {gap} before your pension starts. You'd be short about {amount} (today's money) until then."
- `verdict.thin`: "Your money lasts until {age}, only {years} years beyond {target}, less than your {slack}-year safety margin."
- `verdict.lasts`: "Your money lasts until {age}, {years} years beyond your target of {target}."
- `verdict.never`: "Your money doesn't run out before age 100."
- `earliest.value`: "Earliest retirement: {age}"
- `earliest.none`: "Not reachable before your pension age with these settings."
- `earliest.use`: "Use this"
- `disclaimer`: the copy from Global Constraints
- `scenario.defaultName`: "Scenario {n}"
- `rate.suffix`: EN "% effective annual", ES "% EA"
- one key per field label, card title, tab, metric, validation issue code (`issue.<code>`), chart toggle, comparison empty state, mixed-currency note (`compare.hiddenCurrency`: "Hidden (different currency): {names}"), storage warning, and delete confirmation

- [ ] **Step 1: Write failing tests**:
  - `'es has every en key, non-empty'`
  - `'placeholders match'`: the set of `{x}` tokens per key is equal in en and es
  - `translate('en','verdict.short',{age:'71 y',years:4,target:75})` → exact string
  - a missing var leaves the `{token}` visible and does not throw
- [ ] **Step 2: Run** `npx vitest run src/i18n` → FAIL.
- [ ] **Step 3: Implement** the dictionaries, `translate`, the provider and `useT`.
- [ ] **Step 4: Run** → pass. Then run `npm run build` and `npm run lint`.
- [ ] **Step 5: Commit** `feat(i18n): Spanish and English dictionaries`

---

### Task 7: App state, persistence, provider

**Files:**
- Create: `src/state/reducer.ts`, `src/state/storage.ts`, `src/state/selectors.ts`, `src/state/AppStateContext.tsx`
- Modify: `src/main.tsx` (wrap in provider)
- Test: `src/state/reducer.test.ts`, `src/state/storage.test.ts`, `src/state/selectors.test.ts`

**Interfaces:**
- Consumes: `runScenario`, `validateParams`, `ENGINE_VERSION`, `defaultParams`, `currentStartMonth`, `I18nProvider`
- Produces:
```ts
export interface Scenario { id: string; name: string; createdAt: string; color: string; params: Params; engineVersion: number; result: ScenarioResult; }
export type ChartMode = 'real' | 'nominal';
export type Tab = 'config' | 'compare';
export interface AppState {
  params: Params; scenarios: Scenario[]; selectedIds: string[];
  language: Lang; chartMode: ChartMode; activeTab: Tab; nextColorIndex: number;
}
export type Action =
  | { type: 'setParam'; key: keyof Params; value: Params[keyof Params] }
  | { type: 'setParams'; params: Partial<Params> }
  | { type: 'setCurrency'; currency: Currency }
  | { type: 'saveScenario'; id: string; createdAt: string; name: string }
  | { type: 'deleteScenario'; id: string }
  | { type: 'toggleSelected'; id: string }
  | { type: 'loadScenario'; id: string; startMonth: string }
  | { type: 'setLanguage'; language: Lang }
  | { type: 'setChartMode'; mode: ChartMode }
  | { type: 'setTab'; tab: Tab };
export function reducer(s: AppState, a: Action): AppState;
export function initialState(lang: Lang, startMonth: string): AppState; // chartMode 'real', tab 'config', currency 'COP'
export const PALETTE: string[]; // 8 distinct colours
export function partitionByCurrency(scenarios: Scenario[], selectedIds: string[]): { plotted: Scenario[]; hidden: Scenario[] };
export const STORAGE_KEY = 'runway-sim:v1';
export function loadState(storage: Storage | undefined, lang: Lang, startMonth: string): AppState;
export function saveState(storage: Storage | undefined, s: AppState): boolean; // false on any throw
export function AppStateProvider(props: { children: ReactNode }): JSX.Element;
export function useAppState(): { state: AppState; dispatch: Dispatch<Action>; storageWarning: boolean };
export function useActiveResult(): { issues: ValidationIssue[]; result: ScenarioResult | null }; // memoised on state.params
```

Reducer rules:
- `saveScenario`:
  - If `validateParams(s.params)` is non-empty, return `s` unchanged.
  - Otherwise:
    - `snapshot = structuredClone(s.params)`
    - append `{ id, name, createdAt, color: PALETTE[s.nextColorIndex % PALETTE.length], params: snapshot, engineVersion: ENGINE_VERSION, result: runScenario(snapshot) }`
    - add `id` to `selectedIds`
    - increment `nextColorIndex`
  - The caller generates `id` (`crypto.randomUUID()`), `createdAt`, and the fallback name, so the reducer stays pure.
- `deleteScenario` removes the scenario and its id from `selectedIds`.
- `setCurrency` changes `params.currency` only.
- `loadScenario` sets `params = { ...structuredClone(sc.params), startMonth }` and `activeTab: 'config'`.
- No action mutates a stored scenario.

Storage rules:
- Persisted shape: `{ schemaVersion: 1, params, scenarios, selectedIds, language, chartMode, nextColorIndex }`. `activeTab` is not persisted.
- `loadState`:
  - re-anchors `params.startMonth` to `startMonth`
  - recomputes `result` for any scenario whose `engineVersion !== ENGINE_VERSION`, using its own stored params and `startMonth`, and updates `engineVersion`
  - falls back to `initialState` when anything is missing, unparsable, has the wrong schemaVersion, or throws
- `AppStateProvider`:
  - `useReducer(reducer, undefined, () => loadState(safeLocalStorage(), detectLang(), currentStartMonth()))`
  - The persistence effect skips saving while `state` is still the initial state object (keep a ref to it). This is StrictMode-safe and means corrupt storage isn't overwritten until the user changes something.
  - Sets `storageWarning` when `saveState` returns false.

- [ ] **Step 1: Write failing tests** `reducer.test.ts`:
  - `'save snapshots params and later edits do not change it'`:
    - dispatch save, then `setParam startingCapital 1`
    - the scenario's `params.startingCapital` and `result.trajectory[0].balance` still equal the original values
  - `'save appends, selects, assigns stable distinct colours'`: save twice, giving 2 scenarios, both ids selected, and different colours.
  - `'save is a no-op when invalid'`: with `pensionAge = currentAge`, the state is returned as the same reference.
  - `'delete removes from selection'`.
  - `'toggleSelected adds and removes'`.
  - `'setCurrency relabels without converting'`: `startingCapital` unchanged.
  - `'loadScenario copies params, re-anchors startMonth, switches tab'`: mutating the loaded params later doesn't affect the scenario.
- [ ] **Step 2: Write failing tests** `storage.test.ts`:
  - round-trip: `saveState` then `loadState` gives equal scenarios and selection
  - `startMonth` is re-anchored on load
  - a scenario with `engineVersion: 0` and a tampered trajectory gets recomputed
  - corrupt JSON → initial state
  - Review Focus 4: a storage whose `getItem`/`setItem` throw → `loadState` returns the initial state, and `saveState` returns false without throwing
  - `storage` undefined → same behaviour
- [ ] **Step 3: Write failing tests** `selectors.test.ts`:
  - `partitionByCurrency` plots only the currency of the first id in `selectedIds` and hides the others
  - it preserves `selectedIds` order
  - unknown ids are ignored
- [ ] **Step 4: Run** `npx vitest run src/state` → FAIL.
- [ ] **Step 5: Implement** the reducer, storage, selectors and provider. Wire `<AppStateProvider>` in `main.tsx` and have it render `<I18nProvider value={state.language}>`. Then update `App.test.tsx` to render inside the provider.
- [ ] **Step 6: Run** `npm test`, `npm run build`, `npm run lint` → pass.
- [ ] **Step 7: Commit** `feat(state): reducer, scenario snapshots, localStorage persistence`

---

### Task 8: Configuration inputs

**Files:**
- Create: `src/components/config/ParamField.tsx`, `src/components/config/ParamCards.tsx`, `src/components/config/SaveScenarioBar.tsx`
- Test: `src/components/config/ParamField.test.tsx`, `src/components/config/SaveScenarioBar.test.tsx`

**Interfaces:**
- Consumes: `useAppState`, `useActiveResult`, `useT`, `CURRENCY_SCALE`, `phaseBounds`, `formatAge`
- Produces:
```ts
export function parseLocaleNumber(text: string): number; // '' → NaN; accepts ',' or '.' decimal; strips spaces/thousands dots only when a comma decimal is present
export function ParamField(props: { id: string; label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; suffix?: string; error?: string }): JSX.Element;
export function GlobalCard(): JSX.Element; export function Phase1Card(): JSX.Element; export function Phase2Card(): JSX.Element;
export function Phase3Card(): JSX.Element; export function Phase4Card(): JSX.Element;
export function SaveScenarioBar(): JSX.Element;
```

`ParamField` UI and behaviour:
- Renders a labelled `<input type="range">` plus a text input with `inputMode="decimal"`.
- The text input keeps local text state while typing and calls `onChange(parseLocaleNumber(text))` on every edit.
- When the `value` prop changes from outside (slider or load), the text resyncs.
- Values outside `[min, max]` are kept as typed; the slider just pins at its end.
- `error` renders below the field with `role="alert"`.

The cards dispatch `setParam`. Field groups follow spec §6.
- Money slider ranges are USD-base × `CURRENCY_SCALE[params.currency]`:

  | Field | Range | Step |
  |---|---|---|
  | `startingCapital` | 0–2 000 000 | 1 000 |
  | `monthlyWithdrawal` | 0–20 000 | 50 |
  | `monthlySavings` | 0–20 000 | 50 |
  | `monthlyPension` | 0–20 000 | 50 |

- Other ranges:

  | Field | Range | Step |
  |---|---|---|
  | ages | 18–100 | 1 |
  | `slackYears` | 0–20 | 1 |
  | durations | 0–40 | 0.5 |
  | rates | −10 to 20 | 0.1 |
  | inflation | 0–20 | 0.1 |

- Phase 3 card shows the derived duration via `formatAge(phaseBounds(params).p3, lang)` (read-only), or the `issue.phase3Negative` text.
- Phase 1 card has the `savingsGrowWithInflation` checkbox.
- Each field's `error` comes from `useActiveResult().issues` for that field, mapped through `t('issue.' + code)`.

`SaveScenarioBar`:
- A name text input and a Save button. The button is `disabled` when `issues.length > 0`.
- On click:
  - dispatch `saveScenario` with `id: crypto.randomUUID()`, `createdAt: new Date().toISOString()`, and `name: draft.trim() || t('scenario.defaultName', { n: scenarios.length + 1 })`
  - then clear the draft
- Enter in the name input also saves.

- [ ] **Step 1: Write failing tests** `ParamField.test.tsx`:
  - Review Focus 1:
    - `parseLocaleNumber('5,5') === 5.5`
    - `parseLocaleNumber('1.234.567,8') === 1234567.8`
    - `parseLocaleNumber('1234.5') === 1234.5`
    - `Number.isNaN(parseLocaleNumber(''))`
  - Typing `7,5` in the text input calls `onChange(7.5)`.
  - Clearing the input calls `onChange(NaN)` without throwing.
  - A rerender with a new `value` updates the text input.
  - `error` renders as an alert.
- [ ] **Step 2: Write failing tests** `SaveScenarioBar.test.tsx`, rendered inside `AppStateProvider`:
  - typing "Retire at 55" and clicking Save leaves the input empty and the state with 1 scenario named "Retire at 55"
  - an empty name saves as `Scenario 1`
  - the button is disabled when pension age is invalid (set via a `setParam` dispatch helper or a field change)
- [ ] **Step 3: Run** `npx vitest run src/components/config` → FAIL.
- [ ] **Step 4: Implement** the field, cards and save bar.
- [ ] **Step 5: Run** `npm test`, `npm run build`, `npm run lint` → pass.
- [ ] **Step 6: Commit** `feat(ui): parameter cards and save-scenario bar`

---

### Task 9: Results panel — verdict, metrics, chart

**Files:**
- Create: `src/components/results/chartData.ts`, `src/components/results/RunwayChart.tsx`, `src/components/results/VerdictBanner.tsx`, `src/components/results/MetricsRow.tsx`
- Test: `src/components/results/chartData.test.ts`, `src/components/results/VerdictBanner.test.tsx`

**Interfaces:**
- Consumes: `ScenarioResult`, `Params`, `phaseBounds`, `formatMoney`, `formatAge`, `formatMonthYear`, `useT`, `useAppState`, `useActiveResult`
- Produces:
```ts
export interface ChartSeries { id: string; name: string; color: string; points: { age: number; value: number }[]; }
export interface Marker { age: number; label: string; }
export function toChartSeries(id: string, name: string, color: string, result: ScenarioResult, mode: ChartMode): ChartSeries;
export function phaseMarkers(p: Params): Marker[]; // ①②③④ at the start age of each phase with length > 0: currentAge, +p1/12, +(p1+p2)/12, pensionAge
export function RunwayChart(props: { series: ChartSeries[]; markers: Marker[]; targetAges: number[];
  currency: Currency; lang: Lang; mode: ChartMode; onModeChange: (m: ChartMode) => void }): JSX.Element;
export function VerdictBanner(props: { params: Params; result: ScenarioResult; onUseEarliest: (p1Months: number) => void }): JSX.Element;
export function MetricsRow(props: { params: Params; result: ScenarioResult }): JSX.Element;
```

`RunwayChart`:
- Recharts `LineChart` inside a `ResponsiveContainer`.
- `XAxis type="number" dataKey="age" domain={['dataMin', 100]}`. Each `<Line>` gets its own `data`, `dataKey="value"`, `dot={false}`, `isAnimationActive={false}`.
- Y axis ticks use `formatMoney(…, { compact: true })`.
- Tooltip shows `formatAge` + `formatMonthYear` + full money.
- One dashed `ReferenceLine` per marker, labelled with the circled digit.
- One distinct-style `ReferenceLine` per distinct target age, labelled with the target text.
- A two-button Today's money / Nominal toggle that calls `onModeChange`.
- `toChartSeries` maps `mode 'real'` → `balanceReal` and `'nominal'` → `balance`, with `age` from the point.

`VerdictBanner`:
- Colour by verdict: red for `short`/`gap`, amber for `thin`, green for `lasts`/`never`.
- Copy from the `verdict.*` keys. Ages are formatted with `formatAge(toMonths(currentAge) + month)`, and money in today's terms via `formatMoney`.
- Below the verdict, the earliest-retirement line: `earliest.value` with the age = `toMonths(currentAge) + earliestRetirementMonths`, or `earliest.none`.
- The "Use this" button calls `onUseEarliest(earliestRetirementMonths)`. It is hidden when that equals the current P1 months.

`MetricsRow` (spec §8):
- retirement age
- pension age
- runway months, shown as `{n}+` when the verdict is `never`
- depletion age + `formatMonthYear`, or "—"
- balance at target: real primary, nominal secondary. When depleted before target, show `deficitAtTargetReal` as a deficit instead.

- [ ] **Step 1: Write failing tests** `chartData.test.ts`:
  - `toChartSeries` 'real' picks `balanceReal`, 'nominal' picks `balance`, and the length equals the trajectory length
  - `phaseMarkers` for currentAge 38, p1 15, p2 5, pension 62 → ages `[38, 53, 58, 62]` with labels `['①','②','③','④']`
  - with p3 = 0, ③ is omitted
- [ ] **Step 2: Write failing tests** `VerdictBanner.test.tsx`, inside providers, English:
  - the hand-checked gap fixture shows text containing "before your pension starts"
  - the `never` fixture shows "doesn't run out before age 100"
  - clicking "Use this" calls `onUseEarliest` with the solver value
- [ ] **Step 3: Run** `npx vitest run src/components/results` → FAIL.
- [ ] **Step 4: Implement** chart data, chart, banner and metrics.
- [ ] **Step 5: Run** `npm test`, `npm run build`, `npm run lint` → pass.
- [ ] **Step 6: Commit** `feat(ui): verdict banner, metrics, runway chart`

---

### Task 10: Comparison Dashboard

**Files:**
- Create: `src/components/compare/ScenarioList.tsx`, `src/components/compare/ComparisonTable.tsx`, `src/components/compare/CompareTab.tsx`
- Test: `src/components/compare/CompareTab.test.tsx`

**Interfaces:**
- Consumes: `useAppState`, `partitionByCurrency`, `toChartSeries`, `RunwayChart`, `formatAge`, `formatMoney`, `useT`
- Produces: `export function CompareTab(): JSX.Element;` (ScenarioList and ComparisonTable are internal to this folder).

Behaviour (spec §10, Comparison):
- **ScenarioList** shows one row per scenario in creation order:
  - a checkbox (dispatches `toggleSelected`)
  - a colour swatch
  - the name and currency code
  - a "Load" button (dispatches `loadScenario` with `currentStartMonth()`)
  - a "Delete" button (`window.confirm(t('compare.confirmDelete', {name}))`, then `deleteScenario`)
- **Chart:**
  - `series` comes from `partitionByCurrency(...).plotted`, built with `toChartSeries`
  - no phase markers
  - `targetAges` = the distinct `params.targetAge` values of the plotted scenarios
  - the currency is that of the first plotted scenario
  - `compare.hiddenCurrency` is shown when `hidden` is non-empty
- **ComparisonTable** covers all selected scenarios. Columns:
  - name
  - verdict (short label + colour dot)
  - retirement age
  - earliest retirement age
  - depletion age or "—"
  - balance at target, real, in the scenario's own currency
- **Empty state:** `compare.empty` text plus a button that dispatches `setTab 'config'`.

- [ ] **Step 1: Write failing tests** `CompareTab.test.tsx`. Seed the state by dispatching `saveScenario` through a small test harness component.
  - The empty state renders with no scenarios.
  - Two saved scenarios → two checkboxes, both checked, and two table rows.
  - Unchecking one removes its table row.
  - Delete (with `confirm` mocked → true) removes the row and its checkbox.
  - A COP and a USD scenario both checked → the `hiddenCurrency` note names the second.
  - Load → `activeTab` becomes `'config'` and `params.startingCapital` equals the scenario's value.
- [ ] **Step 2: Run** `npx vitest run src/components/compare` → FAIL.
- [ ] **Step 3: Implement** the list, table and tab.
- [ ] **Step 4: Run** `npm test`, `npm run build`, `npm run lint` → pass.
- [ ] **Step 5: Commit** `feat(ui): comparison dashboard with multi-select overlay`

---

### Task 11: App shell, layout, end-to-end check, README, push

**Files:**
- Create: `src/components/Header.tsx`, `src/components/config/ConfigTab.tsx`, `README.md`
- Modify: `src/App.tsx`, `src/App.test.tsx`, `index.html` (title "Runway Simulator", `lang` attribute updated from state)

**Interfaces:**
- Consumes: everything above.

Header and layout:
- **Header:** title, two tab buttons (`role="tab"`, `aria-selected`) dispatching `setTab`, an ES|EN toggle (`setLanguage`), and a currency `<select>` over `CURRENCIES` (`setCurrency`).
- **ConfigTab** uses the side-by-side layout chosen by the owner:
  - `lg:` two columns.
  - The left column holds the five cards, then `SaveScenarioBar`.
  - The right column is `lg:sticky lg:top-4`. It holds `VerdictBanner` (`onUseEarliest` → `setParam p1Years = months/12`), `MetricsRow`, and `RunwayChart` with a single series from the active result, `phaseMarkers(params)`, `[params.targetAge]`, and the disclaimer.
  - Below `lg`, the right column renders first (CSS `order`).
  - When `issues.length > 0`, the right column shows an error summary listing `t('issue.'+code)` instead of the banner, metrics and chart.
- Set `document.documentElement.lang` from state in an effect.
- When `storageWarning` is true, show a dismissible non-blocking notice under the header using the storage warning key from Task 6.

- [ ] **Step 1: Write failing integration test** `App.test.tsx` (`'save flow keeps pre-calculated trajectory'`):
  - render `<AppStateProvider><App/></AppStateProvider>` in English
  - type "Retire at 55" in the scenario-name input → click Save → the input is empty
  - change the starting capital text input to `1`
  - click the "Comparison Dashboard" tab → the "Retire at 55" checkbox is checked, and the table's balance-at-target cell is unchanged from the value captured before the edit (read via the active metrics before editing)
  - click ES → the tab labels render in Spanish
- [ ] **Step 2: Write failing test** `'invalid inputs hide results and disable save'`: set pension age to 38 → no verdict banner, the error summary is shown, and Save is disabled.
- [ ] **Step 3: Run** `npm test` → FAIL.
- [ ] **Step 4: Implement** the header, config tab and app shell.
- [ ] **Step 5: Run** `npm test`, `npm run build`, `npm run lint` → all pass.
- [ ] **Step 6: Manual check**
  - Run `npm run dev` and open it in a browser at desktop width and at ~375 px:
    - slider drags stay smooth
    - phase markers and the target line show
    - save → compare overlays lines
    - refresh keeps the scenarios
    - switching language and currency works
  - Run `npm run preview` → the built bundle works.
  - Fix anything found, then rerun Step 5.
- [ ] **Step 7: README.md**: what it is, the disclaimer, the four phases in one line each, `npm install`, `npm run dev`, `npm test`, `npm run build`, and a note that `dist/` can be served from any static host or CDN.
- [ ] **Step 8: Commit** `feat: app shell, bilingual header, side-by-side config layout`
- [ ] **Step 9: Push** (the owner authorised pushing once everything is complete): `git push -u origin main` → the branch is set to track `origin/main`.
