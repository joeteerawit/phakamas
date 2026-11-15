import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 6, pot the seedlings (#91). src/lessons/mae-kok.ts: the pictures' answers in order, and the bank.
const ANSWERS = ['นก', 'ผัก', 'ดอก', 'เด็ก', 'ปาก', 'แบก']
const BANK = ['ปาก', 'แบก', 'นก', 'ผัก', 'เด็ก', 'ดอก']

const tray = (page: Page) => page.getByRole('group', { name: 'คลังคำ' })
const seedling = (page: Page, word: string) => tray(page).getByRole('button', { name: word, exact: true })
const pot = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^กระถางที่ ${n}:`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const score = (page: Page) => page.getByRole('status').filter({ hasText: 'คะแนน' })

async function dragTo(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
  await page.mouse.up()
}

async function potByTap(page: Page, word: string, n: number) {
  await seedling(page, word).click()
  await pot(page, n).click()
  await expect(pot(page, n)).toHaveAccessibleName(new RegExp(`^กระถางที่ ${n}: ${word}`))
}

test('six terracotta pots in two rows of three, each with a picture tag, and the six seedlings in the seed tray', async ({ page }) => {
  await open(page, 6, {}, 'mae-kok')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('กล่องคำแม่กก')
  await expect(page.getByTestId('pot')).toHaveCount(6)
  for (let n = 1; n <= 6; n++) {
    await expect(pot(page, n)).toHaveAccessibleName(`กระถางที่ ${n}: ว่าง`)
    await expect(pot(page, n).getByTestId('pot-tag')).toHaveClass(/seed-packet/)
  }
  await expect(tray(page).getByRole('button')).toHaveText(BANK)
  const rows = new Set(await Promise.all([1, 2, 3, 4, 5, 6].map(async (n) => Math.round((await stageBox(page, pot(page, n))).top))))
  expect(rows.size).toBe(2)
})

test('tap a seedling, then a pot: it leaves the tray and opens its second leaf in the pot; tapping it sends it back', async ({ page }) => {
  await open(page, 6, {}, 'mae-kok')
  await seedling(page, 'นก').click()
  await expect(seedling(page, 'นก')).toHaveAttribute('aria-pressed', 'true')
  await pot(page, 1).click()
  await expect(pot(page, 1)).toHaveAccessibleName('กระถางที่ 1: นก')
  await expect(pot(page, 1).locator('[data-leaves="2"]')).toBeVisible()
  await expect(seedling(page, 'นก')).toHaveCount(0)
  await pot(page, 1).click()
  await expect(pot(page, 1)).toHaveAccessibleName('กระถางที่ 1: ว่าง')
  await expect(seedling(page, 'นก')).toBeVisible()
})

test('dragging a seedling pots it; a full pot sends its old seedling back to the tray', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 6, {}, 'mae-kok')
  await dragTo(page, seedling(page, 'ผัก'), pot(page, 2))
  await expect(pot(page, 2)).toHaveAccessibleName('กระถางที่ 2: ผัก')
  await dragTo(page, seedling(page, 'ดอก'), pot(page, 2))
  await expect(pot(page, 2)).toHaveAccessibleName('กระถางที่ 2: ดอก')
  await expect(seedling(page, 'ผัก')).toBeVisible()
})

test('ตรวจคำตอบ scores one point per pot out of 6; ลองอีกครั้ง clears only the wrong pots, ล้างคำตอบ all of them', async ({ page }) => {
  await open(page, 6, {}, 'mae-kok')
  await potByTap(page, 'นก', 1)
  await potByTap(page, 'ปาก', 2)
  await check(page).click()
  await expect(score(page)).toContainText('ได้ 1/6 คะแนน')
  await expect(pot(page, 1)).toHaveAccessibleName('กระถางที่ 1: นก ถูก')
  await expect(pot(page, 2)).toHaveAccessibleName('กระถางที่ 2: ปาก ผิด')
  await page.getByRole('button', { name: 'ลองอีกครั้ง' }).click()
  await expect(pot(page, 1)).toHaveAccessibleName('กระถางที่ 1: นก ถูก')
  await expect(pot(page, 2)).toHaveAccessibleName('กระถางที่ 2: ว่าง')
  await page.getByRole('button', { name: 'ล้างคำตอบ' }).click()
  await expect(pot(page, 1)).toHaveAccessibleName('กระถางที่ 1: ว่าง')
})

test('all six right gives 3 seed-stars with the shared celebration', async ({ page }) => {
  await open(page, 6, {}, 'mae-kok')
  for (const [i, word] of ANSWERS.entries()) await potByTap(page, word, i + 1)
  await expect(tray(page)).toContainText('ปลูกครบแล้ว')
  await check(page).click()
  await expect(score(page)).toContainText('เก่งมาก! ได้ 6/6 คะแนน')
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page, 6, {}, 'mae-kok')
  await potByTap(page, 'นก', 1)
  await check(page).click()
  expect(await otherLook(wholeStage(page))).toEqual([])
})

for (const viewport of VIEWPORTS) {
  test(`Step 6 at ${viewport.width}×${viewport.height}: the terrace fills the window, nothing moving crosses the shelf or tray, the toast keeps clear, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 6, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-terrace', viewport)
    const buttons = [check(page), page.getByRole('button', { name: 'ลองอีกครั้ง' }), page.getByRole('button', { name: 'ล้างคำตอบ' })]
    const pots = [1, 2, 3, 4, 5, 6].map((n) => pot(page, n))
    if (viewport.height === 390) for (const target of [...pots, ...(await tray(page).getByRole('button').all()), ...buttons.slice(0, 1), buttons[2]!]) await expectTapTarget(target)
    await expectNothingMovingCrosses(page, [...pots, tray(page), ...buttons])
    await potByTap(page, 'นก', 1)
    await check(page).click()
    const toast = await stageBox(page, score(page).locator('> div'))
    for (const target of [...pots, tray(page), ...buttons]) expect(overlaps(await stageBox(page, target), toast)).toBe(false)
    const corners = await Promise.all(['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [...pots, tray(page), ...buttons]) for (const c of corners) expect(overlaps(await stageBox(page, target), c)).toBe(false)
  })
}

test('keyboard and screen reader: seedlings are toggle buttons in the คลังคำ group, pots name their word, Enter pots it', async ({ page }) => {
  await open(page, 6, {}, 'mae-kok')
  await seedling(page, 'เด็ก').focus()
  expect(parseFloat(await seedling(page, 'เด็ก').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await pot(page, 4).focus()
  await page.keyboard.press('Enter')
  await expect(pot(page, 4)).toHaveAccessibleName('กระถางที่ 4: เด็ก')
  await expect(pot(page, 4).getByRole('img', { name: 'ภาพที่ 4' })).toBeAttached()
})

test('under reduced motion seedlings jump to their pots, nothing shakes and the Scene is still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 6, {}, 'mae-kok')
  await tray(page).waitFor()
  await expectSceneStill(page)
  await potByTap(page, 'ปาก', 1)
  await check(page).click()
  await expect(pot(page, 1)).toHaveAccessibleName('กระถางที่ 1: ปาก ผิด')
  await expect.poll(() => running(page)).toBe(0)
})
