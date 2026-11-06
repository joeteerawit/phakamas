import { useEffect, useState } from 'react'
import { clipDurationMs, playClip, useClipStatus } from '../../audio/audioManager'
import type { Lesson, SpottingWord } from '../../lessons'

/** Per-part highlight time until the clip's length is known (speech fallback, metadata still loading). */
const PART_MS = 500

/**
 * Step 4's behaviour, shared by every Theme: one set of words at a time; tapping a word plays its slow
 * spelling and sweeps its spelling part by part, spread over the clip; ฟังคำอธิบาย plays the explanation.
 */
export function useSpotting(lesson: Lesson) {
  const { explanation, sets } = lesson.spotting
  const explaining = useClipStatus(explanation.id) === 'playing'
  const [setIndex, setSetIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [sweep, setSweep] = useState<{ word: SpottingWord; part: number } | null>(null)

  useEffect(() => {
    if (!sweep) return
    const next = sweep.part + 1
    const parts = sweep.word.spelling.length
    // Spread the parts over the clip once its length is known (read again on each part).
    const clip = clipDurationMs()
    const partMs = clip > 0 ? clip / parts : PART_MS
    const timer = setTimeout(() => setSweep(next < parts ? { ...sweep, part: next } : null), partMs)
    return () => clearTimeout(timer)
  }, [sweep])

  return {
    sets,
    setIndex,
    /** +1 when the set shown is later than the last one, -1 when earlier. */
    direction,
    words: sets[setIndex] ?? [],
    explaining,
    explain: () => playClip(explanation),
    showSet: (index: number) => {
      setDirection(index > setIndex ? 1 : -1)
      setSetIndex(index)
      setSweep(null)
    },
    play: (word: SpottingWord) => {
      playClip(word.spellingAudio)
      setSweep({ word, part: 0 })
    },
    /** Index of the spelling part being read, or null when the word is not playing. */
    activePart: (word: SpottingWord) => (sweep?.word === word ? sweep.part : null),
  }
}

/** Whether a word's spelling clip is playing (its speaker shows sound waves). */
export const useSpellingPlaying = (word: SpottingWord) => useClipStatus(word.spellingAudio.id) === 'playing'

/** A spotting word's comic picture card, named after its clip. */
export const spottingPicture = (word: SpottingWord) => `/assets/comic/word-${word.audio.id.split('/').pop()}.webp`
