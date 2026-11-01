import { expect, type Page, test } from '@playwright/test'

const MAE_KONG = ['ลิง', 'ช้าง', 'รัง', 'กางเกง']
const DISTRACTORS = ['แมว', 'นก', 'บ้าน']

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

test('shows the question and 7 choices, none selected', async ({ page }) => {
  await open(page)
  await expect(page.getByText('คำใดเป็นคำที่มี ง เป็นตัวสะกด (แม่กง)?')).toBeVisible()
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

test('TC-006: all correct scores 7, shows เก่งมาก! and plays praise', async ({ page }) => {
  await open(page)
  for (const word of MAE_KONG) await choice(page, word).click()
  await check(page).click()

  await expect(toast(page)).toContainText('เก่งมาก!')
  await expect(toast(page)).toContainText('7/7')
  await expect.poll(() => played(page)).toContain('/assets/audio/feedback/keng-mak.mp3')
  expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 7, maxScore: 7, attemptCount: 1 })
})

test('TC-007: wrong choices are flagged with text and stay editable', async ({ page }) => {
  await open(page)
  for (const word of ['ลิง', 'ช้าง', 'รัง', 'นก']) await choice(page, word).click()
  await check(page).click()

  await expect(toast(page)).toContainText('5/7')
  await expect(choice(page, 'นก')).toContainText('เลือกผิด')
  await expect(choice(page, 'กางเกง')).toContainText('ลืมเลือก')
  await expect(choice(page, 'ลิง')).not.toContainText('เลือกผิด')

  await choice(page, 'นก').click()
  await expect(choice(page, 'นก')).not.toContainText('เลือกผิด')
  await choice(page, 'กางเกง').click()
  await check(page).click()
  await expect(toast(page)).toContainText('เก่งมาก!')
  expect(await activity(page)).toMatchObject({ bestScore: 7, attemptCount: 2 })
})

test('bestScore keeps the best attempt and survives a reload', async ({ page }) => {
  await open(page)
  for (const word of MAE_KONG) await choice(page, word).click()
  await check(page).click()
  await choice(page, 'แมว').click()
  await check(page).click()
  await expect(toast(page)).toContainText('6/7')

  await page.reload()
  expect(await activity(page)).toMatchObject({ bestScore: 7, attemptCount: 2 })
})

test('เริ่มใหม่ clears selection and feedback', async ({ page }) => {
  await open(page)
  await choice(page, 'แมว').click()
  await check(page).click()
  await expect(choice(page, 'แมว')).toContainText('เลือกผิด')

  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(choice(page, 'แมว')).toHaveAttribute('aria-pressed', 'false')
  await expect(choice(page, 'แมว')).not.toContainText('เลือกผิด')
  await expect(toast(page)).toBeEmpty()
})

test('Next without checking marks the Activity skipped', async ({ page }) => {
  await open(page)
  await choice(page, 'ลิง').click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/6$/)
  expect(await activity(page)).toMatchObject({ status: 'skipped', bestScore: 0, maxScore: 7, attemptCount: 0 })
})

test('Next after checking keeps the checked result', async ({ page }) => {
  await open(page)
  await choice(page, 'ลิง').click()
  await check(page).click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/6$/)
  expect(await activity(page)).toMatchObject({ status: 'completed', bestScore: 4, attemptCount: 1 })
})

// fixme(#16): old Step content is scaled down inside the 1920×1080 stage; its Step reskin ticket restores ≥44px targets.
test.fixme('fits 360px with ≥44px targets, keyboard toggles a choice', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 })
  await open(page)
  for (const word of [...MAE_KONG, ...DISTRACTORS]) {
    expect((await choice(page, word).boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  for (const name of ['ตรวจคำตอบ', 'เริ่มใหม่']) {
    expect((await page.getByRole('button', { name }).boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)

  await choice(page, 'รัง').focus()
  await page.keyboard.press('Space')
  await expect(choice(page, 'รัง')).toHaveAttribute('aria-pressed', 'true')

  // The feedback toast must not cover or block the Activity buttons.
  await check(page).click()
  await expect(toast(page)).toContainText('/7')
  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(choice(page, 'รัง')).toHaveAttribute('aria-pressed', 'false')
})
