import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, musicState, open, stubMic } from './audioStub.js'

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

  test('music off from the cover leaves speech playing', async ({ page }) => {
    const spelling = 'play:/assets/audio/spelling/ling.mp3'
    await open(page, 1)
    await button(page, 'ปิดเพลง').click()
    await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/intro.mp3'])

    await page.getByRole('button', { name: /^ลิง / }).click()
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/ling.mp3')
    for (const step of [3, 4]) {
      await page.getByRole('link', { name: 'ถัดไป' }).click()
      await expect(page).toHaveURL(`/lesson/mae-kong/${step}`)
    }
    await page.getByRole('button', { name: 'ฟังคำว่า ลิง' }).click()
    await expect.poll(() => audioLog(page)).toContain(spelling)
    expect(await paused(page)).toBe(true)
  })

  test('the Step speaker stops only the music, speech keeps playing and new taps still sound', async ({ page }) => {
    const ling = '/assets/audio/spelling/ling.mp3'
    await open(page, 4)
    await page.getByRole('button', { name: 'ฟังคำว่า ลิง' }).click()
    await expect.poll(() => audioLog(page)).toContain(`play:${ling}`)

    await button(page, 'ปิดเพลง').click()
    await expect(button(page, 'เปิดเพลง')).toHaveAttribute('aria-pressed', 'false')
    expect(await paused(page)).toBe(true)
    expect(await audioLog(page)).not.toContain(`pause:${ling}`)

    await page.getByRole('button', { name: 'ฟังคำว่า ช้าง' }).click()
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/spelling/chang.mp3')

    await button(page, 'เปิดเพลง').click()
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
