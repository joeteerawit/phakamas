import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'

const word = (page: Page, text: string) => page.getByRole('button', { name: new RegExp(`^${text}`) })
const lines = (page: Page) => page.getByTestId('match-lines').locator('path')
const activity = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')?.state.session.activities.rhymeMatching,
  )

async function pair(page: Page, left: string, right: string) {
  await word(page, left).click()
  await word(page, right).click()
}

test.describe('Step 8 rhyme matching', () => {
  test('shows four buzzers as in design page 8: มอง ฟัง on top, ดัง ร้อง below', async ({ page }) => {
    await open(page, 8)
    const box = async (text: string) => (await word(page, text).boundingBox())!
    const [mong, fang, dang, rong] = await Promise.all([box('มอง'), box('ฟัง'), box('ดัง'), box('ร้อง')])
    expect(mong.x).toBeLessThan(fang.x)
    expect(dang.x).toBeLessThan(rong.x)
    expect(mong.y).toBeLessThan(dang.y)
    expect(fang.y).toBeLessThan(rong.y)
    await expect(word(page, 'มอง').locator('img[src="/assets/canva/ui/buzzer.webp"]')).toBeAttached()
  })

  test('pressing a buzzer plays its word and selects it', async ({ page }) => {
    await open(page, 8)
    await word(page, 'ฟัง').click()
    await expect(word(page, 'ฟัง')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/fang.mp3')
  })

  test('with reduced motion a correct pair still draws its line', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 8)
    await pair(page, 'ร้อง', 'มอง')
    await expect(word(page, 'มอง')).toContainText('จับคู่แล้ว')
    await expect(lines(page)).toHaveCount(1)
  })

  test('TC-012: a wrong pair shakes, draws no line, and the student can retry', async ({ page }) => {
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
    // The same เก่งมาก! praise as Steps 5 and 6.
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/feedback/keng-mak.mp3')
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
    expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 1, maxScore: 2, attemptCount: 1, partial: true })
  })

  test('no horizontal scroll on a 740×360 phone and buzzers are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await open(page, 8)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(740)
    const box = (await word(page, 'ร้อง').boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
  })
})
