import { describe, expect, it } from 'vitest'
import { maeKok } from '../../lessons/mae-kok'
import { getTheme, stepLayout, stepScene } from '..'
import { maeKongTheme } from '../mae-kong/theme'

const stepNumbers = maeKok.steps.map((_, i) => i + 1)

describe('แม่กก Theme', () => {
  it("falls back to แม่กง's layout and Scene for every Step until its own Games land", () => {
    const theme = getTheme(maeKok.theme)
    expect(theme.id).toBe('mae-kok')
    for (const step of stepNumbers) {
      expect(stepLayout(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.layout)
      expect(stepScene(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.scene)
    }
  })

  it('has น้องนก as its Mascot with her own poses, gliding on the cover', () => {
    const { name, poses } = getTheme(maeKok.theme).mascot
    expect(name).toBe('น้องนก')
    for (const src of Object.values(poses)) expect(src).toMatch(/\/mascot-nok-/)
    expect(poses.cover).toBe('/assets/comic/mascot-nok-cover.webp')
  })
})
