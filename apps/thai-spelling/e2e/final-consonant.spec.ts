import { expect, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'
import { audioLog, open } from './audioStub.js'

const card = (page: Page, word: string) => page.getByRole('button', { name: `ฟังคำว่า ${word}` })
const pill = (page: Page, word: string) => page.getByTestId(`spelling-${word}`)
const setButton = (page: Page, n: number) => page.getByRole('button', { name: `ชุดคำที่ ${n}` })
const RED = 'rgb(255, 49, 49)'

test.describe('Step 4 final-consonant spotting', () => {
  test('shows set 1 on the pond with red final ง and spelling pills from the Lesson', async ({ page }) => {
    await open(page, 4)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('สังเกตตัวสะกด')
    await expect(page.getByTestId('stage-scene')).toHaveCSS('background-image', /pond\.webp/)
    for (const word of ['ลิง', 'ช้าง', 'ดัง']) await expect(card(page, word)).toBeVisible()
    await expect(card(page, 'รัง')).toHaveCount(0)
    await expect(card(page, 'ช้าง').getByText('ง', { exact: true })).toHaveCSS('color', RED)
    await expect(pill(page, 'ช้าง')).toHaveText('ชอ-อา-งอ-ชาง-ไม้โท-ช้าง')
    await expect(setButton(page, 1)).toHaveAttribute('aria-pressed', 'true')
  })

  test('the set switch shows set 2', async ({ page }) => {
    await open(page, 4)
    await setButton(page, 2).click()
    await expect(setButton(page, 2)).toHaveAttribute('aria-pressed', 'true')
    for (const word of ['รัง', 'ค่าง', 'ผึ้ง']) await expect(card(page, word)).toBeVisible()
    await expect(card(page, 'ลิง')).toHaveCount(0)
    await expect(pill(page, 'ผึ้ง')).toHaveText('ผอ-อึ-งอ-ผึง-ไม้โท-ผึ้ง')
  })

  test('TC-005: tapping a card plays it and sweeps its spelling part by part', async ({ page }) => {
    await page.clock.install()
    await open(page, 4)
    await setButton(page, 2).click()
    await card(page, 'ผึ้ง').click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/phueng.mp3'])
    await expect(card(page, 'ผึ้ง').getByTestId('sound-waves')).toBeVisible()
    const active = pill(page, 'ผึ้ง').locator('[data-active]')
    await expect(active).toHaveText('ผอ')
    await expect(card(page, 'ผึ้ง')).toHaveAttribute('data-glowing', 'true')
    await page.clock.runFor(600)
    await expect(active).toHaveText('อึ')
    await page.clock.runFor(4_000)
    await expect(active).toHaveCount(0)
    await expect(card(page, 'ผึ้ง')).not.toHaveAttribute('data-glowing', 'true')
  })

  test('ฟังคำอธิบาย plays the แม่กง explanation, with a Thai speech fallback', async ({ page }) => {
    await open(page, 4, { mp3: 'missing' })
    await page.getByRole('button', { name: 'ฟังคำอธิบาย' }).click()
    await expect.poll(() => audioLog(page)).toEqual([
      'play:/assets/audio/explanations/mae-kong.mp3',
      expect.stringMatching(/^speak:.*แม่กง.*\|th-TH$/),
    ])
  })

  test('targets are ≥44px on a 390px-tall landscape phone', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await open(page, 4)
    for (const target of [setButton(page, 1), setButton(page, 2), page.getByRole('button', { name: 'ฟังคำอธิบาย' }), card(page, 'ลิง')]) {
      await expectTapTarget(target)
    }
  })
})
