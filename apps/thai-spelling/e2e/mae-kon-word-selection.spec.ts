import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 5, fill the shopping basket (#104). src/lessons/mae-kon.ts: the twelve goods in boat order.
const CHOICES = ['นก', 'จาน', 'ฟัน', 'กิน', 'นม', 'ร้าน', 'คน', 'เรือ', 'แขน', 'ช้อน', 'ชาม', 'บ้าน']
const MAE_KON = ['จาน', 'ฟัน', 'กิน', 'ร้าน', 'คน', 'แขน', 'ช้อน', 'บ้าน']

const good = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const goods = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const empty = (page: Page) => page.getByRole('button', { name: 'ล้างตะกร้า' })
const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'คะแนน' })
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}').state?.session?.activities?.wordSelection)

test('two vendor boats are moored one above the other, six goods on each, none tagged yet', async ({ page }) => {
  await open(page, 5, {}, 'mae-kon')
  await expect(goods(page)).toHaveCount(12)
  const boxes = []
  for (const [i, word] of CHOICES.entries()) {
    const one = goods(page).nth(i)
    await expect(one).toHaveAccessibleName(word)
    await expect(one).toHaveAttribute('aria-pressed', 'false')
    await expect(one.getByTestId('leaf-tag')).toHaveCount(0)
    await expect(one.locator('img')).toHaveJSProperty('complete', true)
    boxes.push(await stageBox(page, one))
  }
  for (const boat of [0, 6]) {
    for (let i = boat + 1; i < boat + 6; i++) {
      expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[boat]!.top))
      expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
    }
  }
  expect(boxes[6]!.top).toBeGreaterThan(boxes[0]!.bottom)
  await expect(page.getByTestId('fruit-boats')).toBeAttached()
})

test('tapping a good plays its word and ties a banana-leaf tag on it; tapping again takes it out, and nothing moves', async ({ page }) => {
  await open(page, 5, {}, 'mae-kon')
  const before = await stageBox(page, good(page, 'จาน'))
  await good(page, 'จาน').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/chan.mp3'])
  await expect(good(page, 'จาน')).toHaveAttribute('aria-pressed', 'true')
  await expect(good(page, 'จาน').getByTestId('leaf-tag')).toBeVisible()
  expect(await stageBox(page, good(page, 'จาน'))).toEqual(before)
  await good(page, 'จาน').click()
  await expect(good(page, 'จาน')).toHaveAttribute('aria-pressed', 'false')
  await expect(good(page, 'จาน').getByTestId('leaf-tag')).toHaveCount(0)
})

test('ตรวจคำตอบ scores each good as one Decision out of 12 with the shared scoring; a wrong one gets a red ring; full marks earn 3 Stars', async ({ page }) => {
  await open(page, 5, {}, 'mae-kon')
  await good(page, 'จาน').click()
  await good(page, 'นก').click()
  await check(page).click()
  // จาน right, นก wrong, the other seven แม่กน goods missed: 12 − 8 = 4.
  await expect(toast(page)).toContainText('ได้ 4/12 คะแนน')
  await expect(good(page, 'จาน')).toHaveAccessibleName('จาน ถูกต้อง')
  await expect(good(page, 'นก')).toHaveAccessibleName('นก เลือกผิด')
  await expect(good(page, 'นก').getByTestId('good')).toHaveCSS('outline-color', 'rgb(220, 38, 38)')
  await expect(good(page, 'บ้าน')).toHaveAccessibleName('บ้าน ลืมเลือก')
  await expect(good(page, 'ชาม')).toHaveAccessibleName('ชาม')
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 4, maxScore: 12, attemptCount: 1 })
  await expect(page.getByTestId('star-counter')).toHaveText(/1\/9/)

  // Changing a good clears its mark; ล้างตะกร้า empties the basket.
  await good(page, 'นก').click()
  await expect(good(page, 'นก')).toHaveAccessibleName('นก')
  await empty(page).click()
  for (const word of CHOICES) await expect(good(page, word)).toHaveAttribute('aria-pressed', 'false')

  for (const word of MAE_KON) await good(page, word).click()
  await check(page).click()
  await expect(toast(page)).toContainText('เก่งมาก! ได้ 12/12 คะแนน')
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  expect(await session(page)).toMatchObject({ bestScore: 12, attemptCount: 2 })
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
})

test('ถัดไป without checking marks the Activity skipped, as on every Lesson', async ({ page }) => {
  await open(page, 5, {}, 'mae-kon')
  await good(page, 'จาน').click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/6$/)
  expect(await session(page)).toMatchObject({ status: 'skipped', bestScore: 0 })
})

test('the Game uses only the แม่กน Kit: bamboo-tray goods and plank buttons, nothing from another Lesson', async ({ page }) => {
  await open(page, 5, {}, 'mae-kon')
  await good(page, 'จาน').click()
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const one of await page.getByTestId('good').all()) await expect(one).toHaveClass(/bamboo-tray/)
  for (const control of [check(page), empty(page)]) await expect(control).toHaveClass(/plank-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 5 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, goods and buttons clear of each other, the toast and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 5, {}, 'mae-kon')
    await expectSceneFills(page, 'kon-canal', viewport)
    await good(page, 'นก').click()
    await check(page).click()
    await expect(toast(page)).toBeVisible()
    if (viewport.height === 390) for (const target of [...(await goods(page).all()), check(page), empty(page)]) await expectTapTarget(target)
    await expectNoDrifterCrosses(page, [goods(page), check(page), empty(page)])
    const message = await stageBox(page, toast(page).locator('> div'))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = await Promise.all([...(await goods(page).all()), check(page), empty(page)].map((c) => stageBox(page, c)))
    for (const box of boxes) {
      expect(overlaps(box, message)).toBe(false)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}

test('keyboard and screen reader: each good is a toggle named by its word and result, Space puts it in the basket', async ({ page }) => {
  await open(page, 5, {}, 'mae-kon')
  await expect(page.getByTestId('fruit-boats')).toHaveAttribute('aria-hidden', 'true')
  await good(page, 'กิน').focus()
  expect(parseFloat(await good(page, 'กิน').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Space')
  await expect(good(page, 'กิน')).toHaveAttribute('aria-pressed', 'true')
  await check(page).focus()
  await page.keyboard.press('Enter')
  await expect(good(page, 'กิน')).toHaveAccessibleName('กิน ถูกต้อง')
})

test('under reduced motion the marks show still and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 5, {}, 'mae-kon')
  await goods(page).first().waitFor()
  await expectSceneStill(page)
  await good(page, 'จาน').click()
  await good(page, 'นก').click()
  await check(page).click()
  await expect(good(page, 'นก')).toHaveAttribute('data-result', 'wrong')
  for (const one of await page.getByTestId('good').all()) await expect(one).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
