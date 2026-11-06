import { describe, expect, it } from 'vitest'
import { fitStage, isPortrait } from './fitStage'

describe('fitStage', () => {
  it('shows the 1920×1080 stage at full size on a 1920×1080 window', () => {
    expect(fitStage(1920, 1080)).toEqual({ scale: 1, left: 0, top: 0 })
  })

  it('scales down uniformly on a 16:9 window with no letterbox', () => {
    const { scale, left, top } = fitStage(1280, 720)
    expect(scale).toBeCloseTo(2 / 3)
    expect(left).toBeCloseTo(0)
    expect(top).toBeCloseTo(0)
  })

  it('letterboxes left and right on a wide landscape phone (844×390)', () => {
    const { scale, left, top } = fitStage(844, 390)
    expect(scale).toBeCloseTo(390 / 1080)
    expect(left).toBeCloseTo(75.33, 1)
    expect(top).toBe(0)
  })

  it('letterboxes top and bottom on a 4:3 window (1024×768)', () => {
    const { scale, left, top } = fitStage(1024, 768)
    expect(scale).toBeCloseTo(1024 / 1920)
    expect(left).toBe(0)
    expect(top).toBeCloseTo(96)
  })
})

describe('isPortrait', () => {
  it('is true when the window is taller than wide', () => {
    expect(isPortrait(390, 844)).toBe(true)
  })

  it('is false for landscape and square windows', () => {
    expect(isPortrait(844, 390)).toBe(false)
    expect(isPortrait(800, 800)).toBe(false)
  })
})
