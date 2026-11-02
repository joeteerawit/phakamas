import { useLessonSession } from '../session/lessonSession'
import { useAudio } from './audioManager'
import { useRecorder } from './recorder'

/** CC0 loop, see docs/canva-assets.md (#20). */
const MUSIC_SRC = '/assets/audio/music/happy-clappy-loop.mp3'
export const MUSIC_VOLUME = 0.25
export const DUCKED_VOLUME = 0.06
const FADE_MS = 200
const FADE_STEPS = 10

/**
 * The music channel of the AudioManager (#20). A separate module because the recorder imports the
 * AudioManager, and music has to watch both. Starts on the first gesture (autoplay policy), loops,
 * ducks under speech and recorder playback, pauses while the microphone is open.
 * Turning music off only stops this channel: speech and recorder playback keep working.
 */
let started = false
let music: HTMLAudioElement | null = null
let fade: ReturnType<typeof setInterval> | undefined

export const toggleMusic = () => {
  const { musicOn, setMusicOn } = useLessonSession.getState()
  setMusicOn(!musicOn)
}

function sync() {
  const { status } = useAudio.getState()
  const recorder = useRecorder.getState()
  const micOpen = recorder.status === 'requesting' || recorder.status === 'recording'
  if (!started || micOpen || !useLessonSession.getState().musicOn) {
    clearInterval(fade)
    music?.pause()
    return
  }

  const ducked = status === 'loading' || status === 'playing' || recorder.playing
  const target = ducked ? DUCKED_VOLUME : MUSIC_VOLUME
  if (!music) {
    music = new Audio(MUSIC_SRC)
    music.loop = true
  }
  if (music.paused) {
    clearInterval(fade)
    music.volume = target
    void music.play().catch(() => {})
  } else fadeTo(music, target)
}

function fadeTo(element: HTMLAudioElement, target: number) {
  clearInterval(fade)
  const from = element.volume
  if (from === target) return
  let step = 0
  fade = setInterval(() => {
    step++
    element.volume = step >= FADE_STEPS ? target : from + ((target - from) * step) / FADE_STEPS
    if (step >= FADE_STEPS) clearInterval(fade)
  }, FADE_MS / FADE_STEPS)
}

function start() {
  started = true
  sync()
}

// `click`/`keydown` carry user activation, so play() is allowed from here.
globalThis.addEventListener?.('click', start, { once: true })
globalThis.addEventListener?.('keydown', start, { once: true })
useAudio.subscribe(sync)
useRecorder.subscribe(sync)
useLessonSession.subscribe(sync)
