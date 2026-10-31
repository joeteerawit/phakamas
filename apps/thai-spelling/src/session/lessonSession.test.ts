import { beforeEach, describe, expect, it } from 'vitest'
import { useLessonSession } from './lessonSession'

const session = () => useLessonSession.getState().session
const { visitStep, resetSession, recordActivity, skipActivity } = useLessonSession.getState()
const activity = (id: string) => session()?.activities[id]

beforeEach(() => {
  resetSession()
})

describe('Lesson Session store', () => {
  it('has no Session until a Step is visited', () => {
    expect(session()).toBeNull()
  })

  it('visiting a Step starts a Session at that Step', () => {
    visitStep('mae-kong', 2)
    expect(session()).toMatchObject({ lessonId: 'mae-kong', currentStep: 2, visitedSteps: [2], activities: {} })
  })

  it('records each visited Step once, in visit order, and tracks the current Step', () => {
    visitStep('mae-kong', 2)
    visitStep('mae-kong', 3)
    visitStep('mae-kong', 2)
    visitStep('mae-kong', 4)
    expect(session()).toMatchObject({ currentStep: 4, visitedSteps: [2, 3, 4] })
  })

  it('returning to the cover keeps the last Step so the student can resume', () => {
    visitStep('mae-kong', 5)
    visitStep('mae-kong', 1)
    expect(session()).toMatchObject({ currentStep: 5, visitedSteps: [5, 1] })
  })

  it('a different Lesson replaces the Session (one Session per browser)', () => {
    visitStep('mae-kong', 5)
    visitStep('mae-kok', 2)
    expect(session()).toMatchObject({ lessonId: 'mae-kok', currentStep: 2, visitedSteps: [2] })
  })

  it('resetSession clears the Session', () => {
    visitStep('mae-kong', 5)
    resetSession()
    expect(session()).toBeNull()
  })

  it('persists the Session to localStorage', () => {
    visitStep('mae-kong', 3)
    const stored = JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')
    expect(stored.state.session).toMatchObject({ lessonId: 'mae-kong', currentStep: 3, visitedSteps: [3] })
  })

  it('recording a checked result completes the Activity, keeps the best score and counts attempts', () => {
    visitStep('mae-kong', 8)
    recordActivity('rhymeMatching', { score: 3, maxScore: 3, answers: { mistakes: 2 } })
    recordActivity('rhymeMatching', { score: 1, maxScore: 3, answers: { mistakes: 0 } })
    expect(activity('rhymeMatching')).toEqual({
      status: 'completed',
      bestScore: 3,
      maxScore: 3,
      attemptCount: 2,
      answers: { mistakes: 0 },
    })
  })

  it('skipping an untouched Activity stores skipped with score 0', () => {
    visitStep('mae-kong', 8)
    skipActivity('rhymeMatching', 3)
    expect(activity('rhymeMatching')).toEqual({ status: 'skipped', bestScore: 0, maxScore: 3, attemptCount: 0, answers: null })
  })

  it('skipping never erases a completed result', () => {
    visitStep('mae-kong', 8)
    recordActivity('rhymeMatching', { score: 3, maxScore: 3, answers: { mistakes: 1 } })
    skipActivity('rhymeMatching', 3)
    expect(activity('rhymeMatching')).toMatchObject({ status: 'completed', bestScore: 3, attemptCount: 1 })
  })

  it('a skipped Activity can still be completed later', () => {
    visitStep('mae-kong', 8)
    skipActivity('rhymeMatching', 3)
    recordActivity('rhymeMatching', { score: 3, maxScore: 3, answers: { mistakes: 0 } })
    expect(activity('rhymeMatching')).toMatchObject({ status: 'completed', bestScore: 3, attemptCount: 1 })
  })
})
