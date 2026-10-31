import type { Lesson } from '../lessons'
import type { Feedback } from './clay/FeedbackToast'

/** Props of every Activity Step; it reports feedback for the layout's toast. */
export type ActivityStepProps = {
  lesson: Lesson
  title: string
  onFeedback: (feedback: Feedback | null) => void
}

/** Steps without an Activity take the same props minus feedback. */
export type StepProps = Omit<ActivityStepProps, 'onFeedback'>
