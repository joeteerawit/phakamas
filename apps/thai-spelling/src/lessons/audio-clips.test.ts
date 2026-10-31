import { describe, expect, it } from 'vitest'
import { audioClips } from './audio-clips'
import { maeKong } from './mae-kong'

// Keys look like /public/assets/audio/intro.mp3.
const mp3s = Object.keys(import.meta.glob('/public/assets/audio/**/*.mp3'))

describe('audioClips', () => {
  it('finds every AudioClip in the Lesson data, once each', () => {
    expect(audioClips(maeKong).map((clip) => clip.id)).toEqual([
      'intro',
      'vocabulary/ling',
      'vocabulary/chang',
      'vocabulary/rang',
      'vocabulary/kang-keng',
      'vocabulary/dang',
      'vocabulary/khang-khao',
      'explanations/mae-kong',
      'feedback/keng-mak',
      'feedback/correct',
      'feedback/completed',
      'rhyme/line-01',
      'rhyme/line-02',
      'rhyme/line-03',
      'rhyme/line-04',
      'sentences/sentence-01',
      'sentences/sentence-02',
    ])
  })

  it('has a committed mp3 for every audio ID (run scripts/gen-audio.py if this fails)', () => {
    const missing = audioClips(maeKong)
      .map((clip) => `/public/assets/audio/${clip.id}.mp3`)
      .filter((path) => !mp3s.includes(path))
    expect(missing).toEqual([])
  })
})
