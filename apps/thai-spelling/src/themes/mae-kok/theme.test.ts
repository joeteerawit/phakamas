import { describe, expect, it } from 'vitest'
import { maeKok } from '../../lessons/mae-kok'
import { getTheme, stepLayout, stepScene } from '..'
import { maeKongTheme } from '../mae-kong/theme'

const stepNumbers = maeKok.steps.map((_, i) => i + 1)

describe('แม่กก Theme', () => {
  it('stages its cover on the busy hillside, Steps 2–6, 8 and 9 on the calm terrace and 10 at sunset', () => {
    const theme = getTheme(maeKok.theme)
    expect(theme.id).toBe('mae-kok')
    expect(stepScene(theme, 1)).toBe('kok-cover')
    for (const step of [2, 3, 4, 5, 6, 8, 9]) expect(stepScene(theme, step), `Step ${step}`).toBe('kok-terrace')
    expect(stepScene(theme, 10)).toBe('kok-sunset')
  })

  it("lays out its own cover; Steps 2–10 still use แม่กง's layouts until their Games land", () => {
    const theme = getTheme(maeKok.theme)
    expect(stepLayout(theme, 1)).not.toBe(maeKongTheme.steps[1]?.layout)
    for (const step of stepNumbers.slice(1)) expect(stepLayout(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.layout)
  })

  it('has its own Map, opened by the cover', () => {
    expect(getTheme(maeKok.theme).map).toBeDefined()
  })

  it('has น้องนก as its Mascot with her own poses, gliding on the cover', () => {
    const { name, poses } = getTheme(maeKok.theme).mascot
    expect(name).toBe('น้องนก')
    for (const src of Object.values(poses)) expect(src).toMatch(/\/mascot-nok-/)
    expect(poses.cover).toBe('/assets/comic/mascot-nok-cover.webp')
  })
})
