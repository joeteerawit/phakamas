import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ's cover (#71, docs/mae-kop-spec.md): the title on a raincoat-yellow vinyl panel over the busy rainy pond.
const panel = (page: Page) => page.getByTestId('cover-panel')
const mascot = (page: Page) => page.getByTestId('cover-mascot')
const start = (page: Page) => page.getByRole('link', { name: /^(เริ่มเรียน|เรียนต่อ)/ })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const restart = (page: Page) => page.getByRole('button', { name: 'เริ่มใหม่' })

test('the title, subtitle and grade line sit on the raincoat-yellow vinyl panel, with น้องกบ in her cover pose beside it', async ({ page }) => {
  await open(page, 1, {}, 'mae-kop')
  await expect(panel(page)).toHaveClass(/vinyl-panel/)
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('คำแม่กบหลบฝน')
  await expect(panel(page)).toContainText('แม่ กบ (บ ป พ ฟ ภ)')
  await expect(panel(page)).toContainText('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('หน้าปก')
  await expect(mascot(page)).toHaveAttribute('src', '/assets/comic/mascot-kop-cover.webp')
  await expect(mascot(page)).toHaveJSProperty('complete', true)
  // ▶ is the Kit's rubber boot.
  await expect(start(page).locator('[data-art="boot"]')).toBeVisible()
  await waitUntilStill(panel(page))
  expect(overlaps(await stageBox(page, panel(page)), await stageBox(page, mascot(page)))).toBe(false)
})

test('▶ opens the Map with the teacher intro; once under way it resumes, and เริ่มใหม่ starts over', async ({ page }) => {
  await open(page, 1, {}, 'mae-kop')
  await expect(start(page)).toHaveAccessibleName('เริ่มเรียน')
  await expect(restart(page)).toHaveCount(0)
  await start(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/map$/)
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/explanations/mae-kop-intro.mp3')
  await page.goto('/lesson/mae-kop/3')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ฟังแล้วอ่านตาม')

  await page.goto('/lesson/mae-kop/1')
  await expect(start(page)).toHaveAccessibleName('เรียนต่อ (ขั้น 3)')
  await expect(restart(page)).toHaveClass(/vinyl-button/)
  await restart(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/2$/)
})

test('the cover uses only the แม่กบ Kit: nothing from แม่กง or แม่กม anywhere on it', async ({ page }) => {
  await open(page, 1, {}, 'mae-kop')
  await expect(panel(page)).toBeVisible()
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(music(page)).toHaveClass(/vinyl-button/)
  await expect(page.locator('img[src*="play-button"], img[src*="speaker-button"]')).toHaveCount(0)
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} the rainy pond fills the window, the panel is clear of the corner buttons and they are big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 3, {}, 'mae-kop')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ฟังแล้วอ่านตาม')
    await page.goto('/lesson/mae-kop/1')
    await expect(restart(page)).toBeVisible()
    await expectSceneFills(page, 'kop-cover', viewport)
    await waitUntilStill(panel(page))
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const play = (await start(page).boundingBox())!
    expect(viewport.width - play.x - play.width).toBeCloseTo(32 * scale, 0)
    expect(viewport.height - play.y - play.height).toBeCloseTo(24 * scale, 0)
    const note = (await music(page).boundingBox())!
    expect(note.x).toBeCloseTo(40 * scale, 0)
    const words = await stageBox(page, panel(page))
    const her = await stageBox(page, mascot(page))
    for (const control of [start(page), music(page), restart(page)]) {
      const box = await stageBox(page, control)
      expect(overlaps(words, box)).toBe(false)
      expect(overlaps(her, box)).toBe(false)
      if (viewport.height === 390) await expectTapTarget(control)
    }
    // The children splashing at the sides stay clear of the panel, น้องกบ and the buttons.
    for (const child of await page.getByTestId('scene-splasher').all()) {
      const box = await stageBox(page, child)
      for (const other of [words, her, ...(await Promise.all([start(page), music(page), restart(page)].map((c) => stageBox(page, c))))]) {
        expect(overlaps(box, other), JSON.stringify([box, other])).toBe(false)
      }
    }
  })
}

test('keyboard and screen reader: the cover reads as a page, its art hidden, and ▶ works from the keyboard', async ({ page }) => {
  await open(page, 1, {}, 'mae-kop')
  await expect(page.getByTestId('scene-motion')).toHaveAttribute('aria-hidden', 'true')
  await expect(mascot(page)).toHaveAttribute('alt', '')
  await expect(music(page)).toHaveAttribute('aria-pressed', /true|false/)
  await start(page).focus()
  expect(parseFloat(await start(page).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/map$/)
})

test('the pond rains, rings spread and a paper boat drifts; under reduced motion the cover is still', async ({ page }) => {
  await open(page, 1, {}, 'mae-kop')
  const scene = page.getByTestId('stage-scene')
  await expect(scene.getByTestId('scene-rain').first()).toBeVisible()
  expect(await scene.getByTestId('scene-rain').count()).toBeGreaterThan(20)
  await expect(scene.getByTestId('scene-boat')).toHaveCSS('animation-name', 'boat-drift')
  await expect(scene.getByTestId('scene-rain').first()).toHaveCSS('animation-name', 'rain-fall')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(panel(page)).toBeVisible()
  await expectSceneStill(page)
  await expect(panel(page)).toHaveCSS('transform', 'none')
  await expect(mascot(page)).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
