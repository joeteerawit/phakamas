import { Check, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Mascot } from '../Mascot'
import { cx } from './buttonClass'

export type Feedback = {
  kind: 'correct' | 'wrong'
  message: string
}

type FeedbackToastProps = {
  feedback: Feedback | null
  className?: string
}

/**
 * Mascot + message + ✓/✗ icon. The live region stays mounted so screen
 * readers announce each new message; right/wrong is never colour alone.
 */
export function FeedbackToast({ feedback, className }: FeedbackToastProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div role="status" aria-live="polite" className={cx('pointer-events-none', className)}>
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={`${feedback.kind}:${feedback.message}`}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 8, transition: { duration: 0.15 } }}
            transition={
              feedback.kind === 'correct'
                ? { type: 'spring', duration: 0.3, bounce: 0.45 }
                : { duration: 0.2, ease: 'easeOut' }
            }
            className={cx(
              'pointer-events-auto flex w-full max-w-md items-center gap-(--space-sm) rounded-clay border-[3px] bg-card p-(--space-sm) pe-(--space-md) shadow-clay',
              feedback.kind === 'correct' ? 'border-correct' : 'border-wrong',
            )}
          >
            <Mascot size="sm" decorative />
            <span
              aria-hidden="true"
              className={cx(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-on-primary',
                feedback.kind === 'correct' ? 'bg-correct' : 'bg-wrong',
              )}
            >
              {feedback.kind === 'correct' ? (
                <Check className="size-6" strokeWidth={3} />
              ) : (
                <X className="size-6" strokeWidth={3} />
              )}
            </span>
            <p
              className={cx(
                'min-w-0 font-heading text-heading font-bold',
                feedback.kind === 'correct' ? 'text-correct' : 'text-wrong',
              )}
            >
              <span className="sr-only">{feedback.kind === 'correct' ? 'ถูกต้อง: ' : 'ยังไม่ถูก: '}</span>
              {feedback.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
