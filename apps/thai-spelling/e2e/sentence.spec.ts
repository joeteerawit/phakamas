import { expect, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'
import { audioLog as log, type Mic, open as openStep, stubMic } from './audioStub.js'

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 9)
}

const sentence = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ฟังประโยคที่ ${n}`) })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

test.describe('Step 9 sentence reading', () => {
  test('tapping a board highlights its words one by one while it plays', async ({ page }) => {
    await open(page)
    // Record every highlighted word in the page, so a busy machine cannot skip past a 300 ms word between polls.
    await sentence(page, 1).evaluate((board) => {
      const seen: string[] = []
      ;(window as unknown as { __marks: string[] }).__marks = seen
      new MutationObserver(() => {
        const text = board.querySelector('mark')?.textContent
        if (text && seen.at(-1) !== text) seen.push(text)
      }).observe(board, { subtree: true, childList: true, characterData: true })
    })
    await sentence(page, 1).click()
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __marks: string[] }).__marks.slice(0, 2)))
      .toEqual(['ลิง', 'น้อย'])
  })

  test('reduced motion: boards sit still and the highlight still shows', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    await expect(sentence(page, 2)).toHaveCSS('transform', 'none')
    await sentence(page, 2).click()
    await expect(sentence(page, 2).locator('mark')).toHaveText('บ่าง')
  })

  test('shows 2 sentence boards with pictures', async ({ page }) => {
    await open(page)
    await expect(sentence(page, 1)).toContainText('ลิงน้อยนั่งมองช้าง')
    await expect(sentence(page, 2)).toContainText('บ่างวิ่งไล่ตามมา')
    await expect(sentence(page, 1).locator('img')).toHaveCount(2)
    await expect(sentence(page, 2).locator('img')).toHaveCount(1)
  })

  test('TC-014: sentence 2 speaker plays only sentence 2', async ({ page }) => {
    await open(page)
    await sentence(page, 2).click()
    await expect.poll(() => log(page)).toEqual(['play:/assets/audio/sentences/sentence-02.mp3'])
    await expect(sentence(page, 2)).toHaveAttribute('aria-pressed', 'true')
    await expect(sentence(page, 1)).toHaveAttribute('aria-pressed', 'false')
  })

  test('record the selected sentence, play back, and re-record only after confirming', async ({ page }) => {
    await open(page)
    await expect(page.getByRole('heading', { name: 'บันทึกประโยคที่ 1' })).toBeVisible()
    await button(page, 'ลองอ่านเอง').click()
    expect(await log(page)).toEqual([])

    await button(page, 'เริ่มบันทึก').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    await button(page, 'หยุดบันทึก').click()
    await expect.poll(() => log(page)).toEqual(['mic:request', 'record:start', 'record:stop', 'mic:release'])

    await button(page, 'ฟังเสียงตัวเอง').click()
    await expect.poll(async () => (await log(page)).some((entry) => /^play:https?:/.test(entry))).toBe(true)

    // ลองอีกครั้ง asks first; cancelling keeps the recording.
    await button(page, 'ลองอีกครั้ง').click()
    await expect(page.getByText('อัดทับเสียงเดิมใช่ไหม')).toBeVisible()
    await button(page, 'ยกเลิก').click()
    await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()

    await button(page, 'ลองอีกครั้ง').click()
    await button(page, 'อัดใหม่เลย').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    expect((await log(page)).filter((entry) => entry === 'record:start')).toHaveLength(2)
  })

  test('switching sentence mid-recording stops it cleanly', async ({ page }) => {
    await open(page)
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'เริ่มบันทึก').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()

    await sentence(page, 2).click()
    await expect.poll(() => log(page)).toEqual([
      'mic:request',
      'record:start',
      'record:stop',
      'mic:release',
      'play:/assets/audio/sentences/sentence-02.mp3',
    ])
    await expect(page.getByRole('heading', { name: 'บันทึกประโยคที่ 2' })).toBeVisible()
    await expect(button(page, 'เริ่มบันทึก')).toBeVisible()
    await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveCount(0)
  })

  test('denied mic shows a friendly error and the sentences still play', async ({ page }) => {
    await open(page, 'deny')
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'เริ่มบันทึก').click()
    await expect(page.getByRole('alert')).toContainText('ไมโครโฟน')
    await sentence(page, 1).click()
    await expect.poll(() => log(page)).toContain('play:/assets/audio/sentences/sentence-01.mp3')
    await expect(page.getByRole('link', { name: 'ถัดไป' })).toBeVisible()
  })

  test('fits a 390px-tall landscape phone with no horizontal scroll and ≥44px buttons', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await open(page)
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'เริ่มบันทึก').click()
    await button(page, 'หยุดบันทึก').click()
    await button(page, 'ลองอีกครั้ง').click()
    await expect(button(page, 'อัดใหม่เลย')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    for (const target of await page.locator('section button').all()) await expectTapTarget(target)
  })
})
