import { useEffect } from 'react'
import { create } from 'zustand'
import type { Lesson } from '../lessons'
import { useLessonSession } from './lessonSession'

/** The one place Activities are named and numbered: Activity id → its Step (spec §4). */
export const activitySteps = { wordSelection: 5, wordFilling: 6, rhymeMatching: 8 } as const
export type ActivityId = keyof typeof activitySteps

/** A scored Activity: its id in the Session, its Step and its max score (spec §4). */
export type LessonActivity = { id: ActivityId; step: number; maxScore: number }

export function lessonActivities(lesson: Lesson): LessonActivity[] {
  const maxScores: Record<ActivityId, number> = {
    wordSelection: lesson.wordSelection.choices.length,
    wordFilling: lesson.wordFilling.pictures.length,
    rhymeMatching: lesson.rhymeMatching.pairs.length,
  }
  return (Object.keys(activitySteps) as ActivityId[]).map((id) => ({ id, step: activitySteps[id], maxScore: maxScores[id] }))
}

export const lessonActivity = (lesson: Lesson, id: ActivityId) => lessonActivities(lesson).find((a) => a.id === id)!

type OpenActivity = {
  /** The open Activity has answers not yet checked; Home asks before leaving (TC-019). */
  unchecked: boolean
  /** A result ถัดไป records instead of skipped, e.g. Step 8's matched pairs so far. */
  partial: { score: number; answers: unknown } | null
}

/** The open Activity Step's unsaved work. Not persisted. */
export const useUncheckedWork = create<OpenActivity>(() => ({ unchecked: false, partial: null }))

/**
 * An Activity Step reports whether it has unchecked answers; cleared when it unmounts.
 * Unchecked work also marks the Activity `in_progress` in the Session.
 */
export function useReportUncheckedWork({ id, maxScore }: LessonActivity, unchecked: boolean) {
  useEffect(() => {
    useUncheckedWork.setState({ unchecked })
    if (unchecked) useLessonSession.getState().markActivityInProgress(id, maxScore)
    return () => useUncheckedWork.setState({ unchecked: false })
  }, [id, maxScore, unchecked])
}
