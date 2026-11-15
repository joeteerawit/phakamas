import { describe, expect, it } from 'vitest'
import { maeKon } from '../../lessons/mae-kon'
import { getTheme, stepLayout, stepScene } from '..'
import { maeKongTheme } from '../mae-kong/theme'

const stepNumbers = maeKon.steps.map((_, i) => i + 1)
const theme = getTheme(maeKon.theme)

describe('แม่กน Theme', () => {
  it('draws its cover on the busy floating market, Steps 2–9 on the quiet canal and 10 on the canal at dusk', () => {
    expect(theme.id).toBe('mae-kon')
    expect(stepScene(theme, 1)).toBe('kon-cover')
    for (const step of [2, 3, 4, 5, 6, 7, 8, 9]) expect(stepScene(theme, step), `Step ${step}`).toBe('kon-canal')
    expect(stepScene(theme, 10)).toBe('kon-dusk')
  })

  it("lays out its own cover; Steps 2–10 still use แม่กง's layouts until their Games land", () => {
    expect(stepLayout(theme, 1)).not.toBe(maeKongTheme.steps[1]?.layout)
    for (const step of stepNumbers.slice(1)) expect(stepLayout(theme, step), `Step ${step}`).toBe(maeKongTheme.steps[step]?.layout)
  })

  it('has its own Map, the floating market from above', () => {
    expect(theme.map).toBeDefined()
    expect(theme.map).not.toBe(getTheme('mae-kop').map)
    expect(theme.map).not.toBe(getTheme('mae-kom').map)
  })

  it('names น้องส้ม as its Mascot, in her boat in every pose and paddling on the cover', () => {
    const { name, poses } = theme.mascot
    expect(name).toBe('น้องส้ม')
    for (const src of Object.values(poses)) expect(src).toMatch(/\/mascot-kon-/)
    expect(poses.cover).toBe('/assets/comic/mascot-kon-cover.webp')
  })
})
