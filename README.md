# Retirement Runway Simulator

A bilingual (Spanish / English) web app that answers one question: **when can I stop working without running out of money?**

It simulates your savings month by month across four phases, tells you whether the money lasts to your target age (with a safety margin), finds the **earliest age you could retire**, and lets you save and compare scenarios on one chart.

> Educational estimate, not financial advice.

## The four phases

1. **Accumulation:** you work and save. Contributions land at the end of each month.
2. **Early retirement:** withdrawals start, with a predictable, fixed return.
3. **Mid retirement:** a higher but uncertain return, lasting until your pension age.
4. **Pension:** the pension covers part of your spending and your savings cover the rest.

Spending and the pension are entered in **today's money** and grow with inflation from today. Returns are **nominal effective annual rates after fees and taxes**. Don't subtract inflation from them, because the simulator applies it separately.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit + component tests (Vitest)
npm run lint
npm run build    # static bundle in dist/
npm run preview  # serve the built bundle
```

`dist/` uses relative asset paths. Serve it from any static host or CDN (GitHub Pages, Vercel, S3…) or open it with `npm run preview`.

Saved scenarios and your current inputs are stored in your browser (`localStorage`). Nothing is sent anywhere.

## Design docs

- Spec: `docs/superpowers/specs/2026-10-26-retirement-runway-simulator-design.md`
- Plan: `docs/superpowers/plans/2026-10-26-retirement-runway-simulator.md`
