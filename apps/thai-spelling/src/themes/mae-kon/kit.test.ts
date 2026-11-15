import { describe, expect, it } from 'vitest'
import { maeKom } from '../../lessons/mae-kom'
import { maeKon } from '../../lessons/mae-kon'
import { maeKop } from '../../lessons/mae-kop'
import { maeKong } from '../../lessons/mae-kong'
import { getTheme } from '..'

describe('แม่กน UI Kit', () => {
  it("shares no part with แม่กง's, แม่กม's or แม่กบ's (ADR-0002: a child must not recognise any control)", () => {
    const kon = getTheme(maeKon.theme).kit
    for (const lesson of [maeKong, maeKom, maeKop]) {
      const other = getTheme(lesson.theme).kit
      for (const part of Object.keys(other) as (keyof typeof other)[]) {
        expect(kon[part], `${lesson.id} ${part}`).toBeDefined()
        expect(kon[part], `${lesson.id} ${part}`).not.toEqual(other[part])
      }
    }
  })

  it('covers every Step change with its banana leaves and taps with a plop and ripples, dipping in CSS instead', () => {
    const kon = getTheme(maeKon.theme).kit
    expect(kon.stepChange.covers(2, 3)).toBe(true)
    expect(kon.stepChange.covers(9, 10)).toBe(true)
    expect(kon.stepChange.coverMs).toBeLessThan(kon.stepChange.ms)
    expect(kon.tap.sound).toBeTypeOf('function')
    expect(kon.tap.squash).toBeUndefined()
    expect(kon.tap.burst(0)).toContain('data-ripple')
    expect(kon.tap.burst(0)).not.toContain('data-splash')
  })

  it('names its materials, never another Kit’s', () => {
    const kon = getTheme(maeKon.theme).kit
    expect(kon.card).toBe('bamboo-tray')
    expect(kon.music.className).toContain('plank-button')
    expect(kon.stepBadge).toContain('bamboo-label')
    expect(kon.starCounter).toContain('paddle-counter')
    for (const foreign of ['comic-card', 'ice-block', 'frost', 'vinyl', 'pocket-card', 'drop-label', 'reed-stars', 'shop-banner']) {
      expect([kon.card, kon.music.className, kon.stepBadge, kon.starCounter].join(' ')).not.toContain(foreign)
    }
  })
})
