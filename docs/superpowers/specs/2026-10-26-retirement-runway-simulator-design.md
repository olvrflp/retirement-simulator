# Retirement Runway Simulator — Design

Date: 2026-10-26
Owner: Oliver Felipe Idárraga Gómez

Markers used below: **[decided]** = the owner decided it; **[my call]** = the designer's choice, open to the owner's veto; **[builder]** = left to the builder.

## 1. Intent and the why

The owner is 38, takes retirement seriously for the first time, and doesn't yet know *when* they can retire. The tool's job is to answer that: "with my money, savings, returns, inflation and pension, at what age can I stop working without running out of money before I die — with some slack in case I live longer?"

It is first for the owner's own planning and will later be made public, so nothing may be hard-wired to the owner's situation, and it must be understandable by people who aren't the owner (Colombians first, but in both Spanish and English).

Success looks like: the owner moves a few dials (years until retirement, spending, pension age) and immediately sees (a) a plain verdict on whether the money lasts to their target age, (b) the earliest age they could retire, and (c) can save variants and compare them on one chart.

## 2. Goals

1. A deterministic month-by-month simulation over four contiguous retirement-life phases.
2. A live verdict and **earliest retirement age** answer.
3. Saved scenarios, compared as overlaid lines on one chart.
4. Spanish and English UI; user-selectable currency formatting.
5. Runs locally or as a static bundle on any CDN/static host.

## 3. Non-goals (v1)

- Monte Carlo / probabilistic returns. "High uncertainty" in Phase 3 is just a separate fixed rate the user can set pessimistically.
- Taxes, fees, multiple accounts, lump-sum events, one-off expenses.
- Currency conversion (currency selection only changes formatting).
- User accounts, servers, cloud sync, sharing links.
- Deployment automation (the app must *build* to static files; publishing is a later step).

## 4. Anti-goals (would be failure even if it "works")

- **Withdrawals not keeping up with cost of living.** Spending is entered in today's money and must be inflated from today, not from the retirement date. (The original brief inflated from retirement start; the owner confirmed that understates real spending.) **[decided]**
- **Losing saved scenarios** on refresh, re-render, or tab switch, or a saved scenario's chart line changing when the user later edits inputs.
- **Silently nonsensical results**, e.g. a negative Phase 3 duration, being charted as if valid.
- **Presenting numbers as advice.** Public users need a visible "educational estimate, not financial advice" note. **[my call]**

## 5. Constraints and stack

- **React app built with Vite**, TypeScript, Tailwind CSS, Recharts. Output is a static bundle usable locally (`vite preview` / open built files) or from a CDN/static host such as GitHub Pages or Vercel. **[decided]** (Not a single CDN-scripted HTML file — the owner rejected that.) TypeScript is **[my call]**.
- The simulation engine and solver are **pure functions in their own module**, with no React imports, unit-tested. **[my call]**
- Saved scenarios and UI preferences persist in the browser's `localStorage`. **[my call]**
- Must be responsive; usable on a phone.

## 6. Inputs

All amounts are in the selected currency. "Today's money" means purchasing power as of the simulation start (the current month).

