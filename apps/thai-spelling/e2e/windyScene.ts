import { expect, type Locator, type Page } from '@playwright/test'

type Rect = { x: number; y: number; right: number; bottom: number }

/**
 * Every rect each drifter of the แม่กม windy Scene covers on screen: animations are paused and seeked through
 * 12 points of each fall, with the sway at both ends, so the whole path is checked, not just a moment of it.
 */
export const drifterPaths = (page: Page) =>
  page.evaluate(() => {
    const motion = document.querySelector('[data-testid="scene-motion"]')!
    const animations = motion.getAnimations({ subtree: true }) as CSSAnimation[]
    for (const a of animations) a.pause()
    const at = (name: string, phase: number) => {
      for (const a of animations.filter((x) => x.animationName === name)) {
        a.currentTime = phase * Number(a.effect!.getComputedTiming().duration)
      }
    }
    const rects: { x: number; y: number; right: number; bottom: number }[] = []
    for (let k = 0; k <= 12; k++) {
      at('drift-fall', k / 12)
      for (const sway of [0, 0.999]) {
        at('leaf-sway', sway)
        for (const drifter of motion.querySelectorAll('[data-testid="scene-drifter"] > *')) {
          const r = drifter.getBoundingClientRect()
          rects.push({ x: r.x, y: r.y, right: r.right, bottom: r.bottom })
        }
      }
    }
    for (const a of animations) a.play()
    return rects
  })

/** Asserts no leaf or snowflake of the windy Scene ever crosses any of `targets` (what a student reads or taps). */
export async function expectNoDrifterCrosses(page: Page, targets: Locator[]) {
  const boxes: Rect[] = []
  for (const target of targets) {
    for (const one of await target.all()) {
      const b = (await one.boundingBox())!
      boxes.push({ x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height })
    }
  }
  expect(boxes.length).toBeGreaterThan(0)
  const paths = await drifterPaths(page)
  expect(paths.length).toBeGreaterThan(0)
  const crossing = paths.filter((r) => boxes.some((c) => r.x < c.right && c.x < r.right && r.y < c.bottom && c.y < r.bottom))
  expect(crossing, 'a leaf or snowflake crosses what a student reads or taps').toEqual([])
}

/** Asserts the Scene covers the window and Home, Back and Next sit at their window-corner offsets. */
export async function expectSceneFillsWithCornerButtons(page: Page, viewport: { width: number; height: number }) {
  const fill = (await page.getByTestId('stage-scene').boundingBox())!
  expect(fill.x).toBeLessThanOrEqual(0.5)
  expect(fill.y).toBeLessThanOrEqual(0.5)
  expect(fill.x + fill.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
  expect(fill.y + fill.height).toBeGreaterThanOrEqual(viewport.height - 0.5)

  const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
  const home = (await page.getByRole('link', { name: 'กลับไปขั้นแรก' }).boundingBox())!
  expect(viewport.width - home.x - home.width).toBeCloseTo(20 * scale, 0)
  expect(home.y).toBeCloseTo(23 * scale, 0)
  const back = (await page.getByRole('link', { name: 'ย้อนกลับ' }).boundingBox())!
  expect(back.x).toBeCloseTo(29 * scale, 0)
  expect(viewport.height - back.y - back.height).toBeCloseTo(13 * scale, 0)
  const next = (await page.getByRole('link', { name: 'ถัดไป' }).boundingBox())!
  expect(viewport.width - next.x - next.width).toBeCloseTo(34 * scale, 0)
  expect(viewport.height - next.y - next.height).toBeCloseTo(13 * scale, 0)
}

/** Asserts the windy Scene is still under reduced motion: no drifter shows and nothing in it runs. */
export async function expectSceneStill(page: Page) {
  const scene = page.getByTestId('stage-scene')
  for (const drifter of await scene.getByTestId('scene-drifter').all()) await expect(drifter).toBeHidden()
  const moving = await scene.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
  expect(moving).toBe(0)
}
