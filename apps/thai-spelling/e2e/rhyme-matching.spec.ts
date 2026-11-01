import { expect, type Locator, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'

const word = (page: Page, text: string) => page.getByRole('button', { name: new RegExp(`^${text}`) })
const lines = (page: Page) => page.getByTestId('match-lines').locator('line')
const activity = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')?.state.session.activities.rhymeMatching,
  )

async function pair(page: Page, left: string, right: string) {
  await word(page, left).click()
  await word(page, right).click()
}

async function drag(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
  await page.mouse.up()
}

test.describe('Step 8 rhyme matching', () => {
  test('shows มอง ดัง on the left and ร้อง ฟัง shuffled on the right', async ({ page }) => {
    await open(page, 8)
    for (const text of ['มอง', 'ดัง', 'ร้อง', 'ฟัง']) await expect(word(page, text)).toBeVisible()
    const right = await page.getByRole('group', { name: 'คำฝั่งขวา' }).getByRole('button').allInnerTexts()
    // Shuffled so no word sits opposite its partner.
    expect(right.map((t) => t.trim())).not.toEqual(['ร้อง', 'ฟัง'])
  })

  test('TC-012: a wrong pair flashes red, its line vanishes, and the student can retry', async ({ page }) => {
    await open(page, 8)
    await pair(page, 'ดัง', 'ร้อง')
    await expect(page.getByRole('status').filter({ hasText: 'ยังไม่ถูก' })).toBeVisible()
    await expect(word(page, 'ดัง')).toContainText('ไม่ใช่คู่กัน')
    await expect(lines(page)).toHaveCount(0)
    await expect(word(page, 'ดัง')).not.toContainText('ไม่ใช่คู่กัน')

    await pair(page, 'ดัง', 'ฟัง')
    await expect(word(page, 'ดัง')).toContainText('จับคู่แล้ว')
    await expect(lines(page)).toHaveCount(1)
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/feedback/correct.mp3')
  })

  test('TC-013: all pairs correct shows a star per pair, scores 2 and keeps the mistake count', async ({ page }) => {
    await open(page, 8)
    await pair(page, 'มอง', 'ฟัง')
    await pair(page, 'ดัง', 'ฟัง')
    await pair(page, 'มอง', 'ร้อง')

    await expect(page.getByText('ได้ 2 คะแนน')).toBeVisible()
    await expect(page.getByRole('img', { name: 'ได้ 2 ดาว' })).toBeVisible()
    await expect(lines(page)).toHaveCount(2)
    expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 2, maxScore: 2, answers: { mistakes: 1 } })

    await page.reload()
    expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 2 })
  })

  test('a locked pair cannot be re-used', async ({ page }) => {
    await open(page, 8)
    await pair(page, 'ดัง', 'ฟัง')
    await expect(word(page, 'ดัง')).toBeDisabled()
    await expect(word(page, 'ฟัง')).toBeDisabled()
  })

  test('keyboard: Tab to a word and press Enter on both sides', async ({ page }) => {
    await open(page, 8)
    await word(page, 'มอง').focus()
    await page.keyboard.press('Enter')
    await expect(word(page, 'มอง')).toHaveAttribute('aria-pressed', 'true')
    await word(page, 'ร้อง').focus()
    await page.keyboard.press('Space')
    await expect(word(page, 'มอง')).toContainText('จับคู่แล้ว')
  })

  test('drag from a left word to its rhyme draws a locked line', async ({ page }) => {
    await open(page, 8)
    await drag(page, word(page, 'มอง'), word(page, 'ร้อง'))
    await expect(word(page, 'มอง')).toContainText('จับคู่แล้ว')
    await expect(lines(page)).toHaveCount(1)
  })

  test('เริ่มใหม่ clears every pair', async ({ page }) => {
    await open(page, 8)
    await pair(page, 'ดัง', 'ฟัง')
    await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
    await expect(lines(page)).toHaveCount(0)
    await expect(word(page, 'ดัง')).toBeEnabled()
  })

  test('leaving with ถัดไป before finishing records skipped', async ({ page }) => {
    await open(page, 8)
    await page.getByRole('link', { name: 'ถัดไป' }).click()
    await expect(page).toHaveURL(/\/9$/)
    expect(await activity(page)).toMatchObject({ status: 'skipped', bestScore: 0, maxScore: 2 })
  })

  test('matching some pairs then ถัดไป records the partial score, not skipped', async ({ page }) => {
    await open(page, 8)
    await pair(page, 'ดัง', 'ฟัง')
    await expect(word(page, 'ดัง')).toContainText('จับคู่แล้ว')
    expect(await activity(page)).toMatchObject({ status: 'in_progress', bestScore: 0 })
    await page.getByRole('link', { name: 'ถัดไป' }).click()
    await expect(page).toHaveURL(/\/9$/)
    expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 1, maxScore: 2, attemptCount: 1 })
  })

  // fixme(#16): old Step content is scaled down inside the 1920×1080 stage; its Step reskin ticket restores ≥44px targets.
  test.fixme('no horizontal scroll at 360px and words are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await open(page, 8)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
    const box = (await word(page, 'ร้อง').boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
  })
})
