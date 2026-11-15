import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../../../audio/audioManager'
import { useRecorder } from '../../../audio/recorder'
import type { VocabularyWord } from '../../../lessons'

/**
 * แม่กน Step 3's marigold garland: each word recorded threads one marigold, in word order. The shared Recorder keeps
 * only the latest take, so the garland just remembers which words have one. If the microphone is refused or
 * missing, hearing a word to its end threads its marigold instead, so the Game can still be finished. `restart`
 * takes every flower off for another round.
 */
export function useGarland(words: readonly VocabularyWord[], current: VocabularyWord) {
  const [recorded, setRecorded] = useState<ReadonlySet<string>>(() => new Set())
  const [heard, setHeard] = useState<ReadonlySet<string>>(() => new Set())
  const status = useRecorder((state) => state.status)
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (status === 'denied' || status === 'unsupported')) setMicBlocked(true)

  const currentId = useRef(current.audio.id)
  useEffect(() => {
    currentId.current = current.audio.id
  }, [current.audio.id])

  // A take finishing threads the word it was recorded for.
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        if (next.status === 'ready' && next.url && next.url !== prev.url) setRecorded((old) => new Set(old).add(currentId.current))
      }),
    [],
  )
  // A word's clip played to its end (playing → idle, same clip), for when the microphone is refused.
  useEffect(
    () =>
      useAudio.subscribe((next, prev) => {
        if (prev.status !== 'playing' || next.status !== 'idle' || !next.clipId || next.clipId !== prev.clipId) return
        const id = next.clipId
        setHeard((old) => new Set(old).add(id))
      }),
    [],
  )

  const threaded = (word: VocabularyWord) => recorded.has(word.audio.id) || (micBlocked && heard.has(word.audio.id))
  const flowers = words.filter(threaded)

  return {
    flowers,
    threaded,
    complete: flowers.length === words.length,
    restart: () => {
      setRecorded(new Set())
      setHeard(new Set())
    },
  }
}
