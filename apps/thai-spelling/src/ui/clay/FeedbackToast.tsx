import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Fragment } from 'react'
import { useKit } from '../kit'
import { cx } from './buttonClass'

export type Feedback = {
  kind: 'correct' | 'wrong'
  message: string
  /** Phrases in `message`, such as a button name, that must not break across lines. */
  keepTogether?: readonly string[]
}

type FeedbackToastProps = {
  feedback: Feedback | null
  /** Widest the toast may grow, in stage px; longer messages wrap. */
  maxWidth: number
  /**
   * `bottom` rises into place; `top` only pops in its own box, so on the way in it never crosses what
   * lies under it.
   */
  placement: 'top' | 'bottom'
  className?: string
}

/**
 * The Kit's feedback bubble: Mascot + message + ✓/✗ icon. The live region stays mounted so screen
 * readers announce each new message; right/wrong is never colour alone.
 * It sits on the scaled stage, so it is sized in stage px: 46px type is 16.6 CSS px on a 390px-tall phone.
 */
export function FeedbackToast({ feedback, maxWidth, placement, className }: FeedbackToastProps) {
  const reduceMotion = useReducedMotion()
  const { feedback: bubble } = useKit()
  const rise = placement === 'bottom'

  return (
    <>
      {/* One grid cell: a leaving toast and its replacement overlap in place instead of pushing each other aside. */}
      <div
        role="status"
        aria-live="polite"
        className={cx('pointer-events-none grid justify-items-center', rise ? 'items-end' : 'items-start', className)}
      >
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={`${feedback.kind}:${feedback.message}`}
              initial={reduceMotion ? false : { opacity: 0, y: rise ? 32 : 0, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, y: rise ? 16 : 0, transition: { duration: 0.15 } }
              }
              transition={
                feedback.kind === 'correct'
                  ? { type: 'spring', duration: 0.3, bounce: rise ? 0.45 : 0 }
                  : { duration: 0.2, ease: 'easeOut' }
              }
              style={{ maxWidth }}
              className={cx('col-start-1 row-start-1', bubble.className(feedback.kind))}
            >
              <bubble.Content
                feedback={feedback}
                text={
                  <>
                    <span className="sr-only">{feedback.kind === 'correct' ? 'ถูกต้อง: ' : 'ยังไม่ถูก: '}</span>
                    <Message text={feedback.message} keepTogether={feedback.keepTogether} />
                  </>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {bubble.Aside && <AnimatePresence>{feedback && <bubble.Aside key={feedback.kind} feedback={feedback} placement={placement} />}</AnimatePresence>}
    </>
  )
}

/** The message text, with each `keepTogether` phrase in a no-wrap span; the text itself is unchanged. */
function Message({ text, keepTogether = [] }: { text: string; keepTogether?: readonly string[] }) {
  const phrases = keepTogether.filter(Boolean)
  if (phrases.length === 0) return text
  const escaped = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`))
  return parts.map((part, i) =>
    phrases.includes(part) ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
