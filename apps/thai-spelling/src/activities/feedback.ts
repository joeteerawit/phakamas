import { useEffect } from 'react'
import type { Feedback } from '../components/clay/FeedbackToast'

/** The ตรวจคำตอบ toast: full marks earn praise, otherwise the score plus `retryHint`. */
export function scoreFeedback(score: number, maxScore: number, retryHint: string): Feedback {
  const scoreText = `ได้ ${score}/${maxScore} คะแนน`
  return score === maxScore
    ? { kind: 'correct', message: `เก่งมาก! ${scoreText}` }
    : { kind: 'wrong', message: `${scoreText} ${retryHint}` }
}

/** Clears the layout's toast when the Activity Step unmounts. */
export function useClearFeedbackOnLeave(onFeedback: (feedback: Feedback | null) => void) {
  useEffect(() => () => onFeedback(null), [onFeedback])
}
