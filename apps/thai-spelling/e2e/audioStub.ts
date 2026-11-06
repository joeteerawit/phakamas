import type { Page } from '@playwright/test'

export type StubOptions = {
  /** ok: the mp3 plays; missing: play() rejects; pending: play() never settles. */
  mp3: 'ok' | 'missing' | 'pending'
  thaiVoice: boolean
}

export type AudioStub = {
  log: string[]
  /** The background-music element, kept out of `log` so speech assertions stay exact. */
  music: { paused: boolean; volume: number; loop: boolean } | null
  opts: StubOptions
  /** Ends whatever is playing, as the browser would. */
  finish: () => void
}

/** Replaces HTMLAudioElement and speechSynthesis with fakes that log what played. */
function stubAudio(opts: StubOptions) {
  const stub: AudioStub = { log: [], music: null, opts, finish: () => {} }
  ;(window as unknown as { __audio: AudioStub }).__audio = stub
  const path = (src: string) => new URL(src, location.href).pathname

  class FakeAudio {
    paused = true
    loop = false
    volume = 1
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    src: string
    constructor(src: string) {
      this.src = src
    }
    play() {
      if (path(this.src).startsWith('/assets/audio/music/')) {
        stub.music = this
        this.paused = false
        return Promise.resolve()
      }
      stub.log.push(`play:${path(this.src)}`)
      if (stub.opts.mp3 === 'missing') return Promise.reject(new DOMException('no file', 'NotSupportedError'))
      if (stub.opts.mp3 === 'pending') return new Promise<void>(() => {})
      this.paused = false
      stub.finish = () => {
        this.paused = true
        this.onended?.()
      }
      // Like a real element, an mp3 that already ended never reports playing.
      setTimeout(() => !this.paused && this.onplaying?.())
      return Promise.resolve()
    }
    pause() {
      if (!this.paused && stub.music !== this) stub.log.push(`pause:${path(this.src)}`)
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

export async function open(page: Page, step: number, opts: Partial<StubOptions> = {}, lessonId = 'mae-kong') {
  await page.addInitScript(stubAudio, { mp3: 'ok', thaiVoice: true, ...opts } as StubOptions)
  await page.goto(`/lesson/${lessonId}/${step}`)
}

export const audioLog = (page: Page) => page.evaluate(() => (window as unknown as { __audio: AudioStub }).__audio.log)
export const setStub = (page: Page, opts: Partial<StubOptions>) =>
  page.evaluate((o) => Object.assign((window as unknown as { __audio: AudioStub }).__audio.opts, o), opts)
export const musicState = (page: Page) =>
  page.evaluate(() => {
    const music = (window as unknown as { __audio: AudioStub }).__audio.music
    return music && { paused: music.paused, volume: music.volume, loop: music.loop }
  })
export const endCurrent = (page: Page) =>
  page.evaluate(() => (window as unknown as { __audio: AudioStub }).__audio.finish())

export type Mic = 'allow' | 'deny'

/** Fakes getUserMedia and MediaRecorder; events go to the shared audio stub log. */
export function stubMic(mic: Mic) {
  const log = (entry: string) => (window as unknown as { __audio: { log: string[] } }).__audio.log.push(entry)

  class FakeRecorder {
    state = 'inactive'
    mimeType = 'audio/webm'
    ondataavailable: ((event: { data: Blob }) => void) | null = null
    onstop: (() => void) | null = null
    start() {
      log('record:start')
      this.state = 'recording'
    }
    stop() {
      if (this.state === 'inactive') return
      log('record:stop')
      this.state = 'inactive'
      this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) })
      this.onstop?.()
    }
  }

  Object.assign(window, { MediaRecorder: FakeRecorder })
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        log('mic:request')
        if (mic === 'deny') throw new DOMException('denied', 'NotAllowedError')
        return { getTracks: () => [{ stop: () => log('mic:release') }] }
      },
    },
  })
}
