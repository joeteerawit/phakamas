import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open, setStub } from './audioStub.js'

const card = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word} `) })

test.describe('Step 2 vocabulary cards', () => {
  test('shows 6 picture cards in spec order', async ({ page }) => {
    await open(page, 2)
    const cards = page.getByRole('list').getByRole('button')
    await expect(cards).toHaveCount(6)
    for (const [i, word] of ['ลิง', 'ช้าง', 'ดัง', 'รัง', 'ค่าง', 'ผึ้ง'].entries()) {
      await expect(cards.nth(i)).toHaveAccessibleName(new RegExp(`^${word} `))
      await expect(cards.nth(i).locator('img[src*="/vocabulary/"]')).toHaveJSProperty('complete', true)
    }
  })

  test('cards sit where design page 2 puts them on the 1920×1080 stage', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await open(page, 2)
    await expect(page.getByText('คลิกที่ภาพเพื่อฟังเสียง')).toBeVisible()
    for (const [i, left] of [137, 429, 720, 1011, 1302, 1594].entries()) {
      // Polls because the cards pop in.
      await expect
        .poll(async () => {
          const box = (await page.getByRole('list').getByRole('button').nth(i).boundingBox())!
          return [box.x, box.y, box.width, box.height].map(Math.round)
        })
        .toEqual([left, 335, 255, 378])
    }
  })

  test('cards are ≥44px tap targets on a 390px-tall landscape phone', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await open(page, 2)
    const box = (await card(page, 'ลิง').boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })

  test('the speaker shows pulsing sound waves only while the clip plays', async ({ page }) => {
    await open(page, 2)
    const waves = card(page, 'ลิง').getByTestId('sound-waves')
    await expect(waves).toHaveCount(0)
    await card(page, 'ลิง').click()
    await expect(waves).toBeVisible()
    await expect(waves.locator('path').first()).toHaveCSS('animation-name', 'sound-wave')
    await endCurrent(page)
    await expect(waves).toHaveCount(0)
  })

  test('reduced motion: the sound waves are a static highlight', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 2)
    await card(page, 'ลิง').click()
    const waves = card(page, 'ลิง').getByTestId('sound-waves')
    await expect(waves).toBeVisible()
    await expect(waves.locator('path').first()).toHaveCSS('animation-name', 'none')
  })

  test('TC-002: tapping ลิง plays its audio ID and highlights the card', async ({ page }) => {
    await open(page, 2)
    await card(page, 'ลิง').click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/ling.mp3'])
    await expect(card(page, 'ลิง')).toContainText('กำลังเล่น')

    await endCurrent(page)
    await expect(card(page, 'ลิง')).toContainText('ฟังแล้ว')
  })

  test('TC-003: tapping another card stops the old sound before the new one', async ({ page }) => {
    await open(page, 2)
    await card(page, 'ลิง').click()
    await expect(card(page, 'ลิง')).toContainText('กำลังเล่น')
    await card(page, 'ช้าง').click()

    await expect.poll(() => audioLog(page)).toEqual([
      'play:/assets/audio/vocabulary/ling.mp3',
      'pause:/assets/audio/vocabulary/ling.mp3',
      'play:/assets/audio/vocabulary/chang.mp3',
    ])
    await expect(card(page, 'ช้าง')).toContainText('กำลังเล่น')
    await expect(page.getByText('กำลังเล่น')).toHaveCount(1)
  })

  test('shows a loading state while the mp3 loads', async ({ page }) => {
    await open(page, 2, { mp3: 'pending' })
    await card(page, 'รัง').click()
    await expect(card(page, 'รัง')).toContainText('กำลังโหลด')
  })

  test('missing mp3 falls back to Web Speech reading the Thai text', async ({ page }) => {
    await open(page, 2, { mp3: 'missing' })
    await card(page, 'ผึ้ง').click()
    await expect
      .poll(() => audioLog(page))
      .toEqual(['play:/assets/audio/vocabulary/phueng.mp3', 'speak:ผึ้ง|th-TH'])
    await expect(card(page, 'ผึ้ง')).toContainText('กำลังเล่น')
  })

  test('no Thai voice shows retry, and retry plays once a voice exists', async ({ page }) => {
    await open(page, 2, { mp3: 'missing', thaiVoice: false })
    await card(page, 'ดัง').click()
    await expect(card(page, 'ดัง')).toContainText('ลองอีกครั้ง')

    await setStub(page, { thaiVoice: true })
    await card(page, 'ดัง').click()
    await expect.poll(() => audioLog(page)).toContain('speak:ดัง|th-TH')
    await expect(card(page, 'ดัง')).toContainText('กำลังเล่น')
  })

  test('changing Step stops the sound', async ({ page }) => {
    await open(page, 2)
    await card(page, 'ค่าง').click()
    await expect(card(page, 'ค่าง')).toContainText('กำลังเล่น')
    await page.getByRole('link', { name: 'ถัดไป' }).click()
    await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/khang.mp3')
  })

  test('page unload stops the sound', async ({ page }) => {
    await open(page, 2)
    await card(page, 'ลิง').click()
    await expect(card(page, 'ลิง')).toContainText('กำลังเล่น')
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')))
    await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/ling.mp3')
  })

  test('global mute stops the sound and silences new taps', async ({ page }) => {
    await open(page, 2)
    await card(page, 'ลิง').click()
    await expect(card(page, 'ลิง')).toContainText('กำลังเล่น')

    const mute = page.getByRole('button', { name: 'ปิดเสียง' })
    await mute.click()
    await expect(mute).toHaveAttribute('aria-pressed', 'true')
    await card(page, 'ช้าง').click()
    expect(await audioLog(page)).toEqual(['play:/assets/audio/vocabulary/ling.mp3', 'pause:/assets/audio/vocabulary/ling.mp3'])

    await mute.click()
    await card(page, 'ช้าง').click()
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/chang.mp3')
  })
})

