import { describe, expect, it } from 'vitest'
import { maeKom } from '../lessons/mae-kom'
import { maeKop } from '../lessons/mae-kop'
import { maeKong } from '../lessons/mae-kong'
import { getTheme } from '.'

describe('UI Kit', () => {
  it("แม่กม's Kit shares no part with แม่กง's (ADR-0002: a child must not recognise any control)", () => {
    const kong = getTheme(maeKong.theme).kit
    const kom = getTheme(maeKom.theme).kit
    for (const part of Object.keys(kong) as (keyof typeof kong)[]) {
      expect(kom[part], part).toBeDefined()
      expect(kom[part], part).not.toEqual(kong[part])
    }
  })

  it('แม่กม covers every Step change with its flurry and taps with a sound; แม่กง keeps its panel Steps 1 and 5', () => {
    const kong = getTheme(maeKong.theme).kit
    const kom = getTheme(maeKom.theme).kit
    expect(kom.stepChange.covers(2, 3)).toBe(true)
    expect(kong.stepChange.covers(2, 3)).toBe(false)
    expect(kong.stepChange.covers(4, 5)).toBe(true)
    expect(kom.tap.sound).toBeTypeOf('function')
    expect(kong.tap.sound).toBeUndefined()
    expect(kom.tap.squash).toBeUndefined()
  })

  it("แม่กบ's Kit shares no part with แม่กง's or แม่กม's", () => {
    const kop = getTheme(maeKop.theme).kit
    for (const other of [getTheme(maeKong.theme).kit, getTheme(maeKom.theme).kit]) {
      for (const part of Object.keys(other) as (keyof typeof other)[]) {
        expect(kop[part], part).toBeDefined()
        expect(kop[part], part).not.toEqual(other[part])
      }
    }
  })

  it('แม่กบ covers every Step change with its ripple and taps with a plop, squashing in CSS instead', () => {
    const kop = getTheme(maeKop.theme).kit
    expect(kop.stepChange.covers(2, 3)).toBe(true)
    expect(kop.stepChange.covers(9, 10)).toBe(true)
    expect(kop.stepChange.coverMs).toBeLessThan(kop.stepChange.ms)
    expect(kop.tap.sound).toBeTypeOf('function')
    expect(kop.tap.squash).toBeUndefined()
    expect(kop.tap.burst(0)).toContain('data-splash')
  })
})
