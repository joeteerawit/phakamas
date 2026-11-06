import { useEffect, useState } from 'react'
import { playClip, stopAudio, useAudio, useClipStatus, type AudioStatus } from '../../audio/audioManager'
import {
  discardRecording,
  MAX_RECORDING_MS,
  playRecording,
  startRecording,
  stopRecording,
  useRecorder,
} from '../../audio/recorder'
import type { Lesson, VocabularyWord } from '../../lessons'

const statusText: Partial<Record<AudioStatus, string>> = {
  loading: 'กำลังโหลด',
  playing: 'กำลังเล่น',
  error: 'เล่นเสียงไม่ได้ ลองอีกครั้ง',
}

/**
 * Step 3's behaviour, shared by every Theme: one word at a time, played only on demand; when its clip ends
 * it is the child's turn to read, and hearing every word completes the Step. Changing word stops the sound
 * and throws the recording away.
 */
export function useListenRepeat(lesson: Lesson) {
  const words = lesson.listenAndRepeat
  const [index, setIndex] = useState(0)
  // 0 = first card (pops in); ±1 = slide from the next/previous side.
  const [direction, setDirection] = useState(0)
  const [heard, setHeard] = useState<ReadonlySet<string>>(() => new Set())
  const [endedId, setEndedId] = useState<string | null>(null)
  const current = words[index] ?? words[0]!
  const status = useClipStatus(current.audio.id)

  // A clip ended on its own (playing → idle, same clip); stopAudio clears clipId instead.
  useEffect(
    () =>
      useAudio.subscribe((next, prev) => {
        if (prev.status !== 'playing' || next.status !== 'idle' || !next.clipId || next.clipId !== prev.clipId) return
        const id = next.clipId
        setHeard((old) => new Set(old).add(id))
        setEndedId(id)
      }),
    [],
  )
  useEffect(() => discardRecording, [])

  const goTo = (i: number) => {
    stopAudio()
    discardRecording()
    setEndedId(null)
    setDirection(i >= index ? 1 : -1)
    setIndex(i)
  }

  return {
    words,
    index,
    direction,
    current,
    status,
    statusText: statusText[status],
    heard: (item: VocabularyWord) => heard.has(item.audio.id),
    complete: words.every((item) => heard.has(item.audio.id)),
    yourTurn: endedId === current.audio.id && status === 'idle',
    playing: status === 'playing',
    listenLabel: heard.has(current.audio.id) ? 'ฟังอีกครั้ง' : 'ฟังเสียง',
    goTo,
    // Teacher audio never plays into a recording (as on Steps 7 and 9).
    listen: () => {
      stopRecording()
      playClip(current.audio)
    },
  }
}

/** Step 3's recorder: record or stop, the whole seconds left while recording, and playing the result back. */
export function useListenRepeatRecorder() {
  const status = useRecorder((state) => state.status)
  const recording = status === 'recording'
  const secondsLeft = useSecondsLeft(recording)
  return {
    status,
    recording,
    secondsLeft,
    toggle: recording ? stopRecording : () => void startRecording(),
    playBack: playRecording,
  }
}

/** Whole seconds left of MAX_RECORDING_MS while recording. */
function useSecondsLeft(recording: boolean) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!recording) return
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 250)
    return () => {
      clearInterval(id)
      setElapsed(0)
    }
  }, [recording])
  return Math.max(0, Math.ceil((MAX_RECORDING_MS - elapsed) / 1000))
}
