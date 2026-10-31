import { expect, type Locator, type Page, test } from '@playwright/test'

// Picture order on Step 6 (src/lessons/mae-kong.ts wordFilling.pictures).
const ANSWERS = ['ช้าง', 'ดัง', 'ลิง', 'ค้างคาว', 'รัง', 'กางเกง']

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
  await expect(bank(page).getByRole('button')).toHaveText(['ลิง', 'ช้าง', 'รัง', 'กางเกง', 'ดัง', 'ค้างคาว'])
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
  await place(page, 'ช้าง', 1)
  await place(page, 'ลิง', 2)
  await check(page).click()

  await expect(slot(page, 1)).toHaveAccessibleName('ช่องที่ 1: ช้าง ถูก')
  await expect(slot(page, 2)).toHaveAccessibleName('ช่องที่ 2: ลิง ผิด')
  await expect(slot(page, 3)).toHaveAccessibleName('ช่องที่ 3: ว่าง ผิด')
  await expect(page.getByRole('status')).toContainText('1/6')
  expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 1, maxScore: 6, attemptCount: 1 })
})

test('ลองอีกครั้ง clears only wrong blanks; ล้างคำตอบ clears all', async ({ page }) => {
  await place(page, 'ช้าง', 1)
  await place(page, 'ลิง', 2)
  await check(page).click()
  await page.getByRole('button', { name: 'ลองอีกครั้ง' }).click()
  await expect(slot(page, 1)).toHaveAccessibleName('ช่องที่ 1: ช้าง ถูก')
  await expect(slot(page, 2)).toHaveAccessibleName('ช่องที่ 2: ว่าง')
  await expect(bankWord(page, 'ลิง')).toBeVisible()

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
  await page.setViewportSize({ width: 1280, height: 1400 }) // keep bank and blanks on screen for raw mouse input
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

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await place(page, 'กางเกง', 6)
  await check(page).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
})
