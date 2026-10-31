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
  /** A press of ตรวจคำตอบ: counts the attempt and keeps the best score. */
  recordActivityCheck: (activityId: string, score: number, maxScore: number, answers: unknown) => void
  /** Leaving an Activity unchecked: skipped, score 0. Never overwrites a checked result. */
  skipActivity: (activityId: string, maxScore: number) => void
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
      recordActivityCheck: (activityId, score, maxScore, answers) =>
        set(({ session }) => {
          if (!session) return {}
          const old = session.activities[activityId]
          const result: ActivityResult = {
            status: 'completed',
            bestScore: Math.max(old?.bestScore ?? 0, score),
            maxScore,
            attemptCount: (old?.attemptCount ?? 0) + 1,
            answers,
          }
          return { session: { ...session, activities: { ...session.activities, [activityId]: result } } }
        }),
      skipActivity: (activityId, maxScore) =>
        set(({ session }) => {
          if (!session || session.activities[activityId]?.attemptCount) return {}
          const result: ActivityResult = { status: 'skipped', bestScore: 0, maxScore, attemptCount: 0, answers: null }
          return { session: { ...session, activities: { ...session.activities, [activityId]: result } } }
        }),
      resetSession: () => set({ session: null }),
    }),
    { name: 'thai-spelling:lesson-session', version: 1, partialize: ({ session }) => ({ session }) },
  ),
)
