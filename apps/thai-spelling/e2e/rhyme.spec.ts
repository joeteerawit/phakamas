import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 7)
}

const log = audioLog
const finish = endCurrent
// The shared Audio fake logs a blob: URL's pathname, which starts with the origin.
const playedRecording = (entries: string[]) => entries.some((entry) => /^play:https?:/.test(entry))
const pausedRecording = (entries: string[]) => entries.some((entry) => /^pause:https?:/.test(entry))
const lines = (page: Page) => page.getByRole('list', { name: 'บทคล้องจอง' }).getByRole('listitem')
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

async function expectHighlighted(page: Page, index: number | null) {
  for (let i = 0; i < 4; i++) {
    await expect(lines(page).nth(i)).toHaveAttribute('aria-current', i === index ? 'true' : 'false')
  }
}

test.describe('Step 7 rhyme reading', () => {
  test('shows the 4 rhyme lines', async ({ page }) => {
    await open(page)
    await expect(lines(page)).toHaveText(['ลิงน้อยนั่งมอง', 'ช้างร้องเสียงดัง', 'นกบินกลับรัง', 'ฟังเพลงเพลินใจ'])
  })

  test('TC-010: ฟังครูอ่าน plays line-01..04 in order, highlighting the playing line', async ({ page }) => {
    await open(page)
    await button(page, 'ฟังครูอ่าน').click()

    for (let i = 0; i < 4; i++) {
      await expect.poll(() => log(page)).toContain(`play:/assets/audio/rhyme/line-0${i + 1}.mp3`)
      await expectHighlighted(page, i)
      await finish(page)
    }
    await expectHighlighted(page, null)
    await expect(button(page, 'ฟังครูอ่าน')).toBeVisible()
    expect((await log(page)).filter((entry) => entry.startsWith('play:'))).toHaveLength(4)
  })

  test('หยุดเสียง stops the sequence and clears the highlight', async ({ page }) => {
    await open(page)
    await button(page, 'ฟังครูอ่าน').click()
    await expectHighlighted(page, 0)
    await button(page, 'หยุดเสียง').click()

    await expect.poll(() => log(page)).toContain('pause:/assets/audio/rhyme/line-01.mp3')
    await expectHighlighted(page, null)
    await finish(page)
    expect(await log(page)).not.toContain('play:/assets/audio/rhyme/line-02.mp3')
  })

  test('หยุดเสียง pauses; the next ฟังครูอ่าน resumes from the paused line', async ({ page }) => {
    await open(page)
    await button(page, 'ฟังครูอ่าน').click()
    await expect.poll(() => log(page)).toContain('play:/assets/audio/rhyme/line-01.mp3')
    await finish(page)
    await expectHighlighted(page, 1)
    await button(page, 'หยุดเสียง').click()
    await expect.poll(() => log(page)).toContain('pause:/assets/audio/rhyme/line-02.mp3')

    await button(page, 'ฟังครูอ่าน').click()
    await expectHighlighted(page, 1)
    const plays = (await log(page)).filter((entry) => entry.startsWith('play:'))
    expect(plays).toEqual(['play:/assets/audio/rhyme/line-01.mp3', 'play:/assets/audio/rhyme/line-02.mp3', 'play:/assets/audio/rhyme/line-02.mp3'])
  })

  test('starting teacher audio while recording stops the recording first', async ({ page }) => {
    await open(page)
    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    await button(page, 'ฟังครูอ่าน').click()
    await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
    const entries = await log(page)
    expect(entries.indexOf('record:stop')).toBeGreaterThanOrEqual(0)
    expect(entries.indexOf('record:stop')).toBeLessThan(entries.indexOf('play:/assets/audio/rhyme/line-01.mp3'))

    await button(page, 'อัดใหม่').click()
    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    await button(page, 'อ่านตามทีละวรรค').click()
    await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
  })

  test('mute stops the student recording and keeps it silent', async ({ page }) => {
    await open(page)
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'หยุดบันทึก').click()
    await button(page, 'ฟังเสียงตัวเอง').click()
    await expect.poll(async () => playedRecording(await log(page))).toBe(true)

    await page.getByRole('button', { name: 'ปิดเสียง' }).click()
    await expect.poll(async () => pausedRecording(await log(page))).toBe(true)

    const before = (await log(page)).length
    await button(page, 'ฟังเสียงตัวเอง').click()
    expect((await log(page)).slice(before)).toEqual([])
  })

  test('step mode: previous/next change the line and play it', async ({ page }) => {
    await open(page)
    await button(page, 'อ่านตามทีละวรรค').click()
    await expect.poll(() => log(page)).toEqual(['play:/assets/audio/rhyme/line-01.mp3'])
    await expectHighlighted(page, 0)
    await expect(button(page, 'วรรคก่อนหน้า')).toBeDisabled()

    await button(page, 'วรรคถัดไป').click()
    await expect.poll(() => log(page)).toContain('play:/assets/audio/rhyme/line-02.mp3')
    await expectHighlighted(page, 1)

    // Finishing a line in step mode keeps it selected and does not auto-advance.
    await finish(page)
    await expectHighlighted(page, 1)
    expect(await log(page)).not.toContain('play:/assets/audio/rhyme/line-03.mp3')

    await button(page, 'วรรคก่อนหน้า').click()
    await expect.poll(() => log(page)).toContain('play:/assets/audio/rhyme/line-01.mp3')
    await expectHighlighted(page, 0)

    for (let i = 0; i < 3; i++) await button(page, 'วรรคถัดไป').click()
    await expectHighlighted(page, 3)
    await expect(button(page, 'วรรคถัดไป')).toBeDisabled()
  })

  test('record, stop, play back and re-record, in memory only', async ({ page }) => {
    const uploads: string[] = []
    page.on('request', (request) => {
      if (request.method() !== 'GET') uploads.push(request.url())
    })
    await open(page)

    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    expect(await log(page)).toEqual(['mic:request', 'record:start'])

    await button(page, 'หยุดบันทึก').click()
    await expect.poll(() => log(page)).toEqual(['mic:request', 'record:start', 'record:stop', 'mic:release'])

    await button(page, 'ฟังเสียงตัวเอง').click()
    await expect.poll(async () => playedRecording(await log(page))).toBe(true)

    await button(page, 'อัดใหม่').click()
    await expect.poll(async () => pausedRecording(await log(page))).toBe(true)
    await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveCount(0)
    await expect(button(page, 'ลองอ่านเอง')).toBeVisible()

    expect(uploads).toEqual([])
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))
    expect(stored).not.toMatch(/blob:|record/i)
  })

  test('recording auto-stops at 30 seconds', async ({ page }) => {
    await page.clock.install()
    await open(page)
    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()

    await page.clock.runFor(29_000)
    expect(await log(page)).not.toContain('record:stop')
    await page.clock.runFor(1_000)
    // No polling: polling would let real time run past the cap.
    expect(await log(page)).toContain('record:stop')
    await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
  })

  test('TC-011: denied mic shows a friendly error and the Step still works', async ({ page }) => {
    await open(page, 'deny')
    await button(page, 'ลองอ่านเอง').click()
    await expect(page.getByRole('alert')).toContainText('ไมโครโฟน')
    await expect(button(page, 'ลองอ่านเอง')).toBeEnabled()

    await button(page, 'ฟังครูอ่าน').click()
    await expect.poll(() => log(page)).toContain('play:/assets/audio/rhyme/line-01.mp3')
    await expectHighlighted(page, 0)
    await expect(page.getByRole('link', { name: 'ถัดไป' })).toBeVisible()
  })

  test('leaving the Step while recording stops the recorder and releases the mic', async ({ page }) => {
    await open(page)
    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    await page.getByRole('link', { name: 'ถัดไป' }).click()
    await expect(page).toHaveURL(/\/lesson\/mae-kong\/8$/)
    await expect.poll(() => log(page)).toContain('mic:release')
  })

  test('karaoke: the playing line lights its words in order and the rhyme word pops', async ({ page }) => {
    await open(page)
    const words = lines(page).nth(1).locator('[data-active]')
    await expect(words).toHaveText(['ช้าง', 'ร้อง', 'เสียง', 'ดัง'])
    await button(page, 'อ่านตามทีละวรรค').click()
    await button(page, 'วรรคถัดไป').click()

    const seen: number[] = []
    await expect
      .poll(async () => {
        const active = await words.evaluateAll((els) => els.findIndex((el) => el.dataset.active === 'true'))
        if (active >= 0 && seen.at(-1) !== active) seen.push(active)
        return active
      })
      .toBe(3)
    expect(seen).toEqual([...seen].sort())
    expect(seen.length).toBeGreaterThan(1)
    // ดัง is a rhyme word: it pops to 1.15.
    await expect.poll(() => words.nth(3).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1.15)

    await finish(page)
    await expect(lines(page).nth(1).locator('[data-active="true"]')).toHaveCount(0)
  })

  test('the signboard sways; reduced motion keeps it still and the rhyme word unscaled', async ({ page }) => {
    await open(page)
    const angle = () =>
      page.getByTestId('rhyme-sign').evaluate((el) => {
        const m = new DOMMatrix(getComputedStyle(el).transform)
        return (Math.atan2(m.b, m.a) * 180) / Math.PI
      })
    await expect.poll(async () => Math.abs(await angle())).toBeGreaterThan(0.5)
    expect(Math.abs(await angle())).toBeLessThanOrEqual(1.51)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await button(page, 'อ่านตามทีละวรรค').click()
    const first = lines(page).nth(0).locator('[data-active]')
    await expect.poll(() => first.nth(3).getAttribute('data-active')).toBe('true')
    expect(await first.nth(3).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(1)
    expect(await angle()).toBe(0)
  })

  test('fits a 390px-tall landscape phone with ≥44px buttons', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await open(page)
    await button(page, 'อ่านตามทีละวรรค').click()
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'หยุดบันทึก').click()
    await expect(button(page, 'อัดใหม่')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    for (const box of await page.locator('section button').evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    )) {
      expect(box).toBeGreaterThanOrEqual(44)
    }
  })
})
