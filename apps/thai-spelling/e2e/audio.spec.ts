import { expect, type Page, test } from '@playwright/test'

type StubOptions = {
  /** ok: the mp3 plays; missing: play() rejects; pending: play() never settles. */
  mp3: 'ok' | 'missing' | 'pending'
  thaiVoice: boolean
}

type AudioStub = {
  log: string[]
  opts: StubOptions
  /** Ends whatever is playing, as the browser would. */
  finish: () => void
}

/** Replaces HTMLAudioElement and speechSynthesis with fakes that log what played. */
function stubAudio(opts: StubOptions) {
  const stub: AudioStub = { log: [], opts, finish: () => {} }
  ;(window as unknown as { __audio: AudioStub }).__audio = stub
  const path = (src: string) => new URL(src, location.href).pathname

  class FakeAudio {
    paused = true
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    src: string
    constructor(src: string) {
      this.src = src
    }
    play() {
      stub.log.push(`play:${path(this.src)}`)
      if (stub.opts.mp3 === 'missing') return Promise.reject(new DOMException('no file', 'NotSupportedError'))
      if (stub.opts.mp3 === 'pending') return new Promise<void>(() => {})
      this.paused = false
      stub.finish = () => this.onended?.()
      setTimeout(() => this.onplaying?.())
      return Promise.resolve()
    }
    pause() {
      if (!this.paused) stub.log.push(`pause:${path(this.src)}`)
      this.paused = true
    }
  }

  class FakeUtterance {
    lang = ''
    voice: unknown = null
    onstart: (() => void) | null = null
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    text: string
    constructor(text: string) {
      this.text = text
    }
  }

  const thai = { lang: 'th-TH', name: 'Thai', default: false, localService: true, voiceURI: 'th' }
  Object.assign(window, { Audio: FakeAudio, SpeechSynthesisUtterance: FakeUtterance })
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => (stub.opts.thaiVoice ? [thai] : []),
      speak(utterance: FakeUtterance) {
        stub.log.push(`speak:${utterance.text}|${utterance.lang}`)
        stub.finish = () => utterance.onend?.()
        setTimeout(() => utterance.onstart?.())
      },
      cancel() {},
      addEventListener() {},
      removeEventListener() {},
    },
  })
}

async function open(page: Page, step: number, opts: Partial<StubOptions> = {}) {
  await page.addInitScript(stubAudio, { mp3: 'ok', thaiVoice: true, ...opts } as StubOptions)
  await page.goto(`/lesson/mae-kong/${step}`)
}

const audioLog = (page: Page) => page.evaluate(() => (window as unknown as { __audio: AudioStub }).__audio.log)
const setStub = (page: Page, opts: Partial<StubOptions>) =>
  page.evaluate((o) => Object.assign((window as unknown as { __audio: AudioStub }).__audio.opts, o), opts)
const endCurrent = (page: Page) =>
  page.evaluate(() => (window as unknown as { __audio: AudioStub }).__audio.finish())

const card = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word} `) })

test.describe('Step 2 vocabulary cards', () => {
  test('shows 6 picture cards in spec order', async ({ page }) => {
    await open(page, 2)
    const cards = page.getByRole('list').getByRole('button')
    await expect(cards).toHaveCount(6)
    for (const [i, word] of ['ลิง', 'ช้าง', 'รัง', 'กางเกง', 'ดัง', 'ค้างคาว'].entries()) {
      await expect(cards.nth(i)).toHaveAccessibleName(new RegExp(`^${word} `))
      await expect(cards.nth(i).locator('img')).toHaveJSProperty('complete', true)
    }
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
    await card(page, 'กางเกง').click()
    await expect
      .poll(() => audioLog(page))
      .toEqual(['play:/assets/audio/vocabulary/kang-keng.mp3', 'speak:กางเกง|th-TH'])
    await expect(card(page, 'กางเกง')).toContainText('กำลังเล่น')
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
    await card(page, 'ค้างคาว').click()
    await expect(card(page, 'ค้างคาว')).toContainText('กำลังเล่น')
    await page.getByRole('link', { name: 'ถัดไป' }).click()
    await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/khang-khao.mp3')
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

test.describe('Step 1 intro', () => {
  test('ฟังคำแนะนำ plays the intro and pressing again stops it', async ({ page }) => {
    await open(page, 1)
    await page.getByRole('button', { name: 'ฟังคำแนะนำ' }).click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/intro.mp3'])

    await page.getByRole('button', { name: 'หยุดเสียง' }).click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/intro.mp3', 'pause:/assets/audio/intro.mp3'])
    await expect(page.getByRole('button', { name: 'ฟังคำแนะนำ' })).toBeVisible()
  })

  test('intro fallback reads the intro script in Thai', async ({ page }) => {
    await open(page, 1, { mp3: 'missing' })
    await page.getByRole('button', { name: 'ฟังคำแนะนำ' }).click()
    await expect.poll(() => audioLog(page)).toContain('speak:สวัสดีเด็ก ๆ วันนี้เราจะมาเรียนรู้คำคล้องจองในมาตราแม่กงกัน พร้อมแล้วกดเริ่มเรียนได้เลย|th-TH')
  })

  test('เริ่มเรียน navigates immediately while the intro plays, and stops it', async ({ page }) => {
    await open(page, 1)
    await page.getByRole('button', { name: 'ฟังคำแนะนำ' }).click()
    await expect(page.getByRole('button', { name: 'หยุดเสียง' })).toBeVisible()

    await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
    await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
    await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/intro.mp3')
  })
})
