import { describe, expect, it } from 'vitest'
import { maeKom } from '../lessons/mae-kom'
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
})
