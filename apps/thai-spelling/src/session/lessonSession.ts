import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { activitySteps, type ActivityId } from './activities'

/** One Activity's outcome in a Session (spec §4). Filled in by the Activity tickets. */
export type ActivityResult = {
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  bestScore: number
  maxScore: number
  attemptCount: number
  answers: unknown
  /** Saved by ถัดไป before a check (e.g. Step 8's pairs so far): finished, not scored, so at most 1 Star. */
  partial?: boolean
}

/** One student's run through a Lesson in this browser. */
export type LessonSession = {
  lessonId: string
  /** Last Step reached; the cover never overwrites it, so เรียนต่อ can resume here. */
  currentStep: number
  visitedSteps: number[]
  /** Steps finished: an Activity checked, or another Step left via ถัดไป. Optional: Sessions stored before it lack it. */
  completedSteps?: number[]
  startedAt: string
  /** Keyed by Activity id, e.g. `wordSelection`. */
  activities: Record<string, ActivityResult>
}

type LessonSessionStore = {
  session: LessonSession | null
  /** Background music preference (cover speaker); outlives the Session, so เริ่มใหม่ keeps it. */
  musicOn: boolean
  setMusicOn: (on: boolean) => void
  visitStep: (lessonId: string, step: number) => void
  /** A press of ตรวจคำตอบ: counts the attempt and keeps the best score. */
  recordActivityCheck: (activityId: ActivityId, score: number, maxScore: number, answers: unknown) => void
  /** ถัดไป with unchecked work: completed but `partial`. Never overwrites a checked result. */
  savePartialActivity: (activityId: ActivityId, score: number, maxScore: number, answers: unknown) => void
  /** Leaving an Activity unchecked: skipped, score 0. Never overwrites a checked result. */
  skipActivity: (activityId: ActivityId, maxScore: number) => void
  /** The student touched the Activity without checking it. Never overwrites a checked result. */
  markActivityInProgress: (activityId: ActivityId, maxScore: number) => void
  /** A non-Activity Step left via ถัดไป. */
  completeStep: (step: number) => void
  resetSession: () => void
}

const COVER_STEP = 1

const withCompletedStep = (session: LessonSession, step: number): LessonSession => {
  const done = session.completedSteps ?? []
  return done.includes(step) ? session : { ...session, completedSteps: [...done, step] }
}

export const useLessonSession = create<LessonSessionStore>()(
  persist(
    (set) => ({
      session: null,
      musicOn: true,
      setMusicOn: (musicOn) => set({ musicOn }),
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
            // A partial save's score was never checked, so it is not a best score to keep.
            bestScore: Math.max(old?.partial ? 0 : (old?.bestScore ?? 0), score),
            maxScore,
            attemptCount: (old?.attemptCount ?? 0) + 1,
            answers,
          }
          const next = { ...session, activities: { ...session.activities, [activityId]: result } }
          return { session: withCompletedStep(next, activitySteps[activityId]) }
        }),
      savePartialActivity: (activityId, score, maxScore, answers) =>
        set(({ session }) => {
          const old = session?.activities[activityId]
          if (!session || (old?.status === 'completed' && !old.partial)) return {}
          const result: ActivityResult = {
            status: 'completed',
            bestScore: Math.max(old?.bestScore ?? 0, score),
            maxScore,
            attemptCount: (old?.attemptCount ?? 0) + 1,
            answers,
            partial: true,
          }
          const next = { ...session, activities: { ...session.activities, [activityId]: result } }
          return { session: withCompletedStep(next, activitySteps[activityId]) }
        }),
      skipActivity: (activityId, maxScore) =>
        set(({ session }) => {
          if (!session || session.activities[activityId]?.attemptCount) return {}
          const result: ActivityResult = { status: 'skipped', bestScore: 0, maxScore, attemptCount: 0, answers: null }
          return { session: { ...session, activities: { ...session.activities, [activityId]: result } } }
        }),
      markActivityInProgress: (activityId, maxScore) =>
        set(({ session }) => {
          const status = session?.activities[activityId]?.status
          if (!session || status === 'completed' || status === 'in_progress') return {}
          const result: ActivityResult = { status: 'in_progress', bestScore: 0, maxScore, attemptCount: 0, answers: null }
          return { session: { ...session, activities: { ...session.activities, [activityId]: result } } }
        }),
      completeStep: (step) => set(({ session }) => (session ? { session: withCompletedStep(session, step) } : {})),
      resetSession: () => set({ session: null }),
    }),
    { name: 'thai-spelling:lesson-session', version: 1, partialize: ({ session, musicOn }) => ({ session, musicOn }) },
  ),
)
