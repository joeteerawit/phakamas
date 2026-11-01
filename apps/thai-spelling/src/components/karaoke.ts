import { useEffect, useState } from 'react'
import { clipDurationMs } from '../audio/audioManager'

const segmenter = new Intl.Segmenter('th', { granularity: 'word' })

/** The words of a Thai line (Thai has no spaces between words). */
export const splitWords = (text: string) =>
  [...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment)

/** Which word a karaoke highlight is on, `elapsed` ms into a clip of `duration` ms, words spread evenly. */
export const karaokeWord = (elapsed: number, duration: number, wordCount: number) =>
  Math.min(Math.floor((elapsed / duration) * wordCount), wordCount - 1)

// Speech fallback has no known length; Thai TTS reads roughly this fast.
const FALLBACK_WORD_MS = 300

/** Index of the word being read while `playing`, else null; words spread evenly over the clip. */
export function useKaraokeWord(playing: boolean, wordCount: number) {
  const [word, setWord] = useState(0)
  useEffect(() => {
    if (!playing) return
    const start = performance.now()
    const clip = clipDurationMs()
    const duration = clip > 0 ? clip : wordCount * FALLBACK_WORD_MS
    let frame = 0
    const tick = () => {
      setWord(karaokeWord(performance.now() - start, duration, wordCount))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [playing, wordCount])
  return playing ? word : null
}
