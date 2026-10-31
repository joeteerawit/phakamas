import { describe, expect, it } from 'vitest'
import { maeKong } from '../lessons/mae-kong'
import { lessonActivities } from './activities'

describe('lessonActivities', () => {
  it('lists the scored Activities of แม่กง with their Steps and max scores (spec §4: 16 in all)', () => {
    const activities = lessonActivities(maeKong)
    expect(activities.map(({ id, step, maxScore }) => [id, step, maxScore])).toEqual([
      ['wordSelection', 5, 7],
      ['wordFilling', 6, 6],
      ['rhymeMatching', 8, 3],
    ])
    expect(activities.reduce((sum, a) => sum + a.maxScore, 0)).toBe(16)
  })
})
