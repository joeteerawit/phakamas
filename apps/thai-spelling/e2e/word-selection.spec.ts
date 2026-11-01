import { expect, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'

const MAE_KONG = ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง']
const DISTRACTORS = ['งู', 'บ้าน', 'ก้ม', 'เงา']

/** Records which mp3s were played instead of making sound. */
function stubAudio() {
  const played: string[] = []
  ;(window as unknown as { __played: string[] }).__played = played
  class FakeAudio {
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    src: string
    constructor(src: string) {
      this.src = src
    }
    play() {
      played.push(new URL(this.src, location.href).pathname)
      return Promise.resolve()
    }
    pause() {}
  }
  Object.assign(window, { Audio: FakeAudio })
}

async function open(page: Page) {
  await page.addInitScript(stubAudio)
  await page.goto('/lesson/mae-kong/5')
}

const choice = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const toast = (page: Page) => page.getByRole('status')
const played = (page: Page) => page.evaluate(() => (window as unknown as { __played: string[] }).__played)
const activity = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')?.state.session.activities.wordSelection,
  )

test('shows the question and 12 choices, none selected', async ({ page }) => {
  await open(page)
  // The question repeats the Step title, so both show it.
  await expect(page.getByText('แม่กงอยู่ไหน?').first()).toBeVisible()
  for (const word of [...MAE_KONG, ...DISTRACTORS]) {
    await expect(choice(page, word)).toHaveAttribute('aria-pressed', 'false')
  }
})

test('tapping a word selects it and tapping again deselects it', async ({ page }) => {
  await open(page)
  await choice(page, 'ลิง').click()
  await expect(choice(page, 'ลิง')).toHaveAttribute('aria-pressed', 'true')
  await choice(page, 'ลิง').click()
  await expect(choice(page, 'ลิง')).toHaveAttribute('aria-pressed', 'false')
})

test('TC-006: all correct scores 12, shows เก่งมาก! and plays praise', async ({ page }) => {
  await open(page)
  for (const word of MAE_KONG) await choice(page, word).click()
  await check(page).click()

  await expect(toast(page)).toContainText('เก่งมาก!')
  await expect(toast(page)).toContainText('12/12')
  await expect.poll(() => played(page)).toContain('/assets/audio/feedback/keng-mak.mp3')
  expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 12, maxScore: 12, attemptCount: 1 })
})

test('TC-007: wrong choices are flagged with text and stay editable', async ({ page }) => {
  await open(page)
  for (const word of [...MAE_KONG.filter((w) => w !== 'ค่าง'), 'งู']) await choice(page, word).click()
  await check(page).click()

  await expect(toast(page)).toContainText('10/12')
  await expect(choice(page, 'งู')).toContainText('เลือกผิด')
  await expect(choice(page, 'ค่าง')).toContainText('ลืมเลือก')
  await expect(choice(page, 'ลิง')).not.toContainText('เลือกผิด')

  await choice(page, 'งู').click()
  await expect(choice(page, 'งู')).not.toContainText('เลือกผิด')
  await choice(page, 'ค่าง').click()
  await check(page).click()
  await expect(toast(page)).toContainText('เก่งมาก!')
  expect(await activity(page)).toMatchObject({ bestScore: 12, attemptCount: 2 })
})

test('bestScore keeps the best attempt and survives a reload', async ({ page }) => {
  await open(page)
  for (const word of MAE_KONG) await choice(page, word).click()
  await check(page).click()
  await choice(page, 'งู').click()
  await check(page).click()
  await expect(toast(page)).toContainText('11/12')

  await page.reload()
  expect(await activity(page)).toMatchObject({ bestScore: 12, attemptCount: 2 })
})

test('เริ่มใหม่ clears selection and feedback', async ({ page }) => {
  await open(page)
  await choice(page, 'งู').click()
  await check(page).click()
  await expect(choice(page, 'งู')).toContainText('เลือกผิด')

  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(choice(page, 'งู')).toHaveAttribute('aria-pressed', 'false')
  await expect(choice(page, 'งู')).not.toContainText('เลือกผิด')
  await expect(toast(page)).toBeEmpty()
})

test('Next without checking marks the Activity skipped', async ({ page }) => {
  await open(page)
  await choice(page, 'ลิง').click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/6$/)
  expect(await activity(page)).toMatchObject({ status: 'skipped', bestScore: 0, maxScore: 12, attemptCount: 0 })
})

test('Next after checking keeps the checked result', async ({ page }) => {
  await open(page)
  await choice(page, 'ลิง').click()
  await check(page).click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/6$/)
  expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 5, attemptCount: 1 })
})

test('each card shows its Canva picture and tapping it plays the word', async ({ page }) => {
  await open(page)
  await expect(choice(page, 'งู').locator('img').first()).toHaveAttribute('src', '/assets/canva/vocabulary/ngu.webp')
  await expect(choice(page, 'เงา').locator('img').first()).toHaveAttribute('src', '/assets/canva/vocabulary/ngao.webp')
  await choice(page, 'บ้าน').click()
  await expect.poll(() => played(page)).toContain('/assets/audio/vocabulary/ban.mp3')
})

test('checking marks right, wrong and missed cards', async ({ page }) => {
  await open(page)
  for (const word of ['ลิง', 'งู']) await choice(page, word).click()
  await check(page).click()
  await expect(choice(page, 'ลิง')).toHaveAttribute('data-result', 'right')
  await expect(choice(page, 'ลิง')).toContainText('ถูกต้อง')
  await expect(choice(page, 'งู')).toHaveAttribute('data-result', 'wrong')
  await expect(choice(page, 'ช้าง')).toHaveAttribute('data-result', 'missed')
  await expect(choice(page, 'เงา')).not.toHaveAttribute('data-result')
})

test('fits a 390px-tall phone with ≥44px targets, keyboard toggles a choice', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await open(page)
  for (const word of [...MAE_KONG, ...DISTRACTORS]) await expectTapTarget(choice(page, word))
  for (const name of ['ตรวจคำตอบ', 'เริ่มใหม่']) await expectTapTarget(page.getByRole('button', { name }))
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)

  await choice(page, 'รัง').focus()
  await page.keyboard.press('Space')
  await expect(choice(page, 'รัง')).toHaveAttribute('aria-pressed', 'true')

  // The feedback toast must not cover or block the Activity buttons.
  await check(page).click()
  await expect(toast(page)).toContainText('/12')
  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(choice(page, 'รัง')).toHaveAttribute('aria-pressed', 'false')
})

test('reduced motion still shows the result states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await choice(page, 'งู').click()
  await check(page).click()
  await expect(choice(page, 'งู')).toHaveAttribute('data-result', 'wrong')
  await expect(choice(page, 'งู')).toContainText('เลือกผิด')
})
