import type { ComponentType } from 'react'
import { activitySteps } from '../session/activities'
import { WordFillingStep } from './mae-kong/steps/WordFillingStep'
import { WordSelectionStep } from './mae-kong/steps/WordSelectionStep'
import { RhymeMatchingStep } from './mae-kong/steps/RhymeMatchingStep'
import { RhymeStep } from './mae-kong/steps/RhymeStep'
import { SummaryStep } from './mae-kong/steps/SummaryStep'
import { SentenceStep } from './mae-kong/steps/SentenceStep'
import { SpottingStep } from './mae-kong/steps/SpottingStep'
import { VocabularyStep } from './mae-kong/steps/VocabularyStep'
import { ListenRepeatStep } from './mae-kong/steps/ListenRepeatStep'
import type { ActivityStepProps } from '../steps/stepProps'
import { CoverStep } from './mae-kong/steps/CoverStep'

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
