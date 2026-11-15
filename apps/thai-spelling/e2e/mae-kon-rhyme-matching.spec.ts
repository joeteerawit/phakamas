import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 8, raft the rhyming boats (#107). src/lessons/mae-kon.ts: จาน↔หวาน and ช้อน↔ร้อน, in reading order
// จาน · ช้อน / ร้อน · หวาน, so each pair sits across the landing.
const ORDER = ['จาน', 'ช้อน', 'ร้อน', 'หวาน']
const PAIRS = [
  ['จาน', 'หวาน'],
  ['ช้อน', 'ร้อน'],
] as const

const boat = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const boats = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const toast = (page: Page) => page.getByRole('status').filter({ hasText: /คล้องจอง|ผูกแพ/ })
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}').state?.session?.activities?.rhymeMatching)

async function pair(page: Page, a: string, b: string) {
  await boat(page, a).click()
  await boat(page, b).click()
}

test('four small boats float in two columns, each with one word and its speaker; the landing runs between them', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  await expect(boats(page)).toHaveText(ORDER)
  const boxes = await Promise.all((await boats(page).all()).map((b) => stageBox(page, b)))
  const landing = await stageBox(page, page.getByTestId('raft-landing'))
  expect(Math.round(boxes[0]!.top)).toBe(Math.round(boxes[1]!.top))
  expect(boxes[2]!.top).toBeGreaterThan(boxes[0]!.bottom)
  for (const [i, box] of boxes.entries()) {
    expect(overlaps(box, landing)).toBe(false)
    await expect(boats(page).nth(i).locator('[data-art="leaf-cone"]')).toBeVisible()
  }
})

test('two rhyming boats are tied by a rope and drift along their own lanes to the landing, where they lock', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  const before = { a: await stageBox(page, boat(page, 'จาน')), b: await stageBox(page, boat(page, 'หวาน')) }
  await boat(page, 'จาน').click()
  await expect(boat(page, 'จาน')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/chan.mp3'])
  await boat(page, 'หวาน').click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/feedback/correct.mp3')
  await expect(page.getByTestId('raft-rope')).toHaveCount(1)
  await expect(toast(page)).toContainText('จาน คล้องจองกับ หวาน')
  for (const word of ['จาน', 'หวาน']) {
    await expect(boat(page, word)).toBeDisabled()
    await expect(boat(page, word)).toHaveAccessibleName(`${word} ผูกแพแล้ว`)
  }
  await waitUntilStill(boat(page, 'จาน'), boat(page, 'หวาน'))
  const after = { a: await stageBox(page, boat(page, 'จาน')), b: await stageBox(page, boat(page, 'หวาน')) }
  const landing = await stageBox(page, page.getByTestId('raft-landing'))
  // Each stayed in its lane (its row) and came up against the landing from its own side.
  expect(Math.round(after.a.top)).toBe(Math.round(before.a.top))
  expect(Math.round(after.b.top)).toBe(Math.round(before.b.top))
  expect(after.a.right).toBeLessThanOrEqual(landing.left + 1)
  expect(after.a.right).toBeGreaterThan(landing.left - 10)
  expect(after.b.left).toBeGreaterThanOrEqual(landing.right - 1)
  expect(after.b.left).toBeLessThan(landing.right + 10)
  // Never over another boat's word.
  for (const other of ['ช้อน', 'ร้อน']) {
    expect(overlaps(after.a, await stageBox(page, boat(page, other)))).toBe(false)
    expect(overlaps(after.b, await stageBox(page, boat(page, other)))).toBe(false)
  }
})

test('a wrong pair: the rope goes slack and falls, the boats stay, and the miss is counted', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  const before = await stageBox(page, boat(page, 'จาน'))
  await pair(page, 'จาน', 'ช้อน')
  await expect(page.getByTestId('slack-rope')).toBeAttached()
  await expect(boat(page, 'จาน')).toHaveAccessibleName('จาน ไม่ใช่คู่กัน')
  await expect(toast(page)).toContainText('จาน กับ ช้อน ยังไม่คล้องจองกัน')
  await expect(page.getByTestId('slack-rope')).toHaveCount(0)
  await expect(boat(page, 'จาน')).toHaveAccessibleName('จาน')
  expect(await stageBox(page, boat(page, 'จาน'))).toEqual(before)
  for (const word of ['จาน', 'ช้อน']) {
    await expect(boat(page, word)).toBeEnabled()
    await expect(boat(page, word)).toHaveAttribute('aria-pressed', 'false')
  }
  await expect(page.getByTestId('raft-rope')).toHaveCount(0)
  for (const [a, b] of PAIRS) await pair(page, a, b)
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 2, maxScore: 2, answers: { mistakes: 1 } })
})

test('both pairs score 2/2 with the shared Activity scoring: 3 Stars; ถัดไป part-way records the pairs so far', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  for (const [a, b] of PAIRS) await pair(page, a, b)
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  await expect(page.getByText('ผูกแพครบ 2 คู่ ได้ 2 คะแนน')).toBeVisible()
  await expect(page.getByTestId('raft-rope')).toHaveCount(2)
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)

  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(boat(page, 'จาน')).toBeEnabled()
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await pair(page, 'ช้อน', 'ร้อน')
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/9$/)
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 1, partial: true })
})

test('the Game uses only the แม่กน Kit: nothing from another Lesson', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  await pair(page, 'จาน', 'หวาน')
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(page.getByRole('button', { name: 'เริ่มใหม่' })).toHaveClass(/plank-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 8 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, boats clear of each other, the toast and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 8, {}, 'mae-kon')
    await expectSceneFills(page, 'kon-canal', viewport)
    await pair(page, 'ช้อน', 'ร้อน')
    await expect(toast(page)).toBeVisible()
    // The toast hides after a moment, so it is measured first.
    const message = await stageBox(page, toast(page).locator('> div'))
    await waitUntilStill(...(await boats(page).all()))
    const targets = [...(await boats(page).all()), page.getByRole('button', { name: 'เริ่มใหม่' })]
    if (viewport.height === 390) for (const t of targets) await expectTapTarget(t)
    await expectNoDrifterCrosses(page, targets)
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = await Promise.all(targets.map((t) => stageBox(page, t)))
    for (const [i, box] of boxes.entries()) {
      expect(overlaps(box, message)).toBe(false)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
      for (const other of boxes.slice(i + 1)) expect(overlaps(box, other)).toBe(false)
    }
  })
}

test('keyboard and screen reader: each boat is a named toggle, Enter ties a pair, the landing and ropes are decoration', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  await expect(page.getByTestId('raft-landing')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByTestId('ropes')).toHaveAttribute('aria-hidden', 'true')
  await boat(page, 'ช้อน').focus()
  expect(parseFloat(await boat(page, 'ช้อน').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(boat(page, 'ช้อน')).toHaveAttribute('aria-pressed', 'true')
  await boat(page, 'ร้อน').focus()
  await page.keyboard.press('Space')
  await expect(boat(page, 'ช้อน')).toHaveAccessibleName('ช้อน ผูกแพแล้ว')
})

test('under reduced motion the rope just appears and the boats stay put', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 8, {}, 'mae-kon')
  await boats(page).first().waitFor()
  await expectSceneStill(page)
  const before = await stageBox(page, boat(page, 'จาน'))
  await boat(page, 'จาน').click()
  expect(await stageBox(page, boat(page, 'จาน'))).toEqual(before)
  await boat(page, 'หวาน').click()
  await expect(page.getByTestId('raft-rope')).toBeAttached()
  expect(await stageBox(page, boat(page, 'จาน'))).toEqual(before)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
