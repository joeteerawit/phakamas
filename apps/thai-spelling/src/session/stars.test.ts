import { describe, expect, it } from 'vitest'
import { maeKong } from '../lessons/mae-kong'
import type { ActivityResult } from './lessonSession'
import { activityStars, lessonStars } from './stars'

const result = (status: ActivityResult['status'], bestScore: number, maxScore = 10): ActivityResult => ({
  status,
  bestScore,
  maxScore,
  attemptCount: status === 'completed' ? 1 : 0,
  answers: null,
})

describe('activityStars', () => {
  it('gives 3 Stars for a full score', () => expect(activityStars(result('completed', 10))).toBe(3))
  it('gives 2 Stars from exactly 60 %', () => {
    expect(activityStars(result('completed', 6))).toBe(2)
    expect(activityStars(result('completed', 9))).toBe(2)
  })
  it('gives 1 Star for finishing below 60 %, even with 0', () => {
    expect(activityStars(result('completed', 5))).toBe(1)
    expect(activityStars(result('completed', 0))).toBe(1)
  })
  it('gives 0 Stars when skipped, in progress or not attempted', () => {
    expect(activityStars(result('skipped', 0))).toBe(0)
    expect(activityStars(result('in_progress', 0))).toBe(0)
    expect(activityStars(undefined)).toBe(0)
  })
})

describe('lessonStars', () => {
  it('adds the Stars of every Activity out of 3 each', () => {
    const stars = lessonStars(maeKong, {
      wordSelection: result('completed', 12, 12),
      wordFilling: result('completed', 4, 6),
      rhymeMatching: result('skipped', 0, 2),
    })
    expect(stars.total).toBe(5)
    expect(stars.max).toBe(9)
    expect(stars.activities.map((a) => [a.id, a.stars])).toEqual([
      ['wordSelection', 3],
      ['wordFilling', 2],
      ['rhymeMatching', 0],
    ])
  })
})
