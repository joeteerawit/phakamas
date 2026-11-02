import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class FakeAudio {
  static all: FakeAudio[] = []
  paused = true
  loop = false
  volume = 1
  src: string
  constructor(src: string) {
    this.src = src
    FakeAudio.all.push(this)
  }
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
}

const music = () => FakeAudio.all.find((a) => a.src.includes('/music/'))

// Fresh module graph per test: the music channel and the stores keep module state.
async function load() {
  vi.resetModules()
  const audio = await import('./audioManager')
  const recorder = await import('./recorder')
  const session = await import('../session/lessonSession')
  const channel = await import('./music')
  return { audio, recorder, session, channel }
}

beforeEach(() => {
  FakeAudio.all = []
  localStorage.clear()
  vi.useFakeTimers()
  vi.stubGlobal('Audio', FakeAudio)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('background music', () => {
  it('stays silent until the first gesture, then loops at 0.25', async () => {
    await load()
    expect(music()).toBeUndefined()

    document.body.click()
    expect(music()).toMatchObject({ paused: false, loop: true, volume: 0.25 })
  })
  it('ducks to 0.06 within 200 ms while speech plays, and comes back up afterwards', async () => {
    const { audio } = await load()
    document.body.click()

    audio.useAudio.setState({ clipId: 'intro', status: 'playing' })
    vi.advanceTimersByTime(100)
    expect(music()!.volume).toBeGreaterThan(0.06)
    expect(music()!.volume).toBeLessThan(0.25)
    vi.advanceTimersByTime(100)
    expect(music()!.volume).toBe(0.06)

    audio.useAudio.setState({ clipId: null, status: 'idle' })
    vi.advanceTimersByTime(200)
    expect(music()!.volume).toBe(0.25)
  })

  it('starts ducked when speech is already playing at the first gesture', async () => {
    const { audio } = await load()
    audio.useAudio.setState({ clipId: 'intro', status: 'loading' })
    document.body.click()
    expect(music()!.volume).toBe(0.06)
  })

  it('the toggle pauses and resumes the music, and the choice is saved', async () => {
    const { channel, session } = await load()
    document.body.click()

    channel.toggleMusic()
    expect(music()!.paused).toBe(true)
    expect(session.useLessonSession.getState().musicOn).toBe(false)
    expect(JSON.parse(localStorage.getItem('thai-spelling:lesson-session')!).state.musicOn).toBe(false)

    channel.toggleMusic()
    expect(music()!.paused).toBe(false)
  })

  it('a saved "off" keeps the music silent after a gesture', async () => {
    localStorage.setItem('thai-spelling:lesson-session', JSON.stringify({ state: { session: null, musicOn: false }, version: 1 }))
    await load()
    document.body.click()
    expect(music()?.paused ?? true).toBe(true)
  })

  it('music off never blocks speech', async () => {
    const { audio, channel } = await load()
    const clip = { id: 'spelling/ling', text: 'ลอ อิ งอ ลิง' }
    const speech = () => FakeAudio.all.filter((a) => a.src === '/assets/audio/spelling/ling.mp3')
    document.body.click()

    channel.toggleMusic()
    audio.playClip(clip)
    expect(music()!.paused).toBe(true)
    expect(speech()).toHaveLength(1)
    expect(speech()[0]!.paused).toBe(false)
    expect(audio.useAudio.getState()).toMatchObject({ clipId: clip.id, status: 'loading' })

    // Music back on resumes under the clip without touching it.
    channel.toggleMusic()
    expect(music()).toMatchObject({ paused: false, volume: 0.06 })
    expect(speech()[0]!.paused).toBe(false)
  })

  it('a saved "off" still lets the first tap play speech', async () => {
    localStorage.setItem('thai-spelling:lesson-session', JSON.stringify({ state: { session: null, musicOn: false }, version: 1 }))
    const { audio } = await load()
    document.body.click()
    audio.playClip({ id: 'vocabulary/ling', text: 'ลิง' })
    expect(FakeAudio.all.find((a) => a.src === '/assets/audio/vocabulary/ling.mp3')?.paused).toBe(false)
    expect(music()?.paused ?? true).toBe(true)
  })

  it('pauses while the microphone is open and ducks under the recorder playback', async () => {
    const { recorder } = await load()
    document.body.click()

    recorder.useRecorder.setState({ status: 'recording' })
    expect(music()!.paused).toBe(true)

    recorder.useRecorder.setState({ status: 'ready', playing: true })
    expect(music()).toMatchObject({ paused: false, volume: 0.06 })
    recorder.useRecorder.setState({ playing: false })
    vi.advanceTimersByTime(200)
    expect(music()!.volume).toBe(0.25)
  })
})
