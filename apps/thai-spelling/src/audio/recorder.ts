import { create } from 'zustand'
import { stopAudio, useAudio } from './audioManager'

/** idle → requesting (mic permission) → recording → ready (playback); denied/unsupported show an error. */
export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'ready' | 'denied' | 'unsupported'

/** Spec §2 Step 7/9: at most 30 s per recording. */
export const MAX_RECORDING_MS = 30_000

type RecorderState = {
  status: RecorderStatus
  /** Object URL of the finished recording. In memory only (AUD-010): never uploaded or persisted. */
  url: string | null
}

/**
 * The one Recorder (spec §5, AUD-009/010), shared by Steps 7 and 9.
 * One recording at a time; the microphone is asked for only on an explicit start.
 */
export const useRecorder = create<RecorderState>(() => ({ status: 'idle', url: null }))

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let player: HTMLAudioElement | null = null
// Bumped on every start/discard so a late permission answer is ignored.
let token = 0

export async function startRecording() {
  discardRecording()
  const mine = ++token
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    return useRecorder.setState({ status: 'unsupported' })
  }
  stopAudio()
  useRecorder.setState({ status: 'requesting' })

  let granted: MediaStream
  try {
    granted = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    if (mine === token) useRecorder.setState({ status: 'denied' })
    return
  }
  if (mine !== token) return release(granted)

  stream = granted
  const chunks: Blob[] = []
  const active = new MediaRecorder(granted)
  recorder = active
  active.ondataavailable = (event) => chunks.push(event.data)
  active.onstop = () => {
    release(granted)
    if (mine !== token) return
    useRecorder.setState({ status: 'ready', url: URL.createObjectURL(new Blob(chunks, { type: active.mimeType })) })
  }
  active.start()
  timer = setTimeout(stopRecording, MAX_RECORDING_MS)
  useRecorder.setState({ status: 'recording' })
}

/** Ends the recording; the result becomes playable (`ready`). */
export function stopRecording() {
  clearTimeout(timer)
  if (recorder?.state !== 'inactive') recorder?.stop()
  recorder = null
}

export function playRecording() {
  const { url } = useRecorder.getState()
  if (!url) return
  stopAudio()
  stopPlayback()
  player = new Audio(url)
  void player.play().catch(() => {})
}

/** Stops everything and throws the recording away, e.g. อัดใหม่ or leaving the Step. */
export function discardRecording() {
  token++
  stopRecording()
  if (stream) release(stream)
  stopPlayback()
  const { url } = useRecorder.getState()
  if (url) URL.revokeObjectURL(url)
  useRecorder.setState({ status: 'idle', url: null })
}

function stopPlayback() {
  player?.pause()
  player = null
}

function release(granted: MediaStream) {
  for (const track of granted.getTracks()) track.stop()
  if (stream === granted) stream = null
}

// One sound at a time: a teacher clip starting stops the student's playback.
useAudio.subscribe((state) => {
  if (state.status === 'loading') stopPlayback()
})

// Spec §3: page unload stops sound and recording.
globalThis.addEventListener?.('pagehide', discardRecording)
