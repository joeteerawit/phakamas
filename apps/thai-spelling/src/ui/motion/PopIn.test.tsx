import { describe, expect, it } from 'vitest'
import { popIn } from './PopIn'

describe('popIn (shared card stagger)', () => {
  it('pops each card in 70 ms after the previous one with a spring', () => {
    expect(popIn(0, false).transition).toMatchObject({ type: 'spring', delay: 0 })
    expect(popIn(3, false).transition.delay).toBeCloseTo(0.21)
    expect(popIn(3, false).initial).toMatchObject({ opacity: 0, scale: 0.6 })
  })

  it('only fades with reduced motion: no scale, no spring', () => {
    const reduced = popIn(3, true)
    expect(reduced.initial).toEqual({ opacity: 0 })
    expect(reduced.animate).toEqual({ opacity: 1 })
    expect(reduced.transition).not.toHaveProperty('type', 'spring')
  })
})
