import { describe, expect, it } from 'vitest'
import { maeKon } from '../../lessons/mae-kon'
import { getTheme, stepLayout, stepScene } from '..'
import { maeKongTheme } from '../mae-kong/theme'

const stepNumbers = maeKon.steps.map((_, i) => i + 1)

describe('แม่กน Theme', () => {
  it("falls back to แม่กง's layout and Scene for every Step until its own Games land", () => {
    const theme = getTheme(maeKon.theme)
    expect(theme.id).toBe('mae-kon')
    for (const step of stepNumbers) {
      expect(stepLayout(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.layout)
      expect(stepScene(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.scene)
    }
  })

  it('names น้องส้ม as its Mascot', () => {
    expect(getTheme(maeKon.theme).mascot.name).toBe('น้องส้ม')
  })
})
