import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Feedback } from '../components/clay/FeedbackToast'
import { StepContent } from '../components/StepContent'
import { StepLayout } from '../components/StepLayout'
import type { Scene } from '../components/stage/Stage'
import { DEFAULT_LESSON_ID, getLesson, parseStepNumber } from '../lessons'
import { useLessonSession } from '../session/lessonSession'

/** Stage background per Step; unlisted Steps use the garden. */
const stepScenes: Partial<Record<number, Scene>> = { 1: 'cover', 3: 'pond', 4: 'pond', 5: 'step5', 7: 'pond', 8: 'pond', 10: 'summary' }

export const Route = createFileRoute('/lesson/$lessonId/$step')({
  beforeLoad: ({ params }) => {
    const lesson = getLesson(params.lessonId)
    const stepNumber = lesson ? parseStepNumber(lesson, params.step) : undefined
    if (!lesson || stepNumber === undefined) {
      throw redirect({
        to: '/lesson/$lessonId/$step',
        params: { lessonId: DEFAULT_LESSON_ID, step: '1' },
        replace: true,
      })
    }
    return { lesson, stepNumber }
  },
  component: StepPage,
})

function StepPage() {
  const { lesson, stepNumber } = Route.useRouteContext()
  const visitStep = useLessonSession((state) => state.visitStep)
  useEffect(() => visitStep(lesson.id, stepNumber), [visitStep, lesson.id, stepNumber])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  return (
    <StepLayout lesson={lesson} stepNumber={stepNumber} feedback={feedback} scene={stepScenes[stepNumber]}>
      <StepContent lesson={lesson} stepNumber={stepNumber} onFeedback={setFeedback} />
    </StepLayout>
  )
}
