import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Feedback } from '../components/clay/FeedbackToast'
import { StepContent } from '../components/StepContent'
import { StepLayout } from '../components/StepLayout'
import { DEFAULT_LESSON_ID, getLesson, parseStepNumber } from '../lessons'
import { useLessonSession } from '../session/lessonSession'

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
    <StepLayout
      lesson={lesson}
      stepNumber={stepNumber}
      feedback={feedback}
      scene={stepNumber === 7 ? 'pond' : undefined}
      fullStage={stepNumber === 7}
    >
      <StepContent lesson={lesson} stepNumber={stepNumber} onFeedback={setFeedback} />
    </StepLayout>
  )
}
