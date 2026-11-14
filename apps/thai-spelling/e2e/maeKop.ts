import { expect, type Locator, type Page } from '@playwright/test'

// Shared checks for the แม่กบ Lesson (docs/mae-kop-spec.md): its Kit's look and its drawn pond Scenes.

const MAE_KONG_ART = ['ui-home', 'play-button', 'speaker-button', 'ui-buzzer', 'ui-plank', 'ui-tap', 'ui-banner', 'ui-signboard', 'cover-sign']
const MAE_KOM_ART = ['house', 'street-sign', 'radio', 'snowflake-star']
const MAE_KOM_CLASSES = ['ice-block', 'frost-card', 'frost-label', 'shop-banner']

/**
 * What inside `root` looks like แม่กง's (its art, comic card ring) or แม่กม's (ice, frost and its Kit's art); empty
 * when it all comes from the แม่กบ Kit.
 */
export const otherLook = (root: Locator) =>
  root.evaluateAll(
    (roots, { kong, kom, classes }) => {
      const found: string[] = []
      for (const el of roots.flatMap((r) => [r, ...r.querySelectorAll('*')])) {
        const src = el.getAttribute('src') ?? ''
        const bg = getComputedStyle(el).backgroundImage
        if (kong.some((name) => src.includes(`/${name}.webp`) || bg.includes(`/${name}.webp`))) found.push(src || bg)
        if (el.classList.contains('comic-card') || bg.includes('conic-gradient')) found.push(el.className.toString())
        if (classes.some((name) => el.classList.contains(name))) found.push(el.className.toString())
        if (kom.includes(el.getAttribute('data-art') ?? '')) found.push(`data-art=${el.getAttribute('data-art')}`)
      }
      return found
    },
    { kong: MAE_KONG_ART, kom: MAE_KOM_ART, classes: MAE_KOM_CLASSES },
  )

/** The whole Stage: the Step, its chrome and its Scene. */
export const wholeStage = (page: Page) => page.getByTestId('stage')

/** Asserts the Scene is the named แม่กบ Scene and covers the window. */
export async function expectSceneFills(page: Page, scene: string, viewport: { width: number; height: number }) {
  const layer = page.getByTestId('stage-scene')
  await expect(layer).toHaveAttribute('data-scene', scene)
  const fill = (await layer.boundingBox())!
  expect(fill.x).toBeLessThanOrEqual(0.5)
  expect(fill.y).toBeLessThanOrEqual(0.5)
  expect(fill.x + fill.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
  expect(fill.y + fill.height).toBeGreaterThanOrEqual(viewport.height - 0.5)
}

/** Asserts nothing in the Scene moves: under reduced motion the rain and drops are hidden and no animation runs. */
export async function expectSceneStill(page: Page) {
  const scene = page.getByTestId('stage-scene')
  for (const id of ['scene-rain', 'scene-drifter', 'scene-ring']) for (const one of await scene.getByTestId(id).all()) await expect(one).toBeHidden()
  const moving = await scene.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
  expect(moving).toBe(0)
}

type Rect = { x: number; y: number; right: number; bottom: number }

/**
 * Asserts no drizzle drop ever crosses any of `targets` (what a student reads or taps): the drops' fall is paused
 * and seeked through 24 points of its path, so the whole path is checked, not just a moment of it.
 */
export async function expectNoDropCrosses(page: Page, targets: Locator[]) {
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
    const falls = (motion.getAnimations({ subtree: true }) as CSSAnimation[]).filter((a) => a.animationName === 'drift-fall')
    for (const a of falls) a.pause()
    const rects: { x: number; y: number; right: number; bottom: number }[] = []
    for (let k = 0; k <= 24; k++) {
      for (const a of falls) a.currentTime = (k / 24) * Number(a.effect!.getComputedTiming().duration)
      for (const drop of motion.querySelectorAll('[data-testid="scene-drifter"] > *')) {
        const r = drop.getBoundingClientRect()
        rects.push({ x: r.x, y: r.y, right: r.right, bottom: r.bottom })
      }
    }
    for (const a of falls) a.play()
    return rects
  })
  expect(paths.length).toBeGreaterThan(0)
  const crossing = paths.filter((r) => boxes.some((c) => r.x < c.right && c.x < r.right && r.y < c.bottom && c.y < r.bottom))
  expect(crossing, 'a drop crosses what a student reads or taps').toEqual([])
}

export const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
] as const
