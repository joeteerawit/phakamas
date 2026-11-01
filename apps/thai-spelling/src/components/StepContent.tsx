import type { ComponentType } from 'react'
import { activitySteps } from '../session/activities'
import { WordFillingStep } from './WordFillingStep'
import { WordSelectionStep } from './WordSelectionStep'
import { RhymeMatchingStep } from './RhymeMatchingStep'
import { RhymeStep } from './RhymeStep'
import { SummaryStep } from './SummaryStep'
import { SentenceStep } from './SentenceStep'
import { SpottingStep } from './SpottingStep'
import { VocabularyStep } from './VocabularyStep'
import { ListenRepeatStep } from './ListenRepeatStep'
import type { ActivityStepProps } from './stepProps'
import { CoverStep } from './CoverStep'

type StepContentProps = ActivityStepProps & { stepNumber: number }

/** Each Step's component, in Step order; Activity Steps are numbered in session/activities. */
const stepComponents: Record<number, ComponentType<ActivityStepProps>> = {
  1: CoverStep,
  2: VocabularyStep,
  3: ListenRepeatStep,
  4: SpottingStep,
  [activitySteps.wordSelection]: WordSelectionStep,
  [activitySteps.wordFilling]: WordFillingStep,
  7: RhymeStep,
  [activitySteps.rhymeMatching]: RhymeMatchingStep,
  9: SentenceStep,
  10: SummaryStep,
}

/** Content area for one Step. */
export function StepContent({ lesson, stepNumber, onFeedback }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  const Step = stepComponents[stepNumber]
  if (!step || !Step) return null
  return <Step lesson={lesson} onFeedback={onFeedback} />
}
