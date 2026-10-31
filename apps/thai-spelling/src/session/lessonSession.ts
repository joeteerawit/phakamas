import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** One Activity's outcome in a Session (spec §4). Filled in by the Activity tickets. */
export type ActivityResult = {
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  bestScore: number
  maxScore: number
  attemptCount: number
  answers: unknown
}

/** One student's run through a Lesson in this browser. */
export type LessonSession = {
  lessonId: string
  /** Last Step reached; the cover never overwrites it, so เรียนต่อ can resume here. */
  currentStep: number
  visitedSteps: number[]
  startedAt: string
  /** Keyed by Activity id, e.g. `wordSelection`. */
  activities: Record<string, ActivityResult>
}

type LessonSessionStore = {
  session: LessonSession | null
  visitStep: (lessonId: string, step: number) => void
  resetSession: () => void
}

const COVER_STEP = 1

export const useLessonSession = create<LessonSessionStore>()(
  persist(
    (set) => ({
      session: null,
      visitStep: (lessonId, step) =>
        set(({ session }) => {
          const current =
            session?.lessonId === lessonId
              ? session
              : { lessonId, currentStep: step, visitedSteps: [], startedAt: new Date().toISOString(), activities: {} }
          return {
            session: {
              ...current,
              currentStep: step === COVER_STEP ? current.currentStep : step,
              visitedSteps: current.visitedSteps.includes(step) ? current.visitedSteps : [...current.visitedSteps, step],
            },
          }
        }),
      resetSession: () => set({ session: null }),
    }),
    { name: 'thai-spelling:lesson-session', version: 1, partialize: ({ session }) => ({ session }) },
  ),
)
