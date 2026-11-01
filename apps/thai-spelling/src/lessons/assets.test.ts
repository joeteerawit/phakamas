import { describe, expect, it } from 'vitest'
import { maeKong } from './mae-kong'

// Keys look like /public/assets/canva/vocabulary/ling.webp.
const files = Object.keys(import.meta.glob('/public/assets/**/*.{webp,png,svg,jpg}'))

/** Every string in the Lesson data that is an image path. */
function imagePaths(value: unknown): string[] {
  if (typeof value === 'string') return /^\/assets\/.+\.(webp|png|svg|jpg)$/.test(value) ? [value] : []
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(imagePaths)
}

describe('Lesson images', () => {
  it('finds the image paths in the Lesson data', () => {
    expect(imagePaths(maeKong)).toContain('/assets/canva/vocabulary/ling.webp')
  })

  it('has a file on disk for every image the Lesson references', () => {
    const missing = [...new Set(imagePaths(maeKong))].filter((path) => !files.includes(`/public${path}`))
    expect(missing).toEqual([])
  })
})
