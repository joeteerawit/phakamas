import { createFileRoute, redirect } from '@tanstack/react-router'
import { StepContent } from '../components/StepContent'
import { StepLayout } from '../components/StepLayout'
import { DEFAULT_LESSON_ID, getLesson, parseStepNumber } from '../lessons'

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
  return (
    <StepLayout lesson={lesson} stepNumber={stepNumber}>
      <StepContent lesson={lesson} stepNumber={stepNumber} />
    </StepLayout>
  )
}
