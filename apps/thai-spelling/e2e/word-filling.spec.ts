import { expect, type Locator, type Page, test } from '@playwright/test'
import { gapBetween, overlaps, renderedFontSize, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// Picture order on Step 6 (src/lessons/mae-kong.ts wordFilling.pictures).
const ANSWERS = ['ลิง', 'ช้าง', 'ดัง', 'รัง', 'ค่าง', 'ผึ้ง']

const bank = (page: Page) => page.getByRole('group', { name: 'คลังคำ' })
const bankWord = (page: Page, word: string) => bank(page).getByRole('button', { name: word, exact: true })
const slot = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ช่องที่ ${n}:`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const activity = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')?.state.session?.activities.wordFilling,
  )

async function place(page: Page, word: string, n: number) {
  await bankWord(page, word).click()
  await slot(page, n).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/lesson/mae-kong/6')
})

test('shows the 6-word bank and 6 empty picture blanks', async ({ page }) => {
  await expect(bank(page).getByRole('button')).toHaveText(['รัง', 'ดัง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ค่าง'])
  for (let n = 1; n <= 6; n++) await expect(slot(page, n)).toHaveAccessibleName(`ช่องที่ ${n}: ว่าง`)
})

test('TC-008: a placed word leaves the bank; tapping it in the blank returns it', async ({ page }) => {
  await bankWord(page, 'ลิง').click()
  await expect(bankWord(page, 'ลิง')).toHaveAttribute('aria-pressed', 'true')
  await slot(page, 3).click()
  await expect(slot(page, 3)).toHaveAccessibleName('ช่องที่ 3: ลิง')
  await expect(bankWord(page, 'ลิง')).toHaveCount(0)

  await slot(page, 3).click()
  await expect(slot(page, 3)).toHaveAccessibleName('ช่องที่ 3: ว่าง')
  await expect(bankWord(page, 'ลิง')).toBeVisible()
})

test('placing on a filled blank sends the old word back to the bank', async ({ page }) => {
  await place(page, 'ลิง', 1)
  await place(page, 'ช้าง', 1)
  await expect(slot(page, 1)).toHaveAccessibleName('ช่องที่ 1: ช้าง')
  await expect(bankWord(page, 'ลิง')).toBeVisible()
})

test('TC-009: ตรวจคำตอบ marks each blank right or wrong and saves the score', async ({ page }) => {
  await place(page, 'ลิง', 1)
  await place(page, 'ดัง', 2)
  await check(page).click()

  await expect(slot(page, 1)).toHaveAccessibleName('ช่องที่ 1: ลิง ถูก')
  await expect(slot(page, 2)).toHaveAccessibleName('ช่องที่ 2: ดัง ผิด')
  await expect(slot(page, 3)).toHaveAccessibleName('ช่องที่ 3: ว่าง ผิด')
  await expect(page.getByRole('status')).toContainText('1/6')
  expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 1, maxScore: 6, attemptCount: 1 })
})

test('ลองอีกครั้ง clears only wrong blanks; ล้างคำตอบ clears all', async ({ page }) => {
  await place(page, 'ลิง', 1)
  await place(page, 'ดัง', 2)
  await check(page).click()
  await page.getByRole('button', { name: 'ลองอีกครั้ง' }).click()
  await expect(slot(page, 1)).toHaveAccessibleName('ช่องที่ 1: ลิง ถูก')
  await expect(slot(page, 2)).toHaveAccessibleName('ช่องที่ 2: ว่าง')
  await expect(bankWord(page, 'ดัง')).toBeVisible()

  await page.getByRole('button', { name: 'ล้างคำตอบ' }).click()
  await expect(slot(page, 1)).toHaveAccessibleName('ช่องที่ 1: ว่าง')
  await expect(bank(page).getByRole('button')).toHaveCount(6)
})

test('keyboard alone completes the Activity with full marks', async ({ page }) => {
  for (const [i, word] of ANSWERS.entries()) {
    await bankWord(page, word).focus()
    await page.keyboard.press('Enter')
    await slot(page, i + 1).focus()
    await page.keyboard.press('Space')
  }
  await check(page).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('6/6')
  expect(await activity(page)).toMatchObject({ bestScore: 6, attemptCount: 1 })
})

test('dragging a word onto a blank places it, and drags move it between blanks', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 }) // keep bank and blanks inside the stage for raw mouse input
  const drag = async (from: Locator, to: Locator) => {
    const a = (await from.boundingBox())!
    const b = (await to.boundingBox())!
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
    await page.mouse.up()
  }
  await drag(bankWord(page, 'รัง'), slot(page, 5))
  await expect(slot(page, 5)).toHaveAccessibleName('ช่องที่ 5: รัง')
  await expect(bankWord(page, 'รัง')).toHaveCount(0)

  await drag(slot(page, 5), slot(page, 6))
  await expect(slot(page, 5)).toHaveAccessibleName('ช่องที่ 5: ว่าง')
  await expect(slot(page, 6)).toHaveAccessibleName('ช่องที่ 6: รัง')
})

test('ถัดไป without checking records the Activity as skipped', async ({ page }) => {
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/7$/)
  expect(await activity(page)).toMatchObject({ status: 'skipped', bestScore: 0, maxScore: 6, attemptCount: 0 })
})

test('no horizontal scroll on a 740×360 landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 })
  await place(page, 'ผึ้ง', 6)
  await check(page).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(740)
})

test('chips, slots and controls are ≥44px tap targets on a 390px-tall landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  const targets = [bankWord(page, 'รัง'), slot(page, 1), check(page), page.getByRole('button', { name: 'ล้างคำตอบ' })]
  for (const target of targets) await expectTapTarget(target)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`ลองอีกครั้ง and ล้างคำตอบ stay clear of each other and the bank at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const retry = page.getByRole('button', { name: 'ลองอีกครั้ง' })
    const clear = page.getByRole('button', { name: 'ล้างคำตอบ' })
    const [a, b, words] = await Promise.all([stageBox(page, retry), stageBox(page, clear), stageBox(page, bank(page))])
    // More than the 8px hard shadow, so a gap stays visible.
    const GAP = 24
    expect(overlaps(a, b), 'the controls overlap').toBe(false)
    expect(b.top - a.bottom, 'gap between the controls').toBeGreaterThanOrEqual(GAP)
    for (const [name, box] of [['ลองอีกครั้ง', a], ['ล้างคำตอบ', b]] as const) {
      expect(overlaps(box, words), `${name} overlaps the bank`).toBe(false)
      expect(words.left - box.right, `${name} gap to the bank`).toBeGreaterThanOrEqual(GAP)
    }
    if (viewport.height === 390) for (const control of [retry, clear]) await expectTapTarget(control)
  })
}

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`ตรวจคำตอบ is at least 40 stage px from Next at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const [button, next] = await Promise.all([stageBox(page, check(page)), stageBox(page, page.getByRole('link', { name: 'ถัดไป' }))])
    expect(gapBetween(button, next), 'ตรวจคำตอบ to Next').toBeGreaterThanOrEqual(40)
  })
}

test('control text is at least 15px on a 390px-tall phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  for (const name of ['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ']) {
    expect(await renderedFontSize(page, page.getByRole('button', { name })), `${name} CSS px`).toBeGreaterThanOrEqual(15)
  }
})

test('on a 390px-tall phone the toast clears the controls and picture cards', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  // 1/6 gives the longest Step 6 message.
  await place(page, 'ลิง', 1)
  await check(page).click()
  const toast = page.getByRole('status').locator('> div')
  await expect(toast).toContainText('กดลองอีกครั้ง')
  await waitUntilStill(toast)
  expect(await renderedFontSize(page, toast.locator('p')), 'toast text CSS px').toBeGreaterThanOrEqual(16)
  const at = await stageBox(page, toast)
  for (const name of ['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ']) {
    expect(overlaps(at, await stageBox(page, page.getByRole('button', { name }))), `toast covers ${name}`).toBe(false)
  }
  for (let n = 1; n <= 6; n++) expect(overlaps(at, await stageBox(page, slot(page, n))), `toast covers card ${n}`).toBe(false)
})

test('a placed chip flies to its slot; with reduced motion it jumps there', async ({ page }) => {
  const transform = (n: number) => slot(page, n).locator('[data-word]').evaluate((el) => getComputedStyle(el).transform)
  await place(page, 'ลิง', 1)
  expect(await transform(1)).not.toBe('none')
  await expect.poll(() => transform(1)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await place(page, 'ช้าง', 2)
  expect(await transform(2)).toBe('none')
})

test('each picture has a neutral screen-reader label that does not give the answer away', async ({ page }) => {
  const pictures = page.getByRole('img', { name: /^ภาพที่ \d$/ })
  await expect(pictures).toHaveCount(6)
  for (let n = 1; n <= 6; n++) await expect(pictures.nth(n - 1)).toHaveAccessibleName(`ภาพที่ ${n}`)
})
