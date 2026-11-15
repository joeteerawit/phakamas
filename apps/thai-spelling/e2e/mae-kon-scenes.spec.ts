import { expect, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook } from './maeKon.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน's Scenes (#99, docs/mae-kon-spec.md), drawn in CSS and SVG with no backdrop image.
const SCENES: Record<number, string> = {
  1: 'kon-cover',
  2: 'kon-canal',
  3: 'kon-canal',
  4: 'kon-canal',
  5: 'kon-canal',
  6: 'kon-canal',
  7: 'kon-canal',
  8: 'kon-canal',
  9: 'kon-canal',
  10: 'kon-dusk',
}

test('each Step shows the Scene the spec gives it, drawn without any backdrop image', async ({ page }) => {
  for (const [step, scene] of Object.entries(SCENES)) {
    await open(page, Number(step), {}, 'mae-kon')
    const layer = page.getByTestId('stage-scene')
    await expect(layer, `Step ${step}`).toHaveAttribute('data-scene', scene)
    await expect(layer, `Step ${step}`).toHaveCSS('background-image', 'none')
    expect(await otherLook(layer), `Step ${step}`).toEqual([])
    await expect(layer.getByTestId('scene-backdrop'), `Step ${step}`).toBeVisible()
  }
})

test('the quiet canal has a few lotus pads drifting down the sides; at dusk only slow ripples move', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  const scene = page.getByTestId('stage-scene')
  await expect(scene.getByTestId('scene-drifter')).toHaveCount(4)
  for (const pad of await scene.getByTestId('scene-drifter').all()) {
    await expect(pad).toHaveCSS('animation-name', 'lotus-drift')
    // Down the window's sides only, clear of the Step's cards.
    const left = await pad.evaluate((el) => parseFloat((el as HTMLElement).style.left))
    expect(left < 300 || left > 1620, `${left}`).toBe(true)
  }
  await expect(scene.getByTestId('scene-boat')).toHaveCount(0)
  await expect(scene.getByTestId('scene-bird')).toHaveCount(0)

  await page.goto('/lesson/mae-kon/10')
  await expect(scene.getByTestId('scene-drifter')).toHaveCount(0)
  await expect(scene.getByTestId('scene-ripple')).toHaveCount(2)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
]) {
  test(`at ${viewport.width}×${viewport.height} every Scene fills the window with no letterbox`, async ({ page }) => {
    await page.setViewportSize(viewport)
    for (const [step, scene] of Object.entries(SCENES)) {
      await open(page, Number(step), {}, 'mae-kon')
      await expectSceneFills(page, scene, viewport)
      if (viewport.height === 390 && step !== '1') {
        for (const name of ['ย้อนกลับ', 'ถัดไป']) await expectTapTarget(page.getByRole('link', { name, exact: true }).or(page.getByRole('link', { name: 'กลับหน้าแรก' })).first())
      }
    }
  })
}

test('the Scenes are hidden from screen readers and never take a tap', async ({ page }) => {
  for (const step of [1, 2, 10]) {
    await open(page, step, {}, 'mae-kon')
    const motion = page.getByTestId('scene-motion')
    await expect(motion).toHaveAttribute('aria-hidden', 'true')
    await expect(motion).toHaveCSS('pointer-events', 'none')
  }
})

test('under reduced motion every แม่กน Scene is still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const step of [1, 2, 7, 10]) {
    await open(page, step, {}, 'mae-kon')
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'attached' })
    await expectSceneStill(page)
  }
})
