import { useEffect, useRef, useState } from 'react'
import { playClip, stopAudio, useAudio } from '../../../audio/audioManager'
import { discardRecording, useRecorder } from '../../../audio/recorder'
import type { VocabularyWord } from '../../../lessons'

/** Where a frog's song comes from: the child's own take, or (microphone refused) the word they listened to. */
type Take = { kind: 'recording'; url: string } | { kind: 'listened' }
type Song = { word: VocabularyWord; take: Take }

/**
 * แม่กบ Step 3's choir. The shared Recorder keeps one recording and throws it away on the next start, so each finished
 * take is copied into an object URL this hook owns (in memory only, never uploaded, AUD-010), one per word: each word
 * recorded brings one frog. If the microphone is refused or missing, hearing a word brings its frog instead. `sing`
 * plays the frogs' songs in word order, one sound at a time; any other sound starting, `stop` or leaving stops it.
 */
export function useFrogChoir(words: readonly VocabularyWord[], current: VocabularyWord, heard: (word: VocabularyWord) => boolean) {
  const [takes, setTakes] = useState<ReadonlyMap<string, Take>>(() => new Map())
  const [singing, setSinging] = useState<number | null>(null)
  const recorderStatus = useRecorder((state) => state.status)
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (recorderStatus === 'denied' || recorderStatus === 'unsupported')) setMicBlocked(true)

  const currentId = useRef(current.audio.id)
  useEffect(() => {
    currentId.current = current.audio.id
  }, [current.audio.id])

  // Copy each finished take before the Recorder throws it away.
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        if (next.status !== 'ready' || !next.url || next.url === prev.url) return
        const id = currentId.current
        void fetch(next.url)
          .then((response) => response.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob)
            setTakes((old) => {
              const before = old.get(id)
              if (before?.kind === 'recording') URL.revokeObjectURL(before.url)
              return new Map(old).set(id, { kind: 'recording', url })
            })
          })
      }),
    [],
  )

  const takeOf = (word: VocabularyWord): Take | undefined =>
    takes.get(word.audio.id) ?? (micBlocked && heard(word) ? { kind: 'listened' } : undefined)
  const frogs = words.filter((word) => takeOf(word))

  // The song on now: the choir's own player for a recording, or the clip it waits on for a listened word.
  const choir = useRef<{ songs: Song[]; at: number; player: HTMLAudioElement | null; clip: string | null } | null>(null)

  const stop = () => {
    const on = choir.current
    choir.current = null
    on?.player?.pause()
    if (on?.clip) stopAudio()
    setSinging(null)
  }

  const play = () => {
    const on = choir.current
    if (!on) return
    const song = on.songs[on.at]
    if (!song) {
      choir.current = null
      return setSinging(null)
    }
    setSinging(on.at)
    const next = () => {
      if (choir.current !== on) return
      on.at++
      on.player = null
      on.clip = null
      play()
    }
    if (song.take.kind === 'recording') {
      const element = new Audio(song.take.url)
      on.player = element
      element.onended = next
      void element.play().catch(next)
    } else {
      on.clip = song.word.audio.id
      playClip(song.word.audio)
    }
  }

  // A listened frog's clip ending moves the choir on; any other sound starting stops it.
  const latest = useRef({ play, stop })
  useEffect(() => {
    latest.current = { play, stop }
  })
  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        const on = choir.current
        if (!on) return
        if (state.status === 'loading' && state.clipId !== on.clip) {
          // Someone else's sound: stop singing but leave that sound playing.
          on.clip = null
          return latest.current.stop()
        }
        if (!on.clip || prev.clipId !== on.clip || state.clipId !== on.clip || state.status !== 'idle' || prev.status === 'idle') return
        on.at++
        on.clip = null
        latest.current.play()
      }),
    [],
  )

  // Leaving the Step stops the choir and frees every take.
  const owned = useRef<ReadonlyMap<string, Take>>(takes)
  useEffect(() => {
    owned.current = takes
  }, [takes])
  useEffect(
    () => () => {
      choir.current?.player?.pause()
      choir.current = null
      for (const take of owned.current.values()) if (take.kind === 'recording') URL.revokeObjectURL(take.url)
    },
    [],
  )

  return {
    frogs,
    /** Index in `frogs` of the frog singing now, or null. */
    singing,
    complete: frogs.length === words.length,
    micBlocked,
    sing: () => {
      stop()
      discardRecording()
      stopAudio()
      choir.current = { songs: frogs.map((word) => ({ word, take: takeOf(word)! })), at: 0, player: null, clip: null }
      play()
    },
    stop,
  }
}
