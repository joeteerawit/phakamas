import { describe, expect, it } from 'vitest'
import { maeKok } from '../../../lessons/mae-kok'
import { maeKom } from '../../../lessons/mae-kom'
import { maeKop } from '../../../lessons/mae-kop'
import { maeKong } from '../../../lessons/mae-kong'
import { getTheme } from '../..'

describe('แม่กก UI Kit', () => {
  it("shares no part with แม่กง's, แม่กม's or แม่กบ's (ADR-0002: a child must not recognise any control)", () => {
    const kok = getTheme(maeKok.theme).kit
    for (const other of [maeKong, maeKom, maeKop].map((lesson) => getTheme(lesson.theme).kit)) {
      for (const part of Object.keys(other) as (keyof typeof other)[]) {
        expect(kok[part], part).toBeDefined()
        expect(kok[part], part).not.toEqual(other[part])
      }
    }
  })

  it('covers every Step change with one pass of the hoe and taps with a tok, sinking the pot in CSS instead', () => {
    const kok = getTheme(maeKok.theme).kit
    expect(kok.stepChange.covers(2, 3)).toBe(true)
    expect(kok.stepChange.covers(9, 10)).toBe(true)
    expect(kok.stepChange.coverMs).toBeLessThan(kok.stepChange.ms)
    expect(kok.tap.sound).toBeTypeOf('function')
    expect(kok.tap.squash).toBeUndefined()
    expect(kok.tap.burst(0)).toContain('data-seeds')
    expect(kok.card).toBe('seed-packet')
  })
})
