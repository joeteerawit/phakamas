import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Feedback } from '../ui/clay/FeedbackToast'
import { getTheme, stepScene } from '../themes'
import { StepContent } from '../themes/StepContent'
import { KitContext } from '../ui/kit'
import { MascotContext } from '../ui/mascotContext'
import { StepLayout } from '../ui/StepLayout'
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
  const theme = getTheme(lesson.theme)
  return (
    <MascotContext.Provider value={theme.mascot}>
      <KitContext.Provider value={theme.kit}>
        <StepLayout lesson={lesson} stepNumber={stepNumber} feedback={feedback} scene={stepScene(theme, stepNumber)}>
          <StepContent lesson={lesson} theme={theme} stepNumber={stepNumber} onFeedback={setFeedback} />
        </StepLayout>
      </KitContext.Provider>
    </MascotContext.Provider>
  )
}
