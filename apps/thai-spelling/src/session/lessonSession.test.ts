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

  it('checking an Activity counts attempts and keeps the best score', () => {
    visitStep('mae-kong', 5)
    recordActivityCheck('wordSelection', 5, 7, ['ลิง'])
    recordActivityCheck('wordSelection', 7, 7, ['ลิง', 'ช้าง'])
    recordActivityCheck('wordSelection', 3, 7, [])
    expect(session()?.activities.wordSelection).toEqual({
      status: 'completed',
      bestScore: 7,
      maxScore: 7,
      attemptCount: 3,
      answers: [],
    })
  })

  it('leaving an Activity unchecked marks it skipped with score 0', () => {
    visitStep('mae-kong', 5)
    skipActivity('wordSelection', 7)
    expect(session()?.activities.wordSelection).toEqual({
      status: 'skipped',
      bestScore: 0,
      maxScore: 7,
      attemptCount: 0,
      answers: null,
    })
  })

  it('skipping after a check keeps the checked result', () => {
    visitStep('mae-kong', 5)
    recordActivityCheck('wordSelection', 6, 7, ['ลิง'])
    skipActivity('wordSelection', 7)
    expect(session()?.activities.wordSelection).toMatchObject({ status: 'completed', bestScore: 6, attemptCount: 1 })
  })

  it('a check after skipping replaces the skip', () => {
    visitStep('mae-kong', 5)
    skipActivity('wordSelection', 7)
    recordActivityCheck('wordSelection', 4, 7, ['นก'])
    expect(session()?.activities.wordSelection).toMatchObject({ status: 'completed', bestScore: 4, attemptCount: 1 })
  })

  it('Activity results without a Session are ignored', () => {
    recordActivityCheck('wordSelection', 7, 7, [])
    skipActivity('wordSelection', 7)
    expect(session()).toBeNull()
  })

  it('persists the Session to localStorage', () => {
    visitStep('mae-kong', 3)
    const stored = JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')
    expect(stored.state.session).toMatchObject({ lessonId: 'mae-kong', currentStep: 3, visitedSteps: [3] })
  })
})
