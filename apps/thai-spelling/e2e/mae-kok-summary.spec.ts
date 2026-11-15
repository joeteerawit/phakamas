import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 10, the bamboo hut (#95): nine terraces, one ripening per Star earned.

type Result = { bestScore: number; maxScore: number }

/** Seeds the Session with the given Activity results before the page loads. */
async function withResults(page: Page, results: Record<string, Result>) {
  const activities = Object.fromEntries(
    Object.entries(results).map(([id, r]) => [id, { status: 'completed', attemptCount: 1, answers: null, ...r }]),
  )
  const session = { lessonId: 'mae-kok', currentStep: 10, visitedSteps: [10], completedSteps: [], startedAt: new Date().toISOString(), activities }
  await page.addInitScript((value) => localStorage.setItem('thai-spelling:lesson-session', value), JSON.stringify({ state: { session, musicOn: false }, version: 1 }))
}

const terraces = (page: Page) => page.getByTestId('terrace')
const ripe = (page: Page) => page.locator('[data-testid="terrace"][data-ripe]')
const row = (page: Page, title: string) => page.getByRole('list', { name: 'ดาวแต่ละกิจกรรม' }).getByRole('listitem').filter({ hasText: title })

test('nine bare terraces climb to the bamboo hut before any Star is earned, and each Activity offers ไปทำ', async ({ page }) => {
  await open(page, 10, {}, 'mae-kok')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('สรุปและประเมิน')
  await expect(terraces(page)).toHaveCount(9)
  await expect(ripe(page)).toHaveCount(0)
  await expect(page.getByTestId('bamboo-hut')).toBeVisible()
  await expect(page.getByText(/^ได้ 0\/9 ดาว/)).toBeVisible()
  for (const title of ['แม่กกอยู่ไหน?', 'กล่องคำแม่กก', 'จับคู่ดูคำ']) await expect(page.getByRole('link', { name: `ไปทำ ${title}` })).toBeVisible()
  await page.getByRole('link', { name: 'ไปทำ กล่องคำแม่กก' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/6$/)
})

test('one terrace ripens per Star earned, from the bottom up: the ripe terraces are exactly the Lesson\'s Stars', async ({ page }) => {
  // 12/12 = 3 Stars, 4/6 = 2 Stars, rhyme matching not done: 5 of 9.
  await withResults(page, { wordSelection: { bestScore: 12, maxScore: 12 }, wordFilling: { bestScore: 4, maxScore: 6 } })
  await open(page, 10, {}, 'mae-kok')
  await expect(ripe(page)).toHaveCount(5)
  await expect(page.getByTestId('terraces')).toHaveAccessibleName('แปลงผักสุก 5 จาก 9 ขั้น')
  await expect(page.getByTestId('star-counter')).toHaveText(/5\/9/)
  await expect(page.getByText(/^ได้ 5\/9 ดาว/)).toBeVisible()
  // The lowest five are ripe, the top four bare.
  for (let i = 0; i < 9; i++) {
    if (i < 5) await expect(terraces(page).nth(i)).toHaveAttribute('data-ripe', 'true')
    else await expect(terraces(page).nth(i)).not.toHaveAttribute('data-ripe')
  }
  const lowest = await stageBox(page, terraces(page).first())
  const top = await stageBox(page, terraces(page).last())
  expect(top.top).toBeLessThan(lowest.top)
  await expect(row(page, 'แม่กกอยู่ไหน?')).toContainText('12/12')
  await expect(row(page, 'แม่กกอยู่ไหน?')).toContainText('3 ดาว')
  await expect(row(page, 'กล่องคำแม่กก')).toContainText('4/6')
  await expect(page.getByRole('link', { name: 'ไปทำ จับคู่ดูคำ' })).toBeVisible()
})

test('all nine Stars ripen all nine terraces under เก่งมาก!', async ({ page }) => {
  await withResults(page, {
    wordSelection: { bestScore: 12, maxScore: 12 },
    wordFilling: { bestScore: 6, maxScore: 6 },
    rhymeMatching: { bestScore: 2, maxScore: 2 },
  })
  await open(page, 10, {}, 'mae-kok')
  await expect(ripe(page)).toHaveCount(9)
  await expect(page.getByTestId('terrace-crop')).toHaveCount(9)
  await expect(page.getByRole('heading', { name: 'เก่งมาก!' })).toBeVisible()
  await expect(page.getByTestId('todo-stake')).toHaveCount(0)
})

test('เรียนอีกครั้ง asks first in the Kit\'s own dialog; cancel keeps the Session, confirm starts again', async ({ page }) => {
  await withResults(page, { wordSelection: { bestScore: 12, maxScore: 12 } })
  await open(page, 10, {}, 'mae-kok')
  const again = page.getByRole('button', { name: 'เรียนอีกครั้ง' })
  await expect(again).toHaveClass(/pot-button/)
  await again.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('ล้างความคืบหน้า')
  await expect(dialog.getByRole('button', { name: 'ยกเลิก' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(ripe(page)).toHaveCount(3)
  await again.click()
  await dialog.getByRole('button', { name: 'ล้างและเริ่มใหม่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/2$/)
  // The Session starts again with no Activity results (a reload would seed it once more, so read the store).
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? '{}'))
  expect(stored.state.session.activities).toEqual({})
})

test('the Step uses only the แม่กก Kit', async ({ page }) => {
  await withResults(page, { wordSelection: { bestScore: 12, maxScore: 12 } })
  await open(page, 10, {}, 'mae-kok')
  expect(await otherLook(wholeStage(page))).toEqual([])
})

for (const viewport of [...VIEWPORTS, { width: 2560, height: 1080 }]) {
  test(`Step 10 at ${viewport.width}×${viewport.height}: the sunset fills the window, the sign and buttons clear the corners, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await withResults(page, { wordSelection: { bestScore: 12, maxScore: 12 } })
    await open(page, 10, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-sunset', viewport)
    const again = page.getByRole('button', { name: 'เรียนอีกครั้ง' })
    const todos = await page.getByTestId('todo-stake').all()
    if (viewport.height === 390) for (const target of [again, ...todos]) await expectTapTarget(target)
    const corners = await Promise.all(
      [page.getByRole('link', { name: 'กลับไปแผนที่' }), page.getByRole('link', { name: 'ย้อนกลับ' }), page.getByRole('link', { name: 'กลับหน้าแรก' }), page.getByTestId('star-counter')].map((c) =>
        stageBox(page, c),
      ),
    )
    for (const target of [page.getByTestId('summary-sign'), again, page.getByTestId('bamboo-hut')]) for (const c of corners) expect(overlaps(await stageBox(page, target), c)).toBe(false)
  })
}

test('keyboard and screen reader: the Stars are read out per Activity and ไปทำ is a named link', async ({ page }) => {
  await withResults(page, { wordFilling: { bestScore: 6, maxScore: 6 } })
  await open(page, 10, {}, 'mae-kok')
  await expect(row(page, 'กล่องคำแม่กก')).toContainText('3 ดาว')
  const todo = page.getByRole('link', { name: 'ไปทำ จับคู่ดูคำ' })
  await todo.focus()
  expect(parseFloat(await todo.evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/8$/)
})

test('under reduced motion the earned terraces simply stand ripe and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await withResults(page, { wordSelection: { bestScore: 12, maxScore: 12 }, rhymeMatching: { bestScore: 2, maxScore: 2 } })
  await open(page, 10, {}, 'mae-kok')
  await expect(ripe(page)).toHaveCount(6)
  await expectSceneStill(page)
  for (const crop of await page.getByTestId('terrace-crop').all()) await expect(crop).toHaveCSS('opacity', '1')
  await expect.poll(() => running(page)).toBe(0)
})
