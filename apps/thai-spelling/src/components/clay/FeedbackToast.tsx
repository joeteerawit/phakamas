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
  /** Widest the toast may grow, in stage px; longer messages wrap. */
  maxWidth: number
  className?: string
}

/**
 * Mascot + message + ✓/✗ icon. The live region stays mounted so screen
 * readers announce each new message; right/wrong is never colour alone.
 * It sits on the scaled stage, so it is sized in stage px: 46px type is 16.6 CSS px on a 390px-tall phone.
 */
export function FeedbackToast({ feedback, maxWidth, className }: FeedbackToastProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div role="status" aria-live="polite" className={cx('pointer-events-none', className)}>
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={`${feedback.kind}:${feedback.message}`}
            initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 16, transition: { duration: 0.15 } }}
            transition={
              feedback.kind === 'correct'
                ? { type: 'spring', duration: 0.3, bounce: 0.45 }
                : { duration: 0.2, ease: 'easeOut' }
            }
            style={{ maxWidth }}
            className={cx(
              // Ink outline and hard shadow; an inner ring in the result colour.
              'flex items-center gap-[10px] rounded-[32px] border-[5px] border-comic-ink bg-cream py-[10px] ps-[12px] pe-[20px] shadow-comic ring-[5px] ring-inset',
              feedback.kind === 'correct' ? 'ring-correct' : 'ring-wrong',
            )}
          >
            {/* The 256px Mascot drawn at 80 stage px: 29 CSS px on a 390px-tall phone, 80 on a 1080p screen. */}
            <Mascot size="sm" decorative className="size-[80px]! shrink-0" />
            <span
              aria-hidden="true"
              className={cx(
                'flex size-[56px] shrink-0 items-center justify-center rounded-full border-4 border-comic-ink text-on-primary',
                feedback.kind === 'correct' ? 'bg-correct' : 'bg-wrong',
              )}
            >
              {feedback.kind === 'correct' ? (
                <Check className="size-[34px]" strokeWidth={3.5} />
              ) : (
                <X className="size-[34px]" strokeWidth={3.5} />
              )}
            </span>
            <p
              className={cx(
                'min-w-0 font-heading text-[46px] leading-[1.35] font-bold text-balance',
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
