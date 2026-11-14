import { expect, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook } from './maeKop.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ's Scenes (#71, docs/mae-kop-spec.md), drawn in CSS and SVG with no backdrop image.
const SCENES: Record<number, string> = {
  1: 'kop-cover',
  2: 'kop-drizzle',
  3: 'kop-drizzle',
  4: 'kop-drizzle',
  5: 'kop-drizzle',
  6: 'kop-drizzle',
  7: 'kop-gutter',
  8: 'kop-drizzle',
  9: 'kop-drizzle',
  10: 'kop-rainbow',
}

test('each Step shows the Scene the spec gives it, drawn without any backdrop image', async ({ page }) => {
  for (const [step, scene] of Object.entries(SCENES)) {
    await open(page, Number(step), {}, 'mae-kop')
    const layer = page.getByTestId('stage-scene')
    await expect(layer, `Step ${step}`).toHaveAttribute('data-scene', scene)
    await expect(layer, `Step ${step}`).toHaveCSS('background-image', 'none')
    expect(await otherLook(layer), `Step ${step}`).toEqual([])
    if (scene !== 'kop-gutter') await expect(layer.getByTestId('scene-backdrop'), `Step ${step}`).toBeVisible()
  }
})

test('the drizzle has a few drops falling down the sides; after the rain only slow rings move; the comic gutter is still', async ({ page }) => {
  await open(page, 2, {}, 'mae-kop')
  const scene = page.getByTestId('stage-scene')
  await expect(scene.getByTestId('scene-drifter')).toHaveCount(6)
  for (const drop of await scene.getByTestId('scene-drifter').all()) await expect(drop).toHaveCSS('animation-name', 'drift-fall')
  await expect(scene.getByTestId('scene-rain')).toHaveCount(0)

  await page.goto('/lesson/mae-kop/10')
  await expect(scene.getByTestId('scene-drifter')).toHaveCount(0)
  await expect(scene.getByTestId('scene-ring')).toHaveCount(2)

  await page.goto('/lesson/mae-kop/7')
  await expect(scene).toHaveAttribute('data-scene', 'kop-gutter')
  expect(await scene.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
]) {
  test(`at ${viewport.width}×${viewport.height} every Scene fills the window with no letterbox`, async ({ page }) => {
    await page.setViewportSize(viewport)
    for (const [step, scene] of Object.entries(SCENES)) {
      await open(page, Number(step), {}, 'mae-kop')
      await expectSceneFills(page, scene, viewport)
      if (viewport.height === 390 && step !== '1') {
        for (const name of ['กลับไปขั้นแรก', 'ย้อนกลับ']) await expectTapTarget(page.getByRole('link', { name }))
      }
    }
  })
}

test('the Scenes are hidden from screen readers and never take a tap', async ({ page }) => {
  for (const step of [1, 2, 10]) {
    await open(page, step, {}, 'mae-kop')
    const motion = page.getByTestId('scene-motion')
    await expect(motion).toHaveAttribute('aria-hidden', 'true')
    await expect(motion).toHaveCSS('pointer-events', 'none')
  }
})

test('under reduced motion every แม่กบ Scene is still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const step of [1, 2, 7, 10]) {
    await open(page, step, {}, 'mae-kop')
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'attached' })
    await expectSceneStill(page)
  }
})
