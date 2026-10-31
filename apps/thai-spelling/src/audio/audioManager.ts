import { create } from 'zustand'
import type { AudioClip } from '../lessons'

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'error'

type AudioState = {
  /** The clip being loaded/played, or whose playback failed. */
  clipId: string | null
  status: AudioStatus
  muted: boolean
}

/**
 * The one AudioManager (spec §5): one sound at a time, global mute,
 * mp3 by audio ID → Web Speech th-TH fallback → `error` (the UI offers retry).
 */
export const useAudio = create<AudioState>(() => ({ clipId: null, status: 'idle', muted: false }))

/** Status of `clipId`; every other clip reads as idle. */
export const useClipStatus = (clipId: string): AudioStatus =>
  useAudio((state) => (state.clipId === clipId ? state.status : 'idle'))

let audio: HTMLAudioElement | null = null
// Bumped on every play/stop so callbacks from an older sound are ignored.
let playToken = 0

export function playClip(clip: AudioClip) {
  stopAudio()
  if (useAudio.getState().muted) return

  const token = ++playToken
  const isCurrent = () => token === playToken
  const set = (status: AudioStatus) => {
    if (isCurrent()) useAudio.setState({ clipId: clip.id, status })
  }
  set('loading')

  const element = new Audio(`/assets/audio/${clip.id}.mp3`)
  audio = element
  let fellBack = false
  const fallback = () => {
    if (fellBack || !isCurrent()) return
    fellBack = true
    element.pause()
    void speak(clip, set, isCurrent)
  }
  element.onplaying = () => set('playing')
  element.onended = () => set('idle')
  element.onerror = fallback
  element.play().catch(fallback)
}

export function stopAudio() {
  playToken++
  audio?.pause()
  audio = null
  globalThis.speechSynthesis?.cancel()
  useAudio.setState({ clipId: null, status: 'idle' })
}

export function toggleMute() {
  const muted = !useAudio.getState().muted
  useAudio.setState({ muted })
  if (muted) stopAudio()
}

async function speak(clip: AudioClip, set: (status: AudioStatus) => void, isCurrent: () => boolean) {
  const synth = globalThis.speechSynthesis
  const voice = synth ? await thaiVoice(synth) : undefined
  if (!isCurrent()) return
  if (!synth || !voice) return set('error')

  const utterance = new SpeechSynthesisUtterance(clip.text)
  utterance.lang = 'th-TH'
  utterance.voice = voice
  utterance.onstart = () => set('playing')
  utterance.onend = () => set('idle')
  utterance.onerror = () => set('error')
  synth.speak(utterance)
}

async function thaiVoice(synth: SpeechSynthesis) {
  // Chrome fills the voice list asynchronously; wait briefly the first time.
  if (synth.getVoices().length === 0) {
    await new Promise((resolve) => {
      synth.addEventListener('voiceschanged', resolve, { once: true })
      setTimeout(resolve, 1000)
    })
  }
  return synth.getVoices().find((voice) => /^th([-_]|$)/i.test(voice.lang))
}

// Spec §3: page unload stops the sound.
globalThis.addEventListener?.('pagehide', stopAudio)
