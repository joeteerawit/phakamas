import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'

const words = ['ลิง', 'ช้าง', 'รัง', 'กางเกง']
const card = (page: Page, word: string) => page.getByRole('list').getByRole('button', { name: new RegExp(`^${word} `) })
const marks = (page: Page, word: string) => card(page, word).locator('mark')
const toggle = (page: Page) => page.getByRole('button', { name: 'แสดงตัวสะกด' })

test.describe('Step 4 final-consonant spotting', () => {
  test('shows the heading, น้องลิง and the 4 cards with no highlight yet', async ({ page }) => {
    await open(page, 4)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('สังเกตตัวสะกด')
    await expect(page.getByText('มาตราแม่กง (ง) มี ง เป็นตัวสะกด')).toBeVisible()
    await expect(page.getByRole('img', { name: 'น้องลิง' })).toBeVisible()
    const cards = page.getByRole('list').getByRole('button')
    await expect(cards).toHaveCount(4)
    for (const [i, word] of words.entries()) await expect(cards.nth(i)).toHaveAccessibleName(new RegExp(`^${word} `))
    await expect(page.locator('mark')).toHaveCount(0)
  })

  test('TC-005: tapping กางเกง plays it and highlights ง in both syllables', async ({ page }) => {
    await open(page, 4)
    await card(page, 'กางเกง').click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/kang-keng.mp3'])
    await expect(marks(page, 'กางเกง')).toHaveText(['ง', 'ง'])
    await expect(marks(page, 'ลิง')).toHaveCount(0)
  })

  test('แสดงตัวสะกด toggles every highlight on and off', async ({ page }) => {
    await open(page, 4)
    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    for (const word of words) await expect(marks(page, word)).toHaveText(word === 'กางเกง' ? ['ง', 'ง'] : ['ง'])

    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('mark')).toHaveCount(0)
  })

  test('ฟังคำอธิบาย plays the แม่กง explanation, with a Thai speech fallback', async ({ page }) => {
    await open(page, 4, { mp3: 'missing' })
    await page.getByRole('button', { name: 'ฟังคำอธิบาย' }).click()
    await expect.poll(() => audioLog(page)).toEqual([
      'play:/assets/audio/explanations/mae-kong.mp3',
      expect.stringMatching(/^speak:.*แม่กง.*\|th-TH$/),
    ])
  })

  // fixme(#16): old Step content is scaled down inside the 1920×1080 stage; its Step reskin ticket restores ≥44px targets.
  test.fixme('fits a 360px phone with no horizontal scroll and ≥44px targets', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await open(page, 4)
    await toggle(page).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
    for (const target of [toggle(page), page.getByRole('button', { name: 'ฟังคำอธิบาย' }), card(page, 'กางเกง')]) {
      expect((await target.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    }
  })
})