### Global / "You"
| Field | Default | Notes |
|---|---|---|
| Current age (years) | 38 | **[decided]** input. Integer. |
| Target age (planning life expectancy) | 75 | **[decided]**. Replaces the brief's hard-coded "age 85". |
| Safety slack (years) | 5 | **[my call]** default; used by the earliest-retirement solver. |
| Starting capital | builder picks a reasonable example | Balance at month 0. |
| Monthly spending / withdrawal (today's money) | example | Inflated from month 0. **[decided]** |
| Annual inflation (%) | e.g. 5 | Converted to monthly factor. |

### Phase 1 — Accumulation (working, saving)
| Field | Notes |
|---|---|
| Duration (years) | **[decided]** years, not a fixed age. Allow 0.5-year steps in slider; numeric input accepts any value ≥ 0 rounded to whole months. **[my call]** |
| Return (% EA) | |
| Monthly savings | Flat nominal by default. |
| "Grow savings with inflation" toggle | Off by default. **[my call]** |

### Phase 2 — Early retirement, high-certainty returns
| Field | Notes |
|---|---|
| Duration (years) | **[decided]** years (brief said months; owner moved to years). Same step/rounding as Phase 1. |
| Fixed return (% EA) | |

### Phase 3 — Mid retirement, high-uncertainty returns
| Field | Notes |
|---|---|
| Variable return (% EA) | |
| Duration | **Derived, not an input. [decided]** `pensionAge − currentAge − P1 − P2` (in months). Displayed read-only on the card. |

### Phase 4 — Pension
| Field | Notes |
|---|---|
| Pension age (years) | **[decided]** configurable input; default 62. |
| Monthly pension (today's money) | Indexed to inflation from month 0, like spending. **[my call]** (Owner confirmed inflation for withdrawals; pension indexing was proposed and not objected to.) |

Phase 4 uses the Phase 3 return rate (per brief).

### Validation
- If derived Phase 3 duration < 0 (i.e. retirement + Phase 2 runs past pension age), show an inline error on the Phase 3 card explaining which inputs conflict, hide the verdict/metrics/chart for the active configuration, and disable "Save scenario". **[my call]**
- Phase 3 duration of exactly 0 is valid (Phase 2 hands straight to pension).
- Ages, durations, rates: reject NaN/empty; rates may be negative (down to −99%) **[my call]**; amounts ≥ 0.
- Pension age must be > current age.

## 7. Simulation engine

### Conversions
- Monthly rate from annual effective: `i_m = (1 + EA)^(1/12) − 1` for each of r1, r2, r3 and inflation.

### Timeline
- Month index `t = 0, 1, 2, …`, where `t = 0` is the current month at the user's current age.
- Phase boundaries in months: `P1 = round(p1Years·12)`, `P2 = round(p2Years·12)`, `P3 = pensionAge·12 − currentAge·12 − P1 − P2`.
- Phase 1: `t ∈ [0, P1)`, Phase 2: `[P1, P1+P2)`, Phase 3: `[P1+P2, P1+P2+P3)`, Phase 4: from `P1+P2+P3` to the horizon.
- **Horizon: age 100** (fixed, not configurable in v1). **[my call]** Used so the app can distinguish "runs out late" from "never runs out".
- Ending balance of each phase is the starting balance of the next (falls out naturally from one continuous loop).

### Inflation
- `infl_t = (1 + i_inf)^t`.
- Withdrawal in month t: `W_t = W0 · infl_t`. **[decided]** (inflated from today.)
- Pension in month t: `Pen_t = Pen0 · infl_t`. **[my call]**
- Savings in month t: `S` flat, or `S · infl_t` if the toggle is on.

### Per-month update (order of operations follows the brief: cash flow at the start of the month, then growth)
- Phase 1: `B_t = (B_{t−1} + S_t) · (1 + i_m1)`. No withdrawals.
- Phase 2: `B_t = (B_{t−1} − W_t) · (1 + i_m2)`.
- Phase 3: `B_t = (B_{t−1} − W_t) · (1 + i_m3)`.
- Phase 4: `net_t = max(0, W_t − Pen_t)`; `B_t = (B_{t−1} − net_t) · (1 + i_m3)`. Any pension surplus over spending is **not** added to the balance (per brief's `max(0, …)`).

### Depletion
- If in a withdrawal month `B_{t−1} − withdrawal < 0`, the balance becomes 0, that month is the **depletion month**, and the unmet amount is recorded as a shortfall.
- After depletion the balance stays at 0 for the rest of the horizon (no growth on zero; pension surplus isn't saved). Continue emitting months to the horizon so lines and ages remain comparable; record per-month unmet spending (`W_t − Pen_t` in Phase 4, `W_t` in Phases 2–3). **[my call]**
- A negative-return Phase 1 can't deplete (no withdrawals); if contributions are 0 and balance is 0 that's fine.

### Output per month (trajectory point)
`{ t, age (years, fractional), phase (1–4), balance (nominal), balanceReal (= balance / infl_t), withdrawal, pension, netWithdrawal, unmet }`

## 8. Results and verdict

Computed live from the active inputs:

- **Verdict** (prominent, colour-coded). Tiers include the safety slack so the verdict and the solver agree. **[my call]**
  - 🔴 Runs out before target age: "Your money runs out at {age}, {n} years short of your target of {target}."
  - 🔴 **Gap before pension** (savings deplete before pension age, and from then on the pension fully covers spending, so unmet spending is confined to the pre-pension gap). It is still a failure for the verdict and the solver. **[decided]** The owner's reasoning: you can't go months with no money, and real pensions replace only ~60–70% of income. Copy: "Your savings run out at {age}, {n} before your pension starts. You'd be short about {amount, today's money} until then." This only changes the wording; the tier stays red.
  - In general, any month with unmet spending before target + slack counts as failure. **[decided]**
  - 🟡 Lasts past target but runs out within the slack window (before target + slack): "Your money lasts until {age}, only {n} years beyond {target}, less than your {slack}-year safety margin."
  - 🟢 Lasts past target + slack (including never running out before 100). Copy distinguishes "lasts until {age}" from "doesn't run out before 100".
- **Earliest retirement age** (headline; see §9).
- **Key metrics**:
  - Retirement age (= current age + Phase 1).
  - Pension age.
  - Total months of retirement runway (months from retirement start until depletion; or "100+" / until horizon if not depleted).
  - Depletion age (years + months) and calendar month/year (from today's date), if applicable.
  - Balance at target age — shown in today's money with nominal secondary **[my call]**. If depleted before target, instead show cumulative unmet spending between depletion and target, in today's money (the "deficit").
- Age display: "71 y 4 m" / "71 a 4 m" style. **[builder]** exact format.

## 9. Earliest retirement age solver

**[decided]** in v1. Definition:

- Vary **only** Phase 1 duration, in whole months, from 0 up to the maximum that keeps Phase 3 ≥ 0 (`pensionAge·12 − currentAge·12 − P2`). Phase 2 length and pension age stay as set; Phase 3 shrinks/grows to fit.
- Success criterion: the money does not deplete before `target age + slack` (or never depletes within the horizon).
- Answer = current age + the smallest successful Phase 1. Use a **linear scan from 0 upward** (≤ ~750 runs × ≤ ~750 months — cheap) rather than binary search, because success is not guaranteed to be monotonic in Phase 1 length when Phase 1 returns are lower than Phase 3 returns. **[my call]**
- If no Phase 1 length succeeds: "Not reachable before your pension age with these settings."
- Show the result as an age ("53 y 4 m") and a one-click "Use this" action that sets Phase 1 to that value. **[my call]**
- Recompute whenever inputs change; if needed, debounce or memoize so slider drags stay smooth. **[builder]**

## 10. UI

Layout chosen by the owner: **side-by-side (option A)**. **[decided]**

### Header
App title; tabs **"Parameter Configuration"** and **"Comparison Dashboard"** (translated); ES | EN switch; currency selector.

### Parameter Configuration tab
- **Left column:** input cards — "You & global", ① Accumulation, ② Early retirement, ③ Mid retirement (rate + derived duration read-only), ④ Pension. Each numeric field: slider + numeric input kept in sync **[my call]**; builder picks sensible slider ranges. Below the cards: "Scenario name" text input + "Save scenario" button.
- **Right column (sticky on desktop):** verdict banner with earliest-retirement age, metrics row, primary chart.
- **Phone:** stacks with results first, then inputs. **[my call]**
- Disclaimer line (educational estimate, not financial advice). **[my call]**

### Primary chart (Recharts)
- X axis: age (years; tooltip shows age in years+months and calendar date). Using age rather than month index lets scenarios with different current ages line up in comparison mode. **[my call]**
- Y axis: total capital.
- **Nominal | Today's money** toggle; default **Today's money** **[my call]** (nominal balances decades out look huge and mislead).
- Vertical reference lines at each phase boundary (labelled ①②③④), plus a reference line at target age. Optional light background shading per phase **[builder]**.

### Comparison Dashboard tab
- **Left:** checklist of saved scenarios, each with a colour swatch, name, delete (with confirm) and "load into Configuration" action. **[my call]** on delete/load — beyond the brief, owner didn't object.
- **Right:** one shared chart with one line per checked scenario in its colour, same Nominal/Today's-money toggle, target-age reference line (each scenario's own target; if they differ, draw lines per distinct target) **[builder]** on the multiple-target rendering.
- Below the chart: a table of checked scenarios — name, verdict, retirement age, earliest retirement age, depletion age, balance at target. **[my call]**
- Checking/unchecking adds/removes the line instantly. Newly saved scenarios start checked. **[my call]**
- Empty state when nothing is saved, pointing back to the Configuration tab.

## 11. Scenarios: state and persistence

### Scenario object
```
{
  id: string            // crypto.randomUUID()
  name: string          // user-entered; if blank, auto "Scenario N" [my call]
  createdAt: ISO string
  color: string         // assigned at save time from a fixed palette, stable forever
  params: Params        // deep snapshot of all inputs
  engineVersion: number
  result: {
    trajectory: TrajectoryPoint[]
    summary: { verdict, retirementAge, pensionAge, depletionMonth|null, runwayMonths, balanceAtTarget, deficitAtTarget, earliestRetirementMonths|null }
  }
}
```
Duplicate names are allowed (identity is the id).

`Params` includes `currency` and `startMonth` (YYYY-MM) in addition to the inputs in §6.

### Currency belongs to the scenario **[my call]**
- The header currency selector sets the currency of the *active* inputs. Switching it relabels amounts; it never converts them.
- Slider ranges and example defaults scale per currency through a per-currency scale table (e.g. COP ≈ 4,000× USD). Switching currency keeps the amounts already entered and only rescales slider ranges. If an entered value falls outside the new range, it stays as entered and the slider pins at its end.
- A saved scenario keeps its own currency forever and shows it in the checklist and table.
- Comparison chart: when the checked scenarios use more than one currency, plot only the scenarios in the currency of the first-checked scenario and show a note listing the hidden ones. Mixing currencies on one money axis would be meaningless. The table still lists every checked scenario with its own currency.

### What "today" means **[my call]**
- A saved scenario is anchored to `startMonth`, the month it was saved. Its ages, dates and "today's money" values never shift afterwards.
- Active inputs persisted across visits are re-anchored to the current month on load, because the user is editing a live plan. The app doesn't auto-increment current age; the user updates it.
- "Load into Configuration" copies the scenario's params and re-anchors `startMonth` to the current month.
- An engine-version recompute uses the scenario's stored `startMonth`.
- In comparison mode, "today's money" means each scenario's own start month. The difference is negligible over the months-to-years between saves, so no cross-scenario rebasing.

### Save flow and correctness requirements
- On click, take a deep copy of the **current committed input state** (not a stale closure), run the engine + solver on that copy, build the scenario, and append with a functional state update (`setScenarios(prev => [...prev, s])`). Then clear the name input.
- Saved scenarios are immutable: editing inputs afterwards must never change a saved scenario's params, trajectory, or line.
- Saving is disabled while inputs are invalid.
- Selection (which scenarios are checked) is stored by id, separate from the scenario list; deleting a scenario also removes its id from the selection.
- Chart data for comparison is derived (memoized) from the scenarios + selection; never mutate stored trajectories in place.
- Keys in lists and chart series use scenario ids, never array indices.

### Persistence
- `localStorage` key with a schema version, e.g. `runway-sim:v1`, storing scenarios, selection, active params, language, currency, chart mode. **[my call]** that active params persist too, so a refresh doesn't reset your inputs.
- On load: if a scenario's `engineVersion` differs from the current engine, recompute its result from its stored params (params are the source of truth; the cached trajectory is a cache). Corrupt/unreadable storage → start fresh without crashing, and don't overwrite it until the user makes a change. **[my call]**
- Storage size: ~1,000 months × ~10 numbers per scenario is fine for dozens of scenarios; if a write fails (quota), show a non-blocking warning. **[builder]** whether to store trajectory at all vs. recompute on load — either is acceptable as long as the behaviour above holds.

## 12. Language and currency

- **Spanish and English** UI, toggle in header. **[decided]** Default from browser language (Spanish if `es-*`, else English). **[my call]**
- All UI strings come from a translation dictionary; no hard-coded copy in components. Library choice **[builder]** (a small in-house dictionary is fine).
- Currency selector: COP, USD, EUR, MXN at least **[my call]**; formatting only, no conversion. Default COP. Use `Intl.NumberFormat` with the UI locale; compact notation (e.g. "$412 M") on chart axes. **[builder]** exact formatting.
- Rate labels use "% EA" in Spanish and "% effective annual" in English. **[my call]**

## 13. Testing

- Engine: unit tests for rate conversion, each phase formula, phase hand-offs, inflation from month 0, depletion month and post-depletion behaviour, pension covering spending, Phase 3 = 0, invalid Phase 3 < 0, a hand-checked small example.
- Solver: finds the boundary month, returns null when unreachable, handles P1 max = 0.
- Scenarios: saving snapshots params (later edits don't change the saved scenario), name clears, ids unique, selection survives delete, persistence round-trip and engine-version recompute, corrupt storage doesn't crash.
- Test runner: Vitest + React Testing Library. **[my call]**

## 14. Left to the builder

Visual styling and palette, slider ranges and steps (within §6), example default amounts, exact copy and translations, age/date formatting, chart tooltip design, project structure beyond "engine is a separate pure module", whether to cache trajectories in storage.
