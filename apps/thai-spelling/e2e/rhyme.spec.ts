import { expect, type Page, test } from '@playwright/test'

type Stub = {
  log: string[]
  mic: 'allow' | 'deny'
  /** Ends whatever teacher clip or recording is playing. */
  finish: () => void
}

/**
 * Fakes HTMLAudioElement, getUserMedia and MediaRecorder; everything logs to `__stub.log`.
 * shortcut: duplicates the Audio fake from audio.spec.ts, move both to a shared helper when a third spec needs it.
 */
function stubMedia(mic: Stub['mic']) {
  const stub: Stub = { log: [], mic, finish: () => {} }
  ;(window as unknown as { __stub: Stub }).__stub = stub
  const name = (src: string) => (src.startsWith('blob:') ? 'recording' : new URL(src, location.href).pathname)

  class FakeAudio {
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    playing = false
    src: string
    constructor(src: string) {
      this.src = src
    }
    play() {
      stub.log.push(`play:${name(this.src)}`)
      this.playing = true
      stub.finish = () => this.onended?.()
      setTimeout(() => this.onplaying?.())
      return Promise.resolve()
    }
    pause() {
      if (this.playing) stub.log.push(`pause:${name(this.src)}`)
      this.playing = false
    }
  }

  class FakeRecorder {
    state = 'inactive'
    ondataavailable: ((event: { data: Blob }) => void) | null = null
    onstop: (() => void) | null = null
    start() {
      stub.log.push('record:start')
      this.state = 'recording'
    }
    stop() {
      if (this.state === 'inactive') return
      stub.log.push('record:stop')
      this.state = 'inactive'
      this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) })
      this.onstop?.()
    }
  }

  Object.assign(window, { Audio: FakeAudio, MediaRecorder: FakeRecorder })
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { getVoices: () => [], speak() {}, cancel() {}, addEventListener() {}, removeEventListener() {} },
  })
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        stub.log.push('mic:request')
        if (stub.mic === 'deny') throw new DOMException('denied', 'NotAllowedError')
        return { getTracks: () => [{ stop: () => stub.log.push('mic:release') }] }
      },
    },
  })
}

async function open(page: Page, mic: Stub['mic'] = 'allow') {
  await page.addInitScript(stubMedia, mic)
  await page.goto('/lesson/mae-kong/7')
}

const log = (page: Page) => page.evaluate(() => (window as unknown as { __stub: Stub }).__stub.log)
const finish = (page: Page) => page.evaluate(() => (window as unknown as { __stub: Stub }).__stub.finish())
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
    await expect.poll(() => log(page)).toContain('play:recording')

    await button(page, 'อัดใหม่').click()
    await expect.poll(() => log(page)).toContain('pause:recording')
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

  test('fits 360px with no horizontal scroll and ≥44px buttons', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await open(page)
    await button(page, 'อ่านตามทีละวรรค').click()
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'หยุดบันทึก').click()
    await expect(button(page, 'อัดใหม่')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    for (const box of await page.locator('main button, section button').evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    )) {
      expect(box).toBeGreaterThanOrEqual(44)
    }
  })
})
