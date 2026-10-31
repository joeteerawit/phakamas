import { useEffect } from 'react'
import { create } from 'zustand'
import type { Lesson } from '../lessons'

/** A scored Activity: its id in the Session, its Step and its max score (spec §4). */
export type LessonActivity = { id: string; step: number; maxScore: number }

export function lessonActivities(lesson: Lesson): LessonActivity[] {
  return [
    { id: 'wordSelection', step: 5, maxScore: lesson.wordSelection.choices.length },
    { id: 'wordFilling', step: 6, maxScore: lesson.wordFilling.pictures.length },
    { id: 'rhymeMatching', step: 8, maxScore: lesson.rhymeMatching.pairs.length },
  ]
}

/** True while the open Activity has answers not yet checked; Home asks before leaving (TC-019). Not persisted. */
export const useUncheckedWork = create<{ unchecked: boolean }>(() => ({ unchecked: false }))

/** An Activity Step reports whether it has unchecked answers; cleared when it unmounts. */
export function useReportUncheckedWork(unchecked: boolean) {
  useEffect(() => {
    useUncheckedWork.setState({ unchecked })
    return () => useUncheckedWork.setState({ unchecked: false })
  }, [unchecked])
}
