import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { gapBetween, overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 6, paper boats to the puddles (#77). src/lessons/mae-kop.ts: the answers in puddle order, the bank order.
const ANSWERS = ['กบ', 'พับ', 'จับ', 'ภาพ', 'เจ็บ', 'อาบ']
const BANK = ['ภาพ', 'อาบ', 'กบ', 'เจ็บ', 'จับ', 'พับ']

const bank = (page: Page) => page.getByRole('group', { name: 'คลังคำ' })
const boat = (page: Page, word: string) => bank(page).getByRole('button', { name: word, exact: true })
const puddle = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^แอ่งที่ ${n}:`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'คะแนน' })
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}').state?.session?.activities?.wordFilling)

async function floatBoat(page: Page, word: string, n: number) {
  await boat(page, word).click()
  await puddle(page, n).click()
  await expect(puddle(page, n)).toHaveAccessibleName(new RegExp(`^แอ่งที่ ${n}: ${word}`))
}

test('six puddles each show a picture reflected in the water; the words ride six paper boats at the bank', async ({ page }) => {
  await open(page, 6, {}, 'mae-kop')
  await expect(bank(page).getByRole('button')).toHaveText(BANK)
  for (let n = 1; n <= 6; n++) {
    await expect(puddle(page, n)).toHaveAccessibleName(`แอ่งที่ ${n}: ว่าง`)
    // A neutral label that does not give the answer away, and the reflection hidden.
    await expect(puddle(page, n).getByRole('img')).toHaveAccessibleName(`ภาพที่ ${n}`)
    await expect(puddle(page, n).locator('img')).toHaveCount(2)
  }
})

test('tap a boat then a puddle: it leaves the bank and appears in the puddle; tapping a floating boat sends it back', async ({ page }) => {
  await open(page, 6, {}, 'mae-kop')
  await boat(page, 'กบ').click()
  await expect(boat(page, 'กบ')).toHaveAttribute('aria-pressed', 'true')
  await puddle(page, 1).click()
  await expect(boat(page, 'กบ')).toHaveCount(0)
  await expect(puddle(page, 1)).toHaveAccessibleName('แอ่งที่ 1: กบ')
  await expect(puddle(page, 1).getByTestId('floating-boat')).toBeVisible()
  // A boat floated onto a full puddle sends the old one back to the bank.
  await floatBoat(page, 'ภาพ', 1)
  await expect(boat(page, 'กบ')).toBeVisible()
  await puddle(page, 1).click()
  await expect(puddle(page, 1)).toHaveAccessibleName('แอ่งที่ 1: ว่าง')
  await expect(boat(page, 'ภาพ')).toBeVisible()
})

test('drag a boat onto a puddle, and from one puddle to another', async ({ page }) => {
  await open(page, 6, {}, 'mae-kop')
  const drag = async (from: ReturnType<typeof boat>, to: ReturnType<typeof boat>) => {
    const a = (await from.boundingBox())!
    const b = (await to.boundingBox())!
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 20, { steps: 3 })
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
    await page.mouse.up()
  }
  await drag(boat(page, 'จับ'), puddle(page, 3))
  await expect(puddle(page, 3)).toHaveAccessibleName('แอ่งที่ 3: จับ')
  await drag(puddle(page, 3).getByTestId('floating-boat'), puddle(page, 5))
  await expect(puddle(page, 3)).toHaveAccessibleName('แอ่งที่ 3: ว่าง')
  await expect(puddle(page, 5)).toHaveAccessibleName('แอ่งที่ 5: จับ')
})

test('only ตรวจคำตอบ checks: one point per puddle out of 6 with the shared scoring; ลองอีกครั้ง clears the wrong ones, ล้างคำตอบ all', async ({ page }) => {
  await open(page, 6, {}, 'mae-kop')
  await floatBoat(page, 'กบ', 1)
  await floatBoat(page, 'อาบ', 2)
  await expect(toast(page)).toHaveCount(0)
  await check(page).click()
  await expect(toast(page)).toContainText('ได้ 1/6 คะแนน')
  await expect(puddle(page, 1)).toHaveAccessibleName('แอ่งที่ 1: กบ ถูก')
  await expect(puddle(page, 2)).toHaveAccessibleName('แอ่งที่ 2: อาบ ผิด')
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 1, maxScore: 6, attemptCount: 1 })

  await page.getByRole('button', { name: 'ลองอีกครั้ง' }).click()
  await expect(puddle(page, 1)).toHaveAccessibleName('แอ่งที่ 1: กบ ถูก')
  await expect(puddle(page, 2)).toHaveAccessibleName('แอ่งที่ 2: ว่าง')
  await expect(page.getByRole('button', { name: 'ลองอีกครั้ง' })).toBeDisabled()
  await page.getByRole('button', { name: 'ล้างคำตอบ' }).click()
  await expect(puddle(page, 1)).toHaveAccessibleName('แอ่งที่ 1: ว่าง')

  for (const [i, word] of ANSWERS.entries()) await floatBoat(page, word, i + 1)
  await expect(bank(page)).toContainText('ลอยเรือครบแล้ว')
  await check(page).click()
  await expect(toast(page)).toContainText('เก่งมาก! ได้ 6/6 คะแนน')
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  expect(await session(page)).toMatchObject({ bestScore: 6, attemptCount: 2 })
})

test('the Game uses only the แม่กบ Kit: nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page, 6, {}, 'mae-kop')
  await floatBoat(page, 'กบ', 1)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const name of ['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ']) await expect(page.getByRole('button', { name })).toHaveClass(/vinyl-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 6 at ${viewport.width}×${viewport.height}: the drizzle fills the window, controls clear of each other, the toast and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 6, {}, 'mae-kop')
    await expectSceneFills(page, 'kop-drizzle', viewport)
    await floatBoat(page, 'อาบ', 1)
    await check(page).click()
    await expect(toast(page)).toBeVisible()
    const puddles = [1, 2, 3, 4, 5, 6].map((n) => puddle(page, n))
    const controls = [...puddles, ...(await bank(page).getByRole('button').all()), ...['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ'].map((name) => page.getByRole('button', { name }))]
    if (viewport.height === 390) for (const control of controls) await expectTapTarget(control)
    await expectNoDropCrosses(page, controls)
    const message = await stageBox(page, toast(page).locator('> div'))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = await Promise.all(controls.map((c) => stageBox(page, c)))
    for (const [i, box] of boxes.entries()) {
      expect(overlaps(box, message), `control ${i}`).toBe(false)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
    for (let i = 0; i < 5; i++) expect(gapBetween(boxes[i]!, boxes[i + 1]!)).toBeGreaterThan(10)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}

test('keyboard alone floats every boat and scores full marks', async ({ page }) => {
  await open(page, 6, {}, 'mae-kop')
  for (const [i, word] of ANSWERS.entries()) {
    await boat(page, word).focus()
    expect(parseFloat(await boat(page, word).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await puddle(page, i + 1).focus()
    await page.keyboard.press('Enter')
  }
  await check(page).focus()
  await page.keyboard.press('Enter')
  await expect(toast(page)).toContainText('6/6')
})

test('under reduced motion the boats jump to their puddles and the check does not shake', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 6, {}, 'mae-kop')
  await bank(page).waitFor()
  await expectSceneStill(page)
  await floatBoat(page, 'อาบ', 1)
  await check(page).click()
  await expect(puddle(page, 1)).toHaveAccessibleName(/ผิด$/)
  await expect(puddle(page, 1).locator('..')).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
