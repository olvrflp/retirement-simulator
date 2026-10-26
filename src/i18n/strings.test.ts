import { en, es, translate, type StringKey } from './strings'

const tokens = (s: string) => new Set(s.match(/\{\w+\}/g) ?? [])

describe('strings', () => {
  it('es has every en key, non-empty', () => {
    for (const k of Object.keys(en) as StringKey[]) expect(es[k], k).toBeTruthy()
  })
  it('placeholders match between languages', () => {
    for (const k of Object.keys(en) as StringKey[]) expect(tokens(es[k]), k).toEqual(tokens(en[k]))
  })
  it('interpolates variables', () => {
    expect(translate('en', 'verdict.short', { age: '71 y', years: 4, target: 75 })).toBe(
      'Your money runs out at 71 y, 4 years short of your target of 75.',
    )
  })
  it('leaves missing variables visible', () => {
    expect(translate('en', 'verdict.short', {})).toContain('{age}')
  })
})
