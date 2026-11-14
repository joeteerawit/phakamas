import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 5, bring in the washing (#76). src/lessons/mae-kop.ts: the twelve cards in line order.
const CHOICES = ['ใบไม้', 'กบ', 'จูบ', 'พับ', 'ปู', 'จับ', 'ภาพ', 'ร่ม', 'ดาบ', 'เจ็บ', 'บ้าน', 'อาบ']
const MAE_KOP = ['กบ', 'จูบ', 'พับ', 'จับ', 'ภาพ', 'ดาบ', 'เจ็บ', 'อาบ']

const card = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const cards = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const restart = (page: Page) => page.getByRole('button', { name: 'เริ่มใหม่' })
const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'คะแนน' })
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}').state?.session?.activities?.wordSelection)

test('twelve picture cards hang still on two washing lines of six, each on a grey peg', async ({ page }) => {
  await open(page, 5, {}, 'mae-kop')
  await expect(cards(page)).toHaveCount(12)
  const boxes = []
  for (const [i, word] of CHOICES.entries()) {
    const one = cards(page).nth(i)
    await expect(one).toHaveAccessibleName(word)
    await expect(one).toHaveAttribute('aria-pressed', 'false')
    await expect(one.getByTestId('peg')).not.toHaveAttribute('data-selected')
    await expect(one.getByTestId('basket')).toHaveCount(0)
    boxes.push(await stageBox(page, one))
  }
  // Two lines of six, left to right.
  for (const line of [0, 6]) {
    for (let i = line + 1; i < line + 6; i++) {
      expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[line]!.top))
      expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
    }
  }
  expect(boxes[6]!.top).toBeGreaterThan(boxes[0]!.bottom)
})

test('tapping a card plays its word, swaps its peg for a yellow one and pins a basket; tapping again undoes it, nothing moves', async ({ page }) => {
  await open(page, 5, {}, 'mae-kop')
  const before = await stageBox(page, card(page, 'กบ'))
  await card(page, 'กบ').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/kop.mp3'])
  await expect(card(page, 'กบ')).toHaveAttribute('aria-pressed', 'true')
  await expect(card(page, 'กบ').getByTestId('peg')).toHaveAttribute('data-selected', 'true')
  await expect(card(page, 'กบ').getByTestId('peg').locator('rect')).toHaveAttribute('fill', 'var(--color-raincoat)')
  await expect(card(page, 'กบ').getByTestId('basket')).toBeVisible()
  expect(await stageBox(page, card(page, 'กบ'))).toEqual(before)
  await card(page, 'กบ').click()
  await expect(card(page, 'กบ')).toHaveAttribute('aria-pressed', 'false')
  await expect(card(page, 'กบ').getByTestId('basket')).toHaveCount(0)
})

test('ตรวจคำตอบ scores each card as one Decision out of 12 with the shared scoring, and full marks earn 3 Stars', async ({ page }) => {
  await open(page, 5, {}, 'mae-kop')
  await card(page, 'กบ').click()
  await card(page, 'ปู').click()
  await check(page).click()
  // กบ right, ปู wrong, the other seven แม่กบ cards missed: 12 − 8 = 4.
  await expect(toast(page)).toContainText('ได้ 4/12 คะแนน')
  await expect(card(page, 'กบ')).toHaveAccessibleName('กบ ถูกต้อง')
  await expect(card(page, 'ปู')).toHaveAccessibleName('ปู เลือกผิด')
  await expect(card(page, 'อาบ')).toHaveAccessibleName('อาบ ลืมเลือก')
  await expect(card(page, 'ร่ม')).toHaveAccessibleName('ร่ม')
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 4, maxScore: 12, attemptCount: 1 })
  await expect(page.getByTestId('star-counter')).toHaveText(/1\/9/)

  // Changing a card clears its mark; เริ่มใหม่ clears all.
  await card(page, 'ปู').click()
  await expect(card(page, 'ปู')).toHaveAccessibleName('ปู')
  await restart(page).click()
  for (const word of CHOICES) await expect(card(page, word)).toHaveAttribute('aria-pressed', 'false')

  for (const word of MAE_KOP) await card(page, word).click()
  await check(page).click()
  await expect(toast(page)).toContainText('เก่งมาก! ได้ 12/12 คะแนน')
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  expect(await session(page)).toMatchObject({ bestScore: 12, attemptCount: 2 })
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
})

test('ถัดไป without checking marks the Activity skipped, as on every Lesson', async ({ page }) => {
  await open(page, 5, {}, 'mae-kop')
  await card(page, 'กบ').click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/6$/)
  expect(await session(page)).toMatchObject({ status: 'skipped', bestScore: 0 })
})

test('the Game uses only the แม่กบ Kit: raincoat-pocket cards and vinyl pills, nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page, 5, {}, 'mae-kop')
  await card(page, 'กบ').click()
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const one of await page.getByTestId('washing-card').all()) await expect(one).toHaveClass(/pocket-card/)
  for (const control of [check(page), restart(page)]) await expect(control).toHaveClass(/vinyl-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 5 at ${viewport.width}×${viewport.height}: the drizzle fills the window, cards and pills clear of each other, the toast and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 5, {}, 'mae-kop')
    await expectSceneFills(page, 'kop-drizzle', viewport)
    await card(page, 'ปู').click()
    await check(page).click()
    await expect(toast(page)).toBeVisible()
    if (viewport.height === 390) for (const target of [...(await cards(page).all()), check(page), restart(page)]) await expectTapTarget(target)
    await expectNoDropCrosses(page, [cards(page), check(page), restart(page)])
    const message = await stageBox(page, toast(page).locator('> div'))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = await Promise.all([...(await cards(page).all()), check(page), restart(page)].map((c) => stageBox(page, c)))
    for (const box of boxes) {
      expect(overlaps(box, message)).toBe(false)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
    // No horizontal scroll.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}

test('keyboard and screen reader: each card is a toggle named by its word and result, Space brings it in', async ({ page }) => {
  await open(page, 5, {}, 'mae-kop')
  await expect(page.getByTestId('washing-lines')).toHaveAttribute('aria-hidden', 'true')
  await card(page, 'จับ').focus()
  expect(parseFloat(await card(page, 'จับ').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Space')
  await expect(card(page, 'จับ')).toHaveAttribute('aria-pressed', 'true')
  await check(page).focus()
  await page.keyboard.press('Enter')
  await expect(card(page, 'จับ')).toHaveAccessibleName('จับ ถูกต้อง')
})

test('under reduced motion the marks show still and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 5, {}, 'mae-kop')
  await cards(page).first().waitFor()
  await expectSceneStill(page)
  await card(page, 'กบ').click()
  await card(page, 'ปู').click()
  await check(page).click()
  await expect(card(page, 'ปู')).toHaveAttribute('data-result', 'wrong')
  for (const one of await page.getByTestId('washing-card').all()) await expect(one).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
