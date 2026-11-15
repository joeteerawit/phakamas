import { expect, type Locator, type Page } from '@playwright/test'

// Shared checks for the แม่กก Lesson (docs/mae-kok-spec.md): its Kit's look and its hillside Scenes.

const MAE_KONG_ART = ['ui-home', 'play-button', 'speaker-button', 'ui-buzzer', 'ui-plank', 'ui-tap', 'ui-banner', 'ui-signboard', 'cover-sign']
const OTHER_KIT_ART = ['house', 'street-sign', 'radio', 'snowflake-star', 'hut', 'boot', 'snail', 'raindrop-star']
const OTHER_KIT_CLASSES = ['ice-block', 'frost-card', 'frost-label', 'shop-banner', 'vinyl-button', 'pocket-card', 'drop-label', 'reed-stars', 'vinyl-panel']

/**
 * What inside `root` looks like แม่กง's (its art, comic card ring), แม่กม's (ice, frost and its Kit's art) or แม่กบ's
 * (vinyl, raincoat pockets and its Kit's art); empty when it all comes from the แม่กก Kit.
 */
export const otherLook = (root: Locator) =>
  root.evaluateAll(
    (roots, { kong, art, classes }) => {
      const found: string[] = []
      for (const el of roots.flatMap((r) => [r, ...r.querySelectorAll('*')])) {
        const src = el.getAttribute('src') ?? ''
        const bg = getComputedStyle(el).backgroundImage
        if (kong.some((name) => src.includes(`/${name}.webp`) || bg.includes(`/${name}.webp`))) found.push(src || bg)
        if (el.classList.contains('comic-card') || bg.includes('conic-gradient')) found.push(el.className.toString())
        if (classes.some((name) => el.classList.contains(name))) found.push(el.className.toString())
        if (art.includes(el.getAttribute('data-art') ?? '')) found.push(`data-art=${el.getAttribute('data-art')}`)
      }
      return found
    },
    { kong: MAE_KONG_ART, art: OTHER_KIT_ART, classes: OTHER_KIT_CLASSES },
  )

/** The whole Stage: the Step, its chrome and its Scene. */
export const wholeStage = (page: Page) => page.getByTestId('stage')

/** Asserts the Scene is the named แม่กก Scene and covers the window. */
export async function expectSceneFills(page: Page, scene: string, viewport: { width: number; height: number }) {
  const layer = page.getByTestId('stage-scene')
  await expect(layer).toHaveAttribute('data-scene', scene)
  const fill = (await layer.boundingBox())!
  expect(fill.x).toBeLessThanOrEqual(0.5)
  expect(fill.y).toBeLessThanOrEqual(0.5)
  expect(fill.x + fill.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
  expect(fill.y + fill.height).toBeGreaterThanOrEqual(viewport.height - 0.5)
}

/** Asserts nothing in the Scene moves: under reduced motion no animation runs in it. */
export async function expectSceneStill(page: Page) {
  const moving = await page
    .getByTestId('stage-scene')
    .evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
  expect(moving).toBe(0)
}

/** Running animations anywhere on the page. */
export const running = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)

type Rect = { x: number; y: number; right: number; bottom: number }

/**
 * Asserts nothing moving in the Scene ever crosses any of `targets` (what a student reads or taps): every Scene
 * animation is paused and seeked through 24 points of its loop, so the whole path is checked, not just a moment of it.
 */
export async function expectNothingMovingCrosses(page: Page, targets: Locator[]) {
  const boxes: Rect[] = []
  for (const target of targets) {
    for (const one of await target.all()) {
      const b = (await one.boundingBox())!
      boxes.push({ x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height })
    }
  }
  expect(boxes.length).toBeGreaterThan(0)
  const paths = await page.evaluate(() => {
    const motion = document.querySelector('[data-testid="scene-motion"]')!
    const loops = motion.getAnimations({ subtree: true }) as CSSAnimation[]
    for (const a of loops) a.pause()
    const rects: { x: number; y: number; right: number; bottom: number }[] = []
    for (let k = 0; k <= 24; k++) {
      for (const a of loops) a.currentTime = (k / 24) * Number(a.effect!.getComputedTiming().duration)
      for (const mover of motion.querySelectorAll('[data-mover]')) {
        const r = mover.getBoundingClientRect()
        rects.push({ x: r.x, y: r.y, right: r.right, bottom: r.bottom })
      }
    }
    for (const a of loops) a.play()
    return rects
  })
  expect(paths.length).toBeGreaterThan(0)
  const crossing = paths.filter((r) => boxes.some((c) => r.x < c.right && c.x < r.right && r.y < c.bottom && c.y < r.bottom))
  expect(crossing, 'something moving crosses what a student reads or taps').toEqual([])
}

export const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
] as const
