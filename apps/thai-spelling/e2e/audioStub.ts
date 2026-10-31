import type { Page } from '@playwright/test'

export type StubOptions = {
  /** ok: the mp3 plays; missing: play() rejects; pending: play() never settles. */
  mp3: 'ok' | 'missing' | 'pending'
  thaiVoice: boolean
}

export type AudioStub = {
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

export async function open(page: Page, step: number, opts: Partial<StubOptions> = {}) {
  await page.addInitScript(stubAudio, { mp3: 'ok', thaiVoice: true, ...opts } as StubOptions)
  await page.goto(`/lesson/mae-kong/${step}`)
}

export const audioLog = (page: Page) => page.evaluate(() => (window as unknown as { __audio: AudioStub }).__audio.log)
export const setStub = (page: Page, opts: Partial<StubOptions>) =>
  page.evaluate((o) => Object.assign((window as unknown as { __audio: AudioStub }).__audio.opts, o), opts)
export const endCurrent = (page: Page) =>
  page.evaluate(() => (window as unknown as { __audio: AudioStub }).__audio.finish())

