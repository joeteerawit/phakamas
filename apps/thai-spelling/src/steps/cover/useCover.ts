import { playClip } from '../../audio/audioManager'
import type { Lesson } from '../../lessons'
import { useLessonSession } from '../../session/lessonSession'
import { useRestartLesson } from '../../session/useRestartLesson'

/**
 * Step 1's behaviour, shared by every Theme's cover: where ▶ goes (the Session's Step, or Step 2), the
 * music choice, and starting again.
 */
export function useCover(lesson: Lesson) {
  const restart = useRestartLesson(lesson.id)
  const resumeStep = useLessonSession(({ session }) =>
    session?.lessonId === lesson.id && session.currentStep > 1 ? session.currentStep : null,
  )
  const musicOn = useLessonSession((state) => state.musicOn)
  return {
    lessonId: lesson.id,
    resumeStep,
    musicOn,
    restart,
    // The cover speaker is the music toggle, so the teacher intro plays on the Session's first ▶ instead.
    start: resumeStep ? undefined : () => playClip(lesson.intro),
  }
}

export type Cover = ReturnType<typeof useCover>
