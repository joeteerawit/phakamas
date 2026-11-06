import type { ActivityStepProps } from '../steps/stepProps'
import { stepLayout, type Theme } from './index'

type StepContentProps = ActivityStepProps & { theme: Theme; stepNumber: number }

/** Content area for one Step, laid out by the Lesson's Theme. */
export function StepContent({ lesson, theme, stepNumber, onFeedback }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  const Step = stepLayout(theme, stepNumber)
  if (!step || !Step) return null
  // oxlint-disable-next-line react/static-components -- stepLayout returns a module-level component, not a new one.
  return <Step lesson={lesson} onFeedback={onFeedback} />
}
