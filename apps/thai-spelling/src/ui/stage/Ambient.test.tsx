import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Ambient } from './Ambient'

describe('Ambient layer', () => {
  it('draws clouds, swaying flowers and a flyer on the garden, and no pond shimmer', () => {
    render(<Ambient scene="garden" />)
    expect(screen.getAllByTestId('ambient-cloud')).toHaveLength(3)
    expect(screen.getAllByTestId('ambient-sway').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByTestId('ambient-flyer')).toBeInTheDocument()
    expect(screen.queryByTestId('ambient-shimmer')).toBeNull()
  })

  it('adds the water shimmer on the pond scene', () => {
    render(<Ambient scene="pond" />)
    expect(screen.getByTestId('ambient-shimmer')).toBeInTheDocument()
  })
})
