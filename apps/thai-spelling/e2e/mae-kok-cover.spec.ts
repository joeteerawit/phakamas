import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, wholeStage } from './maeKok.js'
import { stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Scenes and cover (#85, docs/mae-kok-spec.md).

const start = (page: Page) => page.getByRole('link', { name: /^(เริ่มเรียน|เรียนต่อ)/ })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const sign = (page: Page) => page.getByTestId('cover-panel')

const SCENES: Record<number, string> = { 1: 'kok-cover', 2: 'kok-terrace', 3: 'kok-terrace', 4: 'kok-terrace', 5: 'kok-terrace', 6: 'kok-terrace', 8: 'kok-terrace', 9: 'kok-terrace', 10: 'kok-sunset' }

test('each Step shows the Scene the spec gives it, over its own backdrop', async ({ page }) => {
  for (const [step, scene] of Object.entries(SCENES)) {
    await open(page, Number(step), {}, 'mae-kok')
    const layer = page.getByTestId('stage-scene')
    await expect(layer, `Step ${step}`).toHaveAttribute('data-scene', scene)
    await expect(layer, `Step ${step}`).toHaveCSS('background-image', new RegExp(`/kok-scene-${scene.replace('kok-', '')}\\.webp`))
    await expect(layer.getByTestId('scene-motion'), `Step ${step}`).toBeAttached()
  }
})

test('the busy hillside moves: clouds, the sprinkler, leaves, a child with a basket and a worm', async ({ page }) => {
  await open(page, 1, {}, 'mae-kok')
  const scene = page.getByTestId('stage-scene')
  for (const id of ['scene-cloud', 'scene-sprinkler', 'scene-leaf', 'scene-carrier', 'scene-worm']) await expect(scene.getByTestId(id).first(), id).toBeVisible()
  await expect.poll(() => scene.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBeGreaterThan(5)
})

test('the cover: the title on a staked seed-packet signboard, น้องนก gliding beside it, and the Kit chrome only', async ({ page }) => {
  await open(page, 1, {}, 'mae-kok')
  await expect(sign(page)).toHaveClass(/seed-packet/)
  await expect(sign(page).getByRole('heading', { name: 'คำแม่กกเที่ยวสวนผักบนดอย' })).toBeVisible()
  await expect(sign(page)).toContainText('แม่ กก (ก ข ค ฆ)')
  await expect(sign(page)).toContainText('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  // The title fits its sign.
  const panel = await stageBox(page, sign(page))
  const title = await stageBox(page, sign(page).getByRole('heading'))
  expect(title.left).toBeGreaterThan(panel.left)
  expect(title.right).toBeLessThan(panel.right)
  await expect(page.getByTestId('cover-mascot')).toHaveAttribute('src', /mascot-nok-cover\.webp$/)
  await expect(music(page)).toHaveClass(/pot-button/)
  await expect(start(page).locator('[data-art="stake"]')).toBeVisible()
  expect(await otherLook(wholeStage(page))).toEqual([])
})

test('▶ starts the Lesson and plays the intro; a Session in progress offers เรียนต่อ and เริ่มใหม่', async ({ page }) => {
  await open(page, 1, {}, 'mae-kok')
  await start(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/2$/)
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/explanations/mae-kok-intro.mp3')
  await page.goto('/lesson/mae-kok/1')
  await expect(start(page)).toHaveAccessibleName('เรียนต่อ (ขั้น 2)')
  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/2$/)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
  { width: 2560, height: 1080 },
  { width: 1280, height: 900 },
]) {
  test(`at ${viewport.width}×${viewport.height} the Scenes fill the window and nothing moving crosses the sign, น้องนก or the buttons`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 1, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-cover', viewport)
    await waitUntilStill(page.getByTestId('cover-sign'))
    await expectNothingMovingCrosses(page, [page.getByTestId('cover-sign'), music(page), start(page)])
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const play = (await start(page).boundingBox())!
    expect(viewport.width - play.x - play.width).toBeCloseTo(32 * scale, 0)
    expect(viewport.height - play.y - play.height).toBeCloseTo(24 * scale, 0)
    if (viewport.height === 390) for (const target of [music(page), start(page)]) await expectTapTarget(target)
    for (const step of [3, 10]) {
      await open(page, step, {}, 'mae-kok')
      await expectSceneFills(page, step === 10 ? 'kok-sunset' : 'kok-terrace', viewport)
    }
  })
}

test('keyboard and screen reader: the cover\'s controls are named and reachable, its art hidden', async ({ page }) => {
  await open(page, 1, {}, 'mae-kok')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('หน้าปก')
  await expect(page.getByTestId('stage-scene').getByTestId('scene-motion')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByTestId('cover-mascot')).toHaveAttribute('alt', '')
  let focused = ''
  for (let i = 0; i < 10 && focused !== 'เริ่มเรียน'; i++) {
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
  }
  expect(focused).toBe('เริ่มเรียน')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/2$/)
})

test('no timer: the cover waits as long as the student likes', async ({ page }) => {
  await open(page, 1, {}, 'mae-kok')
  await page.waitForTimeout(3000)
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/1$/)
})

test('under reduced motion every Scene and the cover stand still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const step of [1, 2, 10]) {
    await open(page, step, {}, 'mae-kok')
    await page.getByTestId('scene-motion').first().waitFor({ state: 'attached' })
    await expectSceneStill(page)
  }
  await open(page, 1, {}, 'mae-kok')
  await sign(page).waitFor()
  await expect(page.getByTestId('cover-sign')).toHaveCSS('transform', 'none')
  await expect.poll(() => running(page)).toBe(0)
})
