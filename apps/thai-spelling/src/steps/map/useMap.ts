import type { Lesson } from '../../lessons'
import { lessonActivities } from '../../session/activities'
import { useLessonSession } from '../../session/lessonSession'
import { activityStars } from '../../session/stars'

/** The Map's first stop; its last is the summary Step. */
export const FIRST_STOP = 2

/**
 * The Map's behaviour, shared by every Theme's Map (docs/game-concept.md): one stop per Step from 2 to the summary,
 * each with its title, whether it is done and, for an Activity, its Stars, all from the Session. Every stop is open.
 * The recommended stop is the first one not done yet (the summary once all are); `here` is the Step the student was
 * last on, where the Mascot stands, or null before the first stop.
 */
export function useMap(lesson: Lesson) {
  const session = useLessonSession((state) => (state.session?.lessonId === lesson.id ? state.session : null))
  const done = session?.completedSteps ?? []
  const activities = lessonActivities(lesson)
  const stops = lesson.steps.slice(FIRST_STOP - 1).map((step, i) => {
    const number = i + FIRST_STOP
    const activity = activities.find((a) => a.step === number)
    return {
      step: number,
      title: step.title,
      done: done.includes(number),
      stars: activity ? activityStars(session?.activities[activity.id]) : undefined,
    }
  })
  return {
    stops,
    recommended: (stops.find((stop) => !stop.done) ?? stops.at(-1)!).step,
    here: session && session.currentStep >= FIRST_STOP ? session.currentStep : null,
  }
}

export type MapStop = ReturnType<typeof useMap>['stops'][number]
