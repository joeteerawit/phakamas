import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 5, harvest the แม่กก plants (#90). src/lessons/mae-kok.ts: the twelve choices in order.
const CHOICES = ['ไก่', 'นก', 'หมวก', 'ผัก', 'แก้ว', 'ดอก', 'เด็ก', 'กบ', 'โลก', 'ปาก', 'ช้าง', 'แบก']
const MAE_KOK = ['นก', 'หมวก', 'ผัก', 'ดอก', 'เด็ก', 'โลก', 'ปาก', 'แบก']

const plants = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const plant = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const restart = (page: Page) => page.getByRole('button', { name: 'เริ่มใหม่' })
const score = (page: Page) => page.getByRole('status').filter({ hasText: 'คะแนน' })

test('twelve plants stand still in two terrace rows of six, each with a seed-packet picture tag', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('แม่กกอยู่ไหน?')
  await expect(plants(page)).toHaveCount(12)
  await expect(plants(page)).toHaveText(CHOICES)
  await expect(page.getByTestId('terrace-row')).toHaveCount(2)
  const tops = new Set<number>()
  for (const one of await plants(page).all()) {
    await expect(one).toHaveAttribute('aria-pressed', 'false')
    await expect(one.getByTestId('plant-tag')).toHaveClass(/seed-packet/)
    tops.add(Math.round((await stageBox(page, one)).top))
  }
  expect(tops.size).toBe(2)
})

test('tapping a plant plays its word and harvests it where it stands, roots showing, into the basket at its foot; tapping again plants it back', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  const one = plant(page, 'หมวก')
  const before = await stageBox(page, one)
  await one.click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/muak.mp3'])
  await expect(one).toHaveAttribute('aria-pressed', 'true')
  await expect(one.getByTestId('roots')).toBeVisible()
  await expect(one.getByTestId('basket')).toBeVisible()
  await waitUntilStill(one.getByTestId('plant'))
  // It lifts in place: the button never moves, the plant rises a little above its spot.
  const after = await stageBox(page, one)
  expect(after.left).toBeCloseTo(before.left, 0)
  const lifted = await stageBox(page, one.getByTestId('plant'))
  expect(lifted.top).toBeLessThan(before.top)
  await one.click()
  await expect(one).toHaveAttribute('aria-pressed', 'false')
  await expect(one.getByTestId('basket')).toHaveCount(0)
})

test('ตรวจคำตอบ scores each plant as one Decision out of 12 and marks it right, wrong or missed, never by colour alone', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  for (const word of ['นก', 'หมวก', 'ไก่']) await plant(page, word).click()
  await check(page).click()
  // นก, หมวก right; ไก่ wrong; ผัก ดอก เด็ก โลก ปาก แบก missed; แก้ว กบ ช้าง right to leave: 12 − 7 = 5.
  await expect(score(page)).toContainText('ได้ 5/12 คะแนน')
  await expect(plant(page, 'นก')).toHaveAttribute('data-result', 'right')
  await expect(plant(page, 'นก')).toContainText('ถูกต้อง')
  await expect(plant(page, 'ไก่')).toHaveAttribute('data-result', 'wrong')
  await expect(plant(page, 'ไก่')).toContainText('เลือกผิด')
  await expect(plant(page, 'ผัก')).toHaveAttribute('data-result', 'missed')
  await expect(plant(page, 'ผัก')).toContainText('ลืมเลือก')
  await expect(plant(page, 'แก้ว')).not.toHaveAttribute('data-result')
  await expect(page.getByTestId('star-counter')).toHaveText(/1\/9/)
  // Still editable: a changed plant loses its mark.
  await plant(page, 'ไก่').click()
  await expect(plant(page, 'ไก่')).not.toHaveAttribute('data-result')
  await restart(page).click()
  for (const one of await plants(page).all()) await expect(one).toHaveAttribute('aria-pressed', 'false')
})

test('full marks give 3 seed-stars with the shared เก่งมาก! burst and น้องนก cheering, and mark the stop done', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  for (const word of MAE_KOK) await plant(page, word).click()
  await check(page).click()
  await expect(score(page)).toContainText('เก่งมาก! ได้ 12/12 คะแนน')
  const celebration = page.getByTestId('celebration')
  await expect(celebration).toContainText('ได้ 3 ดาว')
  await expect(page.getByTestId('comic-burst')).toBeVisible()
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/feedback/keng-mak.mp3')
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
  await page.goto('/lesson/mae-kok/map')
  await expect(page.getByRole('link', { name: /^ขั้น 5 / })).toHaveAccessibleName(/ทำแล้ว ได้ 3 ดาว/)
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  await plant(page, 'นก').click()
  await check(page).click()
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(check(page)).toHaveClass(/pot-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 5 at ${viewport.width}×${viewport.height}: the terrace fills the window, nothing moving crosses a plant, the toast and น้องนก keep clear, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 5, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-terrace', viewport)
    if (viewport.height === 390) for (const target of [...(await plants(page).all()), check(page), restart(page)]) await expectTapTarget(target)
    await expectNothingMovingCrosses(page, [plants(page), check(page), restart(page)])
    await plant(page, 'นก').click()
    await check(page).click()
    await expect(score(page)).toBeVisible()
    await waitUntilStill(page.getByTestId('feedback-stake'))
    const toast = await stageBox(page, score(page).locator('> div'))
    const her = await stageBox(page, page.getByTestId('feedback-mascot'))
    for (const target of [...(await plants(page).all()), check(page), restart(page)]) {
      const box = await stageBox(page, target)
      expect(overlaps(box, toast)).toBe(false)
      expect(overlaps(box, her)).toBe(false)
    }
  })
}

test('keyboard and screen reader: each plant is a toggle button, Space harvests it, ตรวจคำตอบ works from the keyboard', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  await plant(page, 'ดอก').focus()
  expect(parseFloat(await plant(page, 'ดอก').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Space')
  await expect(plant(page, 'ดอก')).toHaveAttribute('aria-pressed', 'true')
  await check(page).focus()
  await page.keyboard.press('Enter')
  await expect(score(page)).toContainText('/12 คะแนน')
})

test('under reduced motion the plant simply shows lifted, nothing shakes and the Scene is still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 5, {}, 'mae-kok')
  await plants(page).first().waitFor()
  await expectSceneStill(page)
  await plant(page, 'ไก่').click()
  await check(page).click()
  await expect(plant(page, 'ไก่')).toHaveAttribute('data-result', 'wrong')
  await expect.poll(() => running(page)).toBe(0)
})
