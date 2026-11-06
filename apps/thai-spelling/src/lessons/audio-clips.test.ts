import { describe, expect, it } from 'vitest'
import { audioClips } from './audio-clips'
import { allLessons } from './index'
import { maeKom } from './mae-kom'
import { maeKong } from './mae-kong'

// Keys look like /public/assets/audio/intro.mp3.
// Background music (#20) is not an AudioClip.
const mp3s = Object.keys(import.meta.glob(['/public/assets/audio/**/*.mp3', '!/public/assets/audio/music/**']))
const everyClip = allLessons.flatMap(audioClips)

describe('audioClips', () => {
  it('finds every AudioClip in the Lesson data, once each', () => {
    expect(audioClips(maeKong).map((clip) => clip.id)).toEqual([
      'intro',
      'vocabulary/ling',
      'vocabulary/chang',
      'vocabulary/dang',
      'vocabulary/rang',
      'vocabulary/khang',
      'vocabulary/phueng',
      'explanations/mae-kong',
      'spelling/ling',
      'spelling/chang',
      'spelling/dang',
      'spelling/rang',
      'spelling/khang',
      'spelling/phueng',
      'vocabulary/ngu',
      'vocabulary/ban',
      'vocabulary/kom',
      'vocabulary/sung',
      'vocabulary/lung',
      'vocabulary/ngao',
      'feedback/keng-mak',
      'vocabulary/mong',
      'vocabulary/fang',
      'vocabulary/rong',
      'feedback/correct',
      'rhyme/line-01',
      'rhyme/line-02',
      'rhyme/line-03',
      'rhyme/line-04',
      'sentences/sentence-01',
      'sentences/sentence-02',
    ])
  })

  it('finds every แม่กม AudioClip, reusing the shared word and feedback clips', () => {
    expect(audioClips(maeKom).map((clip) => clip.id)).toEqual([
      'explanations/mae-kom-intro',
      'vocabulary/rom',
      'vocabulary/lom',
      'vocabulary/som',
      'vocabulary/nom',
      'vocabulary/phom',
      'vocabulary/cham',
      'explanations/mae-kom',
      'spelling/rom',
      'spelling/lom',
      'spelling/som',
      'spelling/nom',
      'spelling/phom',
      'spelling/cham',
      'vocabulary/maeo',
      'vocabulary/yim',
      'vocabulary/ma',
      'vocabulary/ling',
      'vocabulary/kaem',
      'vocabulary/mue',
      'feedback/keng-mak',
      'vocabulary/chom',
      'feedback/correct',
      'rhyme/mae-kom/line-01',
      'rhyme/mae-kom/line-02',
      'rhyme/mae-kom/line-03',
      'rhyme/mae-kom/line-04',
      'sentences/mae-kom/sentence-01',
      'sentences/mae-kom/sentence-02',
    ])
  })

  it('gives an id the same text in every Lesson, so one mp3 fits all of them', () => {
    const texts = new Map<string, Set<string>>()
    for (const { id, text } of everyClip) texts.set(id, (texts.get(id) ?? new Set()).add(text))
    expect([...texts].filter(([, set]) => set.size > 1)).toEqual([])
  })

  it('has a committed mp3 for every audio ID of every Lesson (run scripts/gen-audio.sh if this fails)', () => {
    const missing = everyClip
      .map((clip) => `/public/assets/audio/${clip.id}.mp3`)
      .filter((path) => !mp3s.includes(path))
    expect([...new Set(missing)]).toEqual([])
  })

  it('has no orphan mp3 that no Lesson AudioClip uses', () => {
    const used = everyClip.map((clip) => `/public/assets/audio/${clip.id}.mp3`)
    expect(mp3s.filter((path) => !used.includes(path))).toEqual([])
  })
})
