import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 8, find the pair of boots (#79). src/lessons/mae-kop.ts: กบ↔จบ and จับ↔รับ, stood กบ · จับ · จบ · รับ.
const ORDER = ['กบ', 'จับ', 'จบ', 'รับ']
const PAIRS = [
  ['กบ', 'จบ'],
  ['จับ', 'รับ'],
] as const

const boot = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const boots = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const toast = (page: Page) => page.getByRole('status').filter({ hasText: /คู่|คล้องจอง/ })
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}').state?.session?.activities?.rhymeMatching)

async function pair(page: Page, a: string, b: string) {
  await boot(page, a).click()
  await boot(page, b).click()
}

test('four grey rain boots stand on the porch mat, each word on its side, no pair side by side', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  await expect(boots(page)).toHaveText(ORDER)
  const boxes = await Promise.all((await boots(page).all()).map((b) => stageBox(page, b)))
  const mat = await stageBox(page, page.getByTestId('porch-mat'))
  for (let i = 0; i < 4; i++) {
    await expect(boots(page).nth(i).getByTestId('boot-rubber')).toHaveAttribute('fill', 'var(--color-rubber)')
    expect(boxes[i]!.bottom).toBeGreaterThan(mat.top)
    if (i) expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
  }
})

test('tapping a boot lifts it and says its word; its rhyme locks the pair in one colour where they stand, with a clop and a splash', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  const before = await stageBox(page, boot(page, 'จบ'))
  await boot(page, 'กบ').click()
  await expect(boot(page, 'กบ')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/kop.mp3'])
  await boot(page, 'จบ').click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/feedback/correct.mp3')
  for (const word of ['กบ', 'จบ']) {
    await expect(boot(page, word)).toBeDisabled()
    await expect(boot(page, word)).toHaveAccessibleName(`${word} จับคู่แล้ว`)
    await expect(boot(page, word).getByTestId('boot-rubber')).toHaveAttribute('fill', 'var(--color-pond)')
  }
  await expect(boot(page, 'กบ').getByTestId('boot-splash')).toBeAttached()
  await expect(toast(page)).toContainText('กบ คล้องจองกับ จบ')
  expect(await stageBox(page, boot(page, 'จบ'))).toEqual(before)
  await pair(page, 'รับ', 'จับ')
  await expect(boot(page, 'จับ').getByTestId('boot-rubber')).toHaveAttribute('fill', 'var(--color-raincoat)')
})

test('a wrong pair wobbles and both turn back to grey, and counts as a wrong try', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  await pair(page, 'กบ', 'จับ')
  await expect(boot(page, 'กบ')).toHaveAccessibleName('กบ ไม่ใช่คู่กัน')
  await expect(toast(page)).toContainText('กบ กับ จับ ยังไม่ใช่คู่กัน')
  await expect(boot(page, 'กบ')).toHaveAccessibleName('กบ')
  for (const word of ['กบ', 'จับ']) {
    await expect(boot(page, word)).toBeEnabled()
    await expect(boot(page, word)).toHaveAttribute('aria-pressed', 'false')
    await expect(boot(page, word).getByTestId('boot-rubber')).toHaveAttribute('fill', 'var(--color-rubber)')
  }
  for (const [a, b] of PAIRS) await pair(page, a, b)
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 2, maxScore: 2, answers: { mistakes: 1 } })
})

test('both pairs score 2/2 with the shared Activity scoring: the celebration gives 3 Stars; ถัดไป part-way records the pairs so far', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  for (const [a, b] of PAIRS) await pair(page, a, b)
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  await expect(page.getByText('จับคู่ครบ 2 คู่ ได้ 2 คะแนน')).toBeVisible()
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)

  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(boot(page, 'กบ')).toBeEnabled()
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await pair(page, 'กบ', 'จบ')
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/9$/)
  expect(await session(page)).toMatchObject({ status: 'completed', bestScore: 1, partial: true })
})

test('the Game uses only the แม่กบ Kit: nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  await pair(page, 'กบ', 'จบ')
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(page.getByRole('button', { name: 'เริ่มใหม่' })).toHaveClass(/vinyl-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 8 at ${viewport.width}×${viewport.height}: the drizzle fills the window, boots clear of each other, the toast and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 8, {}, 'mae-kop')
    await expectSceneFills(page, 'kop-drizzle', viewport)
    await pair(page, 'กบ', 'รับ')
    await expect(toast(page)).toBeVisible()
    const targets = [...(await boots(page).all()), page.getByRole('button', { name: 'เริ่มใหม่' })]
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    await expectNoDropCrosses(page, targets)
    const message = await stageBox(page, toast(page).locator('> div'))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const box of await Promise.all(targets.map((t) => stageBox(page, t)))) {
      expect(overlaps(box, message)).toBe(false)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: each boot is a named toggle, Enter pairs them, the mat is decoration', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  await expect(page.getByTestId('porch-mat')).toHaveAttribute('aria-hidden', 'true')
  await boot(page, 'จับ').focus()
  expect(parseFloat(await boot(page, 'จับ').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(boot(page, 'จับ')).toHaveAttribute('aria-pressed', 'true')
  await boot(page, 'รับ').focus()
  await page.keyboard.press('Enter')
  await expect(boot(page, 'จับ')).toHaveAccessibleName('จับ จับคู่แล้ว')
})

test('under reduced motion nothing lifts, wobbles or splashes in motion; the colours still show', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 8, {}, 'mae-kop')
  await boots(page).first().waitFor()
  await expectSceneStill(page)
  await pair(page, 'กบ', 'จับ')
  await expect(boot(page, 'กบ').getByTestId('boot')).toHaveCSS('transform', 'none')
  await pair(page, 'กบ', 'จบ')
  await expect(boot(page, 'กบ').getByTestId('boot-rubber')).toHaveAttribute('fill', 'var(--color-pond)')
  await expect(page.getByTestId('boot-splash')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})
