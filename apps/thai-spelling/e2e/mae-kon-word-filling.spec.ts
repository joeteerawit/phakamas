import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { gapBetween, overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 6, name the boats (#105). src/lessons/mae-kon.ts: the answers in boat order, the bank order.
const ANSWERS = ['จาน', 'ช้อน', 'ร้าน', 'กิน', 'คน', 'บ้าน']
const BANK = ['บ้าน', 'กิน', 'จาน', 'คน', 'ช้อน', 'ร้าน']

const bank = (page: Page) => page.getByRole('group', { name: 'คลังคำ' })
const board = (page: Page, word: string) => bank(page).getByRole('button', { name: word, exact: true })
const boat = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^เรือลำที่ ${n}:`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'คะแนน' })
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}').state?.session?.activities?.wordFilling)

async function nameBoat(page: Page, word: string, n: number) {
  await board(page, word).click()
  await boat(page, n).click()
  await expect(boat(page, n)).toHaveAccessibleName(new RegExp(`^เรือลำที่ ${n}: ${word}`))
}

async function drag(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 20, { steps: 3 })
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
  await page.mouse.up()
}

test('six boats are tied at the mooring, each with its cargo picture and a blank name board; the Word Bank hangs on a pier post', async ({ page }) => {
  await open(page, 6, {}, 'mae-kon')
  await expect(bank(page).getByRole('button')).toHaveText(BANK)
  await expect(page.getByTestId('pier-post')).toBeVisible()
  const boxes = []
  for (let n = 1; n <= 6; n++) {
    await expect(boat(page, n)).toHaveAccessibleName(`เรือลำที่ ${n}: ยังไม่มีชื่อ`)
    // A neutral label that does not give the answer away.
    await expect(boat(page, n).getByRole('img')).toHaveAccessibleName(`ภาพที่ ${n}`)
    boxes.push(await stageBox(page, boat(page, n)))
  }
  // Two rows of three.
  for (const row of [0, 3]) for (let i = row + 1; i < row + 3; i++) expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[row]!.top))
  expect(boxes[3]!.top).toBeGreaterThan(boxes[0]!.bottom)
  // No board starts out over its own boat.
  BANK.forEach((word, i) => expect(word).not.toBe(ANSWERS[i]))
})

test('tap a board then a boat to name it; a new name sends the old board back, and tapping a named boat sends its board back', async ({ page }) => {
  await open(page, 6, {}, 'mae-kon')
  await board(page, 'จาน').click()
  await expect(board(page, 'จาน')).toHaveAttribute('aria-pressed', 'true')
  await boat(page, 1).click()
  await expect(board(page, 'จาน')).toHaveCount(0)
  await expect(boat(page, 1)).toHaveAccessibleName('เรือลำที่ 1: จาน')
  await expect(boat(page, 1).getByTestId('boat-name')).toBeVisible()
  await nameBoat(page, 'บ้าน', 1)
  await expect(board(page, 'จาน')).toBeVisible()
  await boat(page, 1).click()
  await expect(boat(page, 1)).toHaveAccessibleName('เรือลำที่ 1: ยังไม่มีชื่อ')
  await expect(board(page, 'บ้าน')).toBeVisible()
})

test('drag a board to a boat, from one boat to another, and back to the post', async ({ page }) => {
  await open(page, 6, {}, 'mae-kon')
  await drag(page, board(page, 'ร้าน'), boat(page, 3))
  await expect(boat(page, 3)).toHaveAccessibleName('เรือลำที่ 3: ร้าน')
  await drag(page, boat(page, 3).getByTestId('boat-name'), boat(page, 5))
  await expect(boat(page, 3)).toHaveAccessibleName('เรือลำที่ 3: ยังไม่มีชื่อ')
  await expect(boat(page, 5)).toHaveAccessibleName('เรือลำที่ 5: ร้าน')
  await drag(page, boat(page, 5).getByTestId('boat-name'), bank(page))
  await expect(board(page, 'ร้าน')).toBeVisible()
})

test('only ตรวจคำตอบ checks: one point per boat out of 6 with the shared scoring; a right boat raises a coral flag; ลองอีกครั้ง and ล้างคำตอบ', async ({ page }) => {
  await open(page, 6, {}, 'mae-kon')
  await nameBoat(page, 'จาน', 1)
  await nameBoat(page, 'บ้าน', 2)
  await expect(toast(page)).toHaveCount(0)
  await check(page).click()
  await expect(toast(page)).toContainText('ได้ 1/6 คะแนน')
  await expect(boat(page, 1)).toHaveAccessibleName('เรือลำที่ 1: จาน ถูก')
  await expect(boat(page, 2)).toHaveAccessibleName('เรือลำที่ 2: บ้าน ผิด')
  await expect(page.getByTestId('coral-flag')).toHaveCount(1)
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 1, maxScore: 6, attemptCount: 1 })

  await page.getByRole('button', { name: 'ลองอีกครั้ง' }).click()
  await expect(boat(page, 1)).toHaveAccessibleName('เรือลำที่ 1: จาน ถูก')
  await expect(boat(page, 2)).toHaveAccessibleName('เรือลำที่ 2: ยังไม่มีชื่อ')
  await expect(page.getByRole('button', { name: 'ลองอีกครั้ง' })).toBeDisabled()
  await page.getByRole('button', { name: 'ล้างคำตอบ' }).click()
  await expect(boat(page, 1)).toHaveAccessibleName('เรือลำที่ 1: ยังไม่มีชื่อ')
  await expect(page.getByTestId('coral-flag')).toHaveCount(0)

  for (const [i, word] of ANSWERS.entries()) await nameBoat(page, word, i + 1)
  await expect(bank(page)).toContainText('ตั้งชื่อเรือครบแล้ว')
  await check(page).click()
  await expect(toast(page)).toContainText('เก่งมาก! ได้ 6/6 คะแนน')
  await expect(page.getByTestId('coral-flag')).toHaveCount(6)
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  expect(await session(page)).toMatchObject({ bestScore: 6, attemptCount: 2 })
})

test('the Game uses only the แม่กน Kit: nothing from another Lesson', async ({ page }) => {
  await open(page, 6, {}, 'mae-kon')
  await nameBoat(page, 'จาน', 1)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const name of ['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ']) await expect(page.getByRole('button', { name })).toHaveClass(/plank-button/)
  await expect(boat(page, 2).locator('.bamboo-tray')).toHaveCount(1)
})

for (const viewport of VIEWPORTS) {
  test(`Step 6 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, controls clear of each other, the toast and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 6, {}, 'mae-kon')
    await expectSceneFills(page, 'kon-canal', viewport)
    await nameBoat(page, 'บ้าน', 1)
    await check(page).click()
    await expect(toast(page)).toBeVisible()
    const boats = [1, 2, 3, 4, 5, 6].map((n) => boat(page, n))
    const controls = [...boats, ...(await bank(page).getByRole('button').all()), ...['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ'].map((name) => page.getByRole('button', { name }))]
    if (viewport.height === 390) for (const c of controls) await expectTapTarget(c)
    await expectNoDrifterCrosses(page, controls)
    const message = await stageBox(page, toast(page).locator('> div'))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = await Promise.all(controls.map((c) => stageBox(page, c)))
    for (const [i, box] of boxes.entries()) {
      expect(overlaps(box, message), `control ${i}`).toBe(false)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
    for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) expect(gapBetween(a, b)).toBeGreaterThan(4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}

test('keyboard alone names every boat and scores full marks', async ({ page }) => {
  await open(page, 6, {}, 'mae-kon')
  for (const [i, word] of ANSWERS.entries()) {
    await board(page, word).focus()
    expect(parseFloat(await board(page, word).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await boat(page, i + 1).focus()
    await page.keyboard.press('Enter')
  }
  await check(page).focus()
  await page.keyboard.press('Enter')
  await expect(toast(page)).toContainText('6/6')
})

test('under reduced motion the boards jump to their boats, the flag simply stands and the check does not shake', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 6, {}, 'mae-kon')
  await bank(page).waitFor()
  await expectSceneStill(page)
  await nameBoat(page, 'บ้าน', 1)
  await nameBoat(page, 'ช้อน', 2)
  await check(page).click()
  await expect(boat(page, 1)).toHaveAccessibleName(/ผิด$/)
  await expect(boat(page, 1).locator('..')).toHaveCSS('transform', 'none')
  await expect(page.getByTestId('coral-flag')).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
