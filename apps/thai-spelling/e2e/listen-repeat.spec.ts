import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'

const words = [
  ['ลิง', 'ling'],
  ['ช้าง', 'chang'],
  ['ดัง', 'dang'],
  ['รัง', 'rang'],
  ['ค่าง', 'khang'],
  ['ผึ้ง', 'phueng'],
] as const

const wordCard = (page: Page) => page.getByTestId('listen-word')
const listenButton = (page: Page) => page.getByRole('button', { name: /^(ฟังเสียง|ฟังอีกครั้ง)$/ })
const nextWord = (page: Page) => page.getByRole('button', { name: 'คำถัดไป' })
const progressWord = (page: Page, word: string) =>
  page.getByRole('navigation', { name: 'ลำดับคำ' }).getByRole('button', { name: new RegExp(`^${word}`) })

/** Plays the current word and lets it finish. */
async function hear(page: Page) {
  await listenButton(page).click()
  await expect(wordCard(page)).toContainText('กำลังเล่น')
  await endCurrent(page)
}

test.describe('Step 3 listen and repeat', () => {
  test('starts on ลิง, คำที่ 1/6, without autoplay', async ({ page }) => {
    await open(page, 3)
    await expect(wordCard(page)).toContainText('ลิง')
    await expect(page.getByText('คำที่ 1/6')).toBeVisible()
    await page.waitForTimeout(300)
    expect(await audioLog(page)).toEqual([])
  })

  test('TC-004: คำถัดไป walks the 6 words in order, picture always matching the word', async ({ page }) => {
    await open(page, 3)
    for (const [i, [word, slug]] of words.entries()) {
      await expect(page.getByText(`คำที่ ${i + 1}/6`)).toBeVisible()
      await expect(wordCard(page).getByRole('heading')).toHaveText(word)
      await expect(wordCard(page).locator('img')).toHaveAttribute('src', `/assets/canva/vocabulary/${slug}.webp`)
      if (i < words.length - 1) await nextWord(page).click()
    }
    await expect(nextWord(page)).toBeDisabled()
  })

  test('listening plays the current word, then shows ถึงตาหนูอ่านแล้ว; ฟังอีกครั้ง replays it', async ({ page }) => {
    await open(page, 3)
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
    await hear(page)
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toBeVisible()

    await page.getByRole('button', { name: 'ฟังอีกครั้ง' }).click()
    const plays = async () => (await audioLog(page)).filter((entry) => entry.startsWith('play:'))
    await expect.poll(plays).toEqual(['play:/assets/audio/vocabulary/ling.mp3', 'play:/assets/audio/vocabulary/ling.mp3'])
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
  })

  test('tapping a word in the progress jumps to it', async ({ page }) => {
    await open(page, 3)
    await progressWord(page, 'รัง').click()
    await expect(page.getByText('คำที่ 4/6')).toBeVisible()
    await expect(wordCard(page).getByRole('heading')).toHaveText('รัง')
    await expect(progressWord(page, 'รัง')).toHaveAttribute('aria-current', 'step')

    await listenButton(page).click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/rang.mp3'])
  })

  test('changing word stops the sound', async ({ page }) => {
    await open(page, 3)
    await listenButton(page).click()
    await expect(wordCard(page)).toContainText('กำลังเล่น')
    await nextWord(page).click()
    await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/ling.mp3')
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
  })

  test('a star appears after all 6 words are heard, and practice stays repeatable', async ({ page }) => {
    await open(page, 3)
    const done = page.getByText('ฟังครบ 6 คำแล้ว')
    for (const [i] of words.entries()) {
      await expect(done).toHaveCount(0)
      await hear(page)
      if (i < words.length - 1) await nextWord(page).click()
    }
    await expect(done).toBeVisible()

    await page.getByRole('button', { name: 'ฝึกอีกรอบ' }).click()
    await expect(page.getByText('คำที่ 1/6')).toBeVisible()
    await listenButton(page).click()
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/ling.mp3')
    await expect(done).toBeVisible()
  })

  test('no horizontal scroll at 360px and targets are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await open(page, 3)
    await expect(wordCard(page)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
    for (const button of await page.getByRole('main').getByRole('button').all()) {
      const box = await button.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
      expect(box?.width).toBeGreaterThanOrEqual(44)
    }
  })
})
