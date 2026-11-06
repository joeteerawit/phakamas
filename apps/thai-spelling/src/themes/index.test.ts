import { describe, expect, it } from 'vitest'
import { maeKom } from '../lessons/mae-kom'
import { maeKong } from '../lessons/mae-kong'
import { getTheme, stepLayout, stepScene, type Theme } from '.'
import { maeKongTheme } from './mae-kong/theme'

const bare: Theme = { id: 'bare', steps: {}, mascot: maeKongTheme.mascot }
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

  it("แม่กม's Theme has no Steps yet, so every Step is แม่กง's", () => {
    const theme = getTheme(maeKom.theme)
    expect(theme.id).toBe('mae-kom')
    for (const step of stepNumbers) {
      expect(stepLayout(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.layout)
      expect(stepScene(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.scene)
    }
  })
})
