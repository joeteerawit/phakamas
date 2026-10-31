import { useNavigate } from '@tanstack/react-router'
import { useLessonSession } from '../session/lessonSession'

/** Clears the Session and starts the Lesson again from Step 2. */
export function useRestartLesson(lessonId: string) {
  const navigate = useNavigate()
  const resetSession = useLessonSession((state) => state.resetSession)
  return () => {
    resetSession()
    void navigate({ to: '/lesson/$lessonId/$step', params: { lessonId, step: '2' } })
  }
}
