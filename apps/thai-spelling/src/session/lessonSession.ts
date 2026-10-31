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
  /** ตรวจคำตอบ: one more attempt; keeps the best score and the latest answers. */
  recordActivityCheck: (activityId: string, score: number, maxScore: number, answers: unknown) => void
  /** Next without checking: `skipped` with score 0, unless the Activity was already checked. */
  skipActivity: (activityId: string, maxScore: number) => void
}

const COVER_STEP = 1

/** Replaces one Activity's result; without a Session there is nothing to record. */
const updateActivity =
  (activityId: string, update: (old: ActivityResult | undefined) => ActivityResult) =>
  ({ session }: LessonSessionStore) =>
    session
      ? { session: { ...session, activities: { ...session.activities, [activityId]: update(session.activities[activityId]) } } }
      : {}

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
      recordActivityCheck: (activityId, score, maxScore, answers) =>
        set(
          updateActivity(activityId, (old) => ({
            status: 'completed',
            bestScore: Math.max(score, old?.bestScore ?? 0),
            maxScore,
            attemptCount: (old?.attemptCount ?? 0) + 1,
            answers,
          })),
        ),
      skipActivity: (activityId, maxScore) =>
        set(
          updateActivity(activityId, (old) =>
            old?.attemptCount ? old : { status: 'skipped', bestScore: 0, maxScore, attemptCount: 0, answers: null },
          ),
        ),
    }),
    { name: 'thai-spelling:lesson-session', version: 1, partialize: ({ session }) => ({ session }) },
  ),
)
