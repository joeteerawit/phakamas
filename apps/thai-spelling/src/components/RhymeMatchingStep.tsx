import { Check, RotateCcw, Star, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playClip } from '../audio/audioManager'
import type { RhymeMatching } from '../lessons'
import { useClearFeedbackOnLeave } from '../activities/feedback'
import { lessonActivity, useReportUncheckedWork, useUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { cx } from './clay/buttonClass'
import { cardClass } from './clay/Card'
import type { Feedback } from './clay/FeedbackToast'
import type { ActivityStepProps } from './stepProps'
import { usePointerDrag } from './usePointerDrag'
import { useStageScale } from './stage/Stage'

const WRONG_FLASH_MS = 700
const TOAST_MS = 2500

type Side = 'left' | 'right'
type Point = { x: number; y: number }
type Pair = { left: string; right: string }

/** Right-hand words in random order, never sitting opposite their partner. */
function shuffleRights(pairs: RhymeMatching['pairs']) {
  const words = pairs.map((pair) => pair.right)
  if (words.length < 2) return words
  for (;;) {
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j]!, words[i]!]
    }
    if (words.every((word, i) => word !== pairs[i]!.right)) return words
  }
}

/** Step 8: link each left word to its rhyme by tap-tap (primary, keyboard too) or by dragging a line. */
export function RhymeMatchingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { pairs, sounds } = lesson.rhymeMatching
  const activity = lessonActivity(lesson, 'rhymeMatching')
  const [rights, setRights] = useState(() => shuffleRights(pairs))
  const [matched, setMatched] = useState<ReadonlySet<string>>(() => new Set())
  const [selected, setSelected] = useState<{ side: Side; word: string } | null>(null)
  const [wrong, setWrong] = useState<Pair | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)

  const done = matched.size === pairs.length
  const lockedPairs = pairs.filter((pair) => matched.has(pair.left))
  // An Activity started but not finished; Home asks before throwing it away.
  const started = !done && (matched.size > 0 || mistakes > 0)
  useReportUncheckedWork(activity, started)
  // ถัดไป before finishing records the pairs matched so far (spec: ถัดไป บันทึกผล); untouched stays skipped.
  useEffect(() => {
    if (!started) return
    useUncheckedWork.setState({ partial: { score: matched.size, answers: { mistakes } } })
    return () => useUncheckedWork.setState({ partial: null })
  }, [started, matched.size, mistakes])
  const isLocked = (side: Side, word: string) => lockedPairs.some((pair) => pair[side] === word)

  // The toast (shown by StepLayout) hides after a moment so it never keeps covering the board or the stars.
  useEffect(() => {
    onFeedback(feedback)
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [feedback, onFeedback])

  // A wrong pair flashes briefly; each new wrong pair restarts the flash.
  useEffect(() => {
    if (!wrong) return
    const timer = setTimeout(() => setWrong(null), WRONG_FLASH_MS)
    return () => clearTimeout(timer)
  }, [wrong])
  useClearFeedbackOnLeave(onFeedback)

  const attempt = (left: string, right: string) => {
    setSelected(null)
    if (!pairs.some((pair) => pair.left === left && pair.right === right)) {
      setMistakes((count) => count + 1)
      setWrong({ left, right })
      setFeedback({ kind: 'wrong', message: `${left} กับ ${right} ยังไม่ถูก ลองใหม่นะ` })
      return
    }
    const next = new Set(matched).add(left)
    setMatched(next)
    if (next.size < pairs.length) {
      playClip(sounds.correct)
      setFeedback({ kind: 'correct', message: `${left} คล้องจองกับ ${right}` })
      return
    }
    recordActivityCheck(activity.id, pairs.length, activity.maxScore, { mistakes })
    playClip(sounds.completed)
    setFeedback({ kind: 'correct', message: 'เก่งมาก! จับคู่ถูกครบแล้ว' })
  }

  const pick = (side: Side, word: string) => {
    if (!selected || selected.side === side) {
      setSelected(selected?.word === word ? null : { side, word })
      return
    }
    if (side === 'left') attempt(word, selected.word)
    else attempt(selected.word, word)
  }

  const restart = () => {
    setRights(shuffleRights(pairs))
    setMatched(new Set())
    setSelected(null)
    setWrong(null)
    setMistakes(0)
    setFeedback(null)
  }

  // Line anchors: each left word's right edge, each right word's left edge, relative to the board.
  const scale = useStageScale()
  const board = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLElement>())
  const [anchors, setAnchors] = useState<ReadonlyMap<string, Point>>(() => new Map())
  useLayoutEffect(() => {
    const element = board.current
    if (!element) return
    const measure = () => {
      const origin = element.getBoundingClientRect()
      const next = new Map<string, Point>()
      for (const [word, node] of nodes.current) {
        const rect = node.getBoundingClientRect()
        const isLeft = pairs.some((pair) => pair.left === word)
        next.set(word, {
          x: ((isLeft ? rect.right : rect.left) - origin.left) / scale,
          y: (rect.top + rect.height / 2 - origin.top) / scale,
        })
      }
      setAnchors(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [rights, pairs, scale])

  // Drag a line from a left word; dropping on a right word tries the pair. A short press stays a tap.
  const drag = usePointerDrag((word, x, y) => {
    const target = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-rhyme-right]')
    const right = target?.dataset.rhymeRight
    if (right && !isLocked('right', right)) attempt(word, right)
  }, () => board.current)
  const dragEnd = drag.dragging && { word: drag.dragging.id, point: { x: drag.dragging.x, y: drag.dragging.y } }
  const dragHandlers = (word: string) => ({ ...drag.handlers(word), onClick: drag.click(() => pick('left', word)) })

  const reduceMotion = useReducedMotion()
  const line = (from: Point | undefined, to: Point | undefined, className: string, key: string) =>
    from &&
    to && (
      <motion.line
        key={key}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        strokeWidth={6}
        strokeLinecap="round"
        className={className}
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    )

  const wordButton = (side: Side, word: string) => {
    const locked = isLocked(side, word)
    const flashing = wrong?.[side] === word
    const props = side === 'left' && !locked ? dragHandlers(word) : { onClick: () => pick(side, word) }
    return (
      <li key={word}>
        <button
          type="button"
          ref={(node) => {
            if (node) nodes.current.set(word, node)
            else nodes.current.delete(word)
          }}
          data-rhyme-right={side === 'right' ? word : undefined}
          disabled={locked}
          aria-pressed={locked ? undefined : selected?.side === side && selected.word === word}
          {...props}
          className={cx(
            cardClass({ tone: locked ? 'mint' : 'white', selected: selected?.word === word }),
            'relative flex min-h-16 w-28 cursor-pointer select-none items-center justify-center gap-(--space-xs) p-(--space-xs) sm:w-40',
            'transition-[transform,box-shadow,border-color] duration-150 ease-out active:translate-y-1 active:shadow-clay-pressed motion-reduce:transition-none',
            'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:active:translate-y-0',
            side === 'left' && !locked && 'touch-none',
            locked && 'border-correct',
            flashing && 'border-wrong',
          )}
        >
          <span className="font-heading text-vocab font-bold">{word}</span>
          {locked && (
            <>
              <Check aria-hidden="true" className="size-6 shrink-0 text-correct" strokeWidth={3} />
              <span className="sr-only">จับคู่แล้ว</span>
            </>
          )}
          {flashing && (
            <>
              <X aria-hidden="true" className="size-6 shrink-0 text-wrong" strokeWidth={3} />
              <span className="sr-only">ไม่ใช่คู่กัน</span>
            </>
          )}
        </button>
      </li>
    )
  }

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-lg)">
      <p className="max-w-md text-center text-body-lg">แตะคำทางซ้าย แล้วแตะคำที่คล้องจองกันทางขวา หรือลากเส้นเชื่อมก็ได้</p>

      <div ref={board} className="relative flex w-full max-w-xl justify-between">
        <svg data-testid="match-lines" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {lockedPairs.map((pair) => line(anchors.get(pair.left), anchors.get(pair.right), 'stroke-correct', pair.left))}
          {wrong && line(anchors.get(wrong.left), anchors.get(wrong.right), 'stroke-wrong [stroke-dasharray:10_8]', 'wrong')}
          {dragEnd && line(anchors.get(dragEnd.word), dragEnd.point, 'stroke-highlight', 'drag')}
        </svg>
        <ul role="group" aria-label="คำฝั่งซ้าย" className="flex flex-col gap-(--space-md)">
          {pairs.map((pair) => wordButton('left', pair.left))}
        </ul>
        <ul role="group" aria-label="คำฝั่งขวา" className="flex flex-col gap-(--space-md)">
          {rights.map((word) => wordButton('right', word))}
        </ul>
      </div>

      {done && <CompletedCard score={pairs.length} />}

      <Button variant="ghost" onClick={restart}>
        <RotateCcw aria-hidden="true" className="size-6" strokeWidth={2.5} />
        เริ่มใหม่
      </Button>

    </section>
  )
}

/** Star burst + score once every pair is matched. */
function CompletedCard({ score }: { score: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={cx(cardClass({ tone: 'yellow' }), 'flex flex-col items-center gap-(--space-xs) text-center')}
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.3, bounce: 0.45 }}
    >
      <div role="img" aria-label={`ได้ ${score} ดาว`} className="flex gap-(--space-xs)">
        {Array.from({ length: score }, (_, i) => (
          <Star key={i} aria-hidden="true" className="size-12 fill-accent text-accent" strokeWidth={2} />
        ))}
      </div>
      <p className="font-heading text-heading font-bold">เก่งมาก! จับคู่ถูกครบ</p>
      <p className="font-semibold">ได้ {score} คะแนน</p>
    </motion.div>
  )
}
