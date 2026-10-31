import { beforeEach, describe, expect, it } from 'vitest'
import { useLessonSession } from './lessonSession'

const session = () => useLessonSession.getState().session
const { visitStep, resetSession, recordActivityCheck, skipActivity } = useLessonSession.getState()

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

  it('a check records the score and counts the attempt, keeping the best score', () => {
    visitStep('mae-kong', 6)
    recordActivityCheck('wordFilling', 4, 6, ['ลิง'])
    recordActivityCheck('wordFilling', 6, 6, ['ช้าง'])
    recordActivityCheck('wordFilling', 3, 6, ['รัง'])
    expect(session()?.activities.wordFilling).toEqual({
      status: 'completed',
      bestScore: 6,
      maxScore: 6,
      attemptCount: 3,
      answers: ['รัง'],
    })
  })

  it('skipping an unchecked Activity records it as skipped with score 0', () => {
    visitStep('mae-kong', 6)
    skipActivity('wordFilling', 6)
    expect(session()?.activities.wordFilling).toMatchObject({ status: 'skipped', bestScore: 0, maxScore: 6, attemptCount: 0 })
  })

  it('skipping never overwrites a checked result', () => {
    visitStep('mae-kong', 6)
    recordActivityCheck('wordFilling', 5, 6, [])
    skipActivity('wordFilling', 6)
    expect(session()?.activities.wordFilling).toMatchObject({ status: 'completed', bestScore: 5, attemptCount: 1 })
  })

  it('Activity results need a Session', () => {
    recordActivityCheck('wordFilling', 5, 6, [])
    skipActivity('wordFilling', 6)
    expect(session()).toBeNull()
  })
})
