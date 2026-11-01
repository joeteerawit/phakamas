import type { Lesson } from '../lessons'
import { lessonActivities } from './activities'
import type { ActivityResult } from './lessonSession'

export const MAX_STARS = 3

/**
 * Stars for one Activity (GLOSSARY "Star"): full score 3, ≥ 60 % 2, finished 1, otherwise 0.
 * Derived from the Session's bestScore, so a later lower score never takes Stars away.
 */
export function activityStars(result: ActivityResult | undefined): number {
  if (result?.status !== 'completed') return 0
  if (result.bestScore >= result.maxScore) return 3
  return result.bestScore >= 0.6 * result.maxScore ? 2 : 1
}

/** Each Activity's Stars and the Lesson's total out of 3 per Activity. */
export function lessonStars(lesson: Lesson, results: Record<string, ActivityResult> = {}) {
  const activities = lessonActivities(lesson).map((activity) => ({ ...activity, stars: activityStars(results[activity.id]) }))
  return {
    activities,
    total: activities.reduce((sum, a) => sum + a.stars, 0),
    max: activities.length * MAX_STARS,
  }
}
