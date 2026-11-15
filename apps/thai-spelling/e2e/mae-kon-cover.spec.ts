import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน's cover (#99, docs/mae-kon-spec.md): the title carved on a long boat-plank sign over the busy floating market,
// with น้องส้ม paddling in to stop below it.
const sign = (page: Page) => page.getByTestId('cover-sign')
const mascot = (page: Page) => page.getByTestId('cover-mascot')
const start = (page: Page) => page.getByRole('link', { name: /^(เริ่มเรียน|เรียนต่อ)/ })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const restart = (page: Page) => page.getByRole('button', { name: 'เริ่มใหม่' })

test('the title, subtitle and grade line are on the boat-plank sign, and น้องส้ม paddles in to stop below it', async ({ page }) => {
  await open(page, 1, {}, 'mae-kon')
  await expect(sign(page)).toHaveClass(/plank-sign/)
  await expect(sign(page).getByRole('heading', { level: 2 })).toHaveText('คำแม่กนล่องเรือชมตลาด')
  await expect(sign(page)).toContainText('แม่ กน (น ญ ณ ร ล ฬ)')
  await expect(sign(page)).toContainText('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('หน้าปก')
  const img = mascot(page).locator('img')
  await expect(img).toHaveAttribute('src', '/assets/comic/mascot-kon-cover.webp')
  await expect(img).toHaveJSProperty('complete', true)
  // ▶ is the Kit's paddle.
  await expect(start(page).locator('[data-art="paddle"]')).toBeVisible()

  // She comes in from the left and stops below the sign, centred under it, clear of the words.
  const first = await stageBox(page, mascot(page))
  await waitUntilStill(mascot(page))
  const her = await stageBox(page, mascot(page))
  const words = await stageBox(page, sign(page))
  expect(first.cx).toBeLessThan(her.cx)
  expect(her.top).toBeGreaterThanOrEqual(words.bottom)
  expect(Math.abs(her.cx - words.cx)).toBeLessThan(20)
  expect(overlaps(words, her)).toBe(false)
})

test('▶ starts the Lesson with the teacher intro; once under way it resumes, and เริ่มใหม่ starts over', async ({ page }) => {
  await open(page, 1, {}, 'mae-kon')
  await expect(start(page)).toHaveAccessibleName('เริ่มเรียน')
  await expect(restart(page)).toHaveCount(0)
  await start(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/2$/)
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/explanations/mae-kon-intro.mp3')
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/3$/)

  await page.goto('/lesson/mae-kon/1')
  await expect(start(page)).toHaveAccessibleName('เรียนต่อ (ขั้น 3)')
  await expect(restart(page)).toHaveClass(/plank-button/)
  await restart(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/2$/)
})

test('the cover uses only the แม่กน Kit: nothing from แม่กง, แม่กม or แม่กบ anywhere on it', async ({ page }) => {
  await open(page, 1, {}, 'mae-kon')
  await expect(sign(page)).toBeVisible()
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(music(page)).toHaveClass(/plank-button/)
  await expect(page.locator('img[src*="play-button"], img[src*="speaker-button"]')).toHaveCount(0)
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} the floating market fills the window, the sign and น้องส้ม are clear of the corner buttons and they are big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 3, {}, 'mae-kon')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ฟังแล้วอ่านตาม')
    await page.goto('/lesson/mae-kon/1')
    await expect(restart(page)).toBeVisible()
    await expectSceneFills(page, 'kon-cover', viewport)
    await waitUntilStill(mascot(page))
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const play = (await start(page).boundingBox())!
    expect(viewport.width - play.x - play.width).toBeCloseTo(32 * scale, 0)
    expect(viewport.height - play.y - play.height).toBeCloseTo(24 * scale, 0)
    const note = (await music(page).boundingBox())!
    expect(note.x).toBeCloseTo(40 * scale, 0)
    const words = await stageBox(page, sign(page))
    const her = await stageBox(page, mascot(page))
    for (const control of [start(page), music(page), restart(page)]) {
      const box = await stageBox(page, control)
      expect(overlaps(words, box)).toBe(false)
      expect(overlaps(her, box)).toBe(false)
      if (viewport.height === 390) await expectTapTarget(control)
    }
    // The birds fly high over the sign, never across its words.
    for (const bird of await page.getByTestId('scene-bird').all()) expect((await stageBox(page, bird)).bottom).toBeLessThanOrEqual(words.top + 60)
  })
}

test('keyboard and screen reader: the cover reads as a page, its art hidden, and ▶ works from the keyboard', async ({ page }) => {
  await open(page, 1, {}, 'mae-kon')
  await expect(page.getByTestId('scene-motion')).toHaveAttribute('aria-hidden', 'true')
  await expect(mascot(page).locator('img')).toHaveAttribute('alt', '')
  await expect(music(page)).toHaveAttribute('aria-pressed', /true|false/)
  await start(page).focus()
  expect(parseFloat(await start(page).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/2$/)
})

test('vendor boats bob down the canal and birds cross the sky; under reduced motion น้องส้ม is already there and the cover is still', async ({ page }) => {
  await open(page, 1, {}, 'mae-kon')
  const scene = page.getByTestId('stage-scene')
  await expect(scene.getByTestId('scene-boat')).toHaveCount(3)
  await expect(scene.getByTestId('scene-boat').first()).toHaveCSS('animation-name', 'market-drift')
  await expect(scene.getByTestId('scene-boat').first().locator('> div')).toHaveCSS('animation-name', 'boat-bob')
  await expect(scene.getByTestId('scene-bird').first()).toHaveCSS('animation-name', 'bird-cross')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(sign(page)).toBeVisible()
  await expectSceneStill(page)
  await expect(mascot(page)).toHaveCSS('transform', 'none')
  await expect(mascot(page).locator('img')).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
