import { describe, expect, it } from 'vitest'
import { maeKom } from '../lessons/mae-kom'
import { maeKop } from '../lessons/mae-kop'
import { maeKong } from '../lessons/mae-kong'
import { getTheme, stepLayout, stepScene, type Theme } from '.'
import { maeKongTheme } from './mae-kong/theme'

const bare: Theme = { id: 'bare', steps: {}, mascot: maeKongTheme.mascot, kit: maeKongTheme.kit }
const stepNumbers = maeKong.steps.map((_, i) => i + 1)

describe('Theme fallback', () => {
  it('a Theme with no Steps lays out and stages every Step as แม่กง does', () => {
    for (const step of stepNumbers) {
      expect(stepLayout(bare, step), `Step ${step}`).toBeDefined()
      expect(stepLayout(bare, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.layout)
      expect(stepScene(bare, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.scene)
    }
  })

  it("a Theme's own Step wins over แม่กง's", () => {
    const Own = () => null
    const theme: Theme = { ...bare, steps: { 2: { layout: Own, scene: 'pond' } } }
    expect(stepLayout(theme, 2)).toBe(Own)
    expect(stepScene(theme, 2)).toBe('pond')
  })

  it("แม่กง's Lesson names the แม่กง Theme", () => {
    expect(getTheme(maeKong.theme)).toBe(maeKongTheme)
  })

  it("แม่กม's Theme lays out its own Steps 1 to 4; the rest are still แม่กง's", () => {
    const theme = getTheme(maeKom.theme)
    expect(theme.id).toBe('mae-kom')
    for (const step of stepNumbers) {
      const own = step <= 4
      expect(stepLayout(theme, step) === maeKongTheme.steps[step]?.layout, `Step ${step}`).toBe(!own)
    }
  })

  it("แม่กม's cover is staged on the snowy street, and Steps 2–6, 8 and 9 on the windy street", () => {
    const theme = getTheme(maeKom.theme)
    expect(stepScene(theme, 1)).toBe('kom-cover')
    for (const step of [2, 3, 4, 5, 6, 8, 9]) expect(stepScene(theme, step), `Step ${step}`).toBe('kom-windy')
    // Steps 7 and 10 get their own Scenes in later tickets.
    for (const step of [7, 10]) expect(stepScene(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.scene)
  })

  it("แม่กม's Mascot is น้องส้ม with her own poses, floating on the cover", () => {
    const { poses } = getTheme(maeKom.theme).mascot
    for (const src of Object.values(poses)) expect(src).toMatch(/\/mascot-som-/)
    expect(poses.cover).toBe('/assets/comic/mascot-som-float.webp')
  })

  it("แม่กบ's Theme draws its cover on the busy rainy pond, Steps 2–6, 8 and 9 in the drizzle, 7 on the comic gutter and 10 after the rain", () => {
    const theme = getTheme(maeKop.theme)
    expect(theme.id).toBe('mae-kop')
    expect(stepLayout(theme, 1)).not.toBe(maeKongTheme.steps[1]?.layout)
    expect(stepScene(theme, 1)).toBe('kop-cover')
    for (const step of [2, 3, 4, 5, 6, 8, 9]) expect(stepScene(theme, step), `Step ${step}`).toBe('kop-drizzle')
    expect(stepScene(theme, 7)).toBe('kop-gutter')
    expect(stepScene(theme, 10)).toBe('kop-rainbow')
  })

  it("แม่กบ's Theme lays out its own Games; the Steps not built yet are still แม่กง's", () => {
    const theme = getTheme(maeKop.theme)
    const own = [1, 2, 3, 4, 5, 6]
    for (const step of stepNumbers) {
      expect(stepLayout(theme, step) === maeKongTheme.steps[step]?.layout, `Step ${step}`).toBe(!own.includes(step))
      expect(stepLayout(theme, step), `Step ${step}`).not.toBe(getTheme(maeKom.theme).steps[step]?.layout)
    }
  })

  it("แม่กบ's Mascot is น้องกบ with her own poses, under her taro-leaf umbrella on the cover", () => {
    const { name, poses } = getTheme(maeKop.theme).mascot
    expect(name).toBe('น้องกบ')
    for (const src of Object.values(poses)) expect(src).toMatch(/\/mascot-kop-/)
    expect(poses.cover).toBe('/assets/comic/mascot-kop-cover.webp')
  })
})
