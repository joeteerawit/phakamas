import { expect, type Page, test } from '@playwright/test'
import { endCurrent, type Mic, musicState, open, stubMic } from './audioStub.js'

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const volume = async (page: Page) => (await musicState(page))?.volume
const paused = async (page: Page) => (await musicState(page))?.paused ?? true

test.describe('Background music', () => {
  test('starts on the first gesture and loops at a low volume', async ({ page }) => {
    await open(page, 1)
    await page.waitForTimeout(300)
    expect(await musicState(page)).toBeNull()

    await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
    // Ducked under the teacher intro that the first ▶ plays, then back up.
    await expect.poll(() => musicState(page)).toEqual({ paused: false, loop: true, volume: 0.06 })
    await endCurrent(page)
    await expect.poll(() => musicState(page)).toEqual({ paused: false, loop: true, volume: 0.25 })
  })

  test('ducks under speech and comes back up afterwards', async ({ page }) => {
    await open(page, 2)
    await page.getByRole('button', { name: /^ลิง / }).click()
    await expect.poll(() => volume(page)).toBe(0.06)
    await endCurrent(page)
    await expect.poll(() => volume(page)).toBe(0.25)
  })

  test('the cover speaker toggles music and the choice survives reload', async ({ page }) => {
    await open(page, 1)
    await button(page, 'ปิดเพลง').click()
    await expect(button(page, 'เปิดเพลง')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('music-off')).toBeVisible()
    expect(await paused(page)).toBe(true)

    await page.reload()
    await expect(button(page, 'เปิดเพลง')).toBeVisible()
    await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
    await page.waitForTimeout(300)
    expect(await paused(page)).toBe(true)

    await page.goto('/lesson/mae-kong/1')
    await button(page, 'เปิดเพลง').click()
    await expect(button(page, 'ปิดเพลง')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => paused(page)).toBe(false)
  })

  test('global mute silences the music', async ({ page }) => {
    await open(page, 2)
    await button(page, 'ปิดเสียง').click()
    await page.waitForTimeout(300)
    expect(await paused(page)).toBe(true)
    await button(page, 'ปิดเสียง').click()
    await expect.poll(() => paused(page)).toBe(false)
  })

  test('pauses while recording and ducks under the recording playback', async ({ page }) => {
    await page.addInitScript(stubMic, 'allow' as Mic)
    await open(page, 3)
    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    expect(await paused(page)).toBe(true)

    await button(page, 'หยุดบันทึก').click()
    await expect.poll(() => musicState(page)).toMatchObject({ paused: false, volume: 0.25 })
    await button(page, 'ฟังเสียงตัวเอง').click()
    await expect.poll(() => volume(page)).toBe(0.06)
  })
})
