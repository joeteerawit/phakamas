import { Check, ClipboardCheck, Pointer, ShoppingBasket, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { playClip } from '../../../audio/audioManager'
import type { WordChoice } from '../../../lessons'
import { lessonActivity, useReportUncheckedWork } from '../../../session/activities'
import { useLessonSession } from '../../../session/lessonSession'
import { scoreFeedback, useClearFeedbackOnLeave } from '../../../steps/feedback'
import type { ActivityStepProps } from '../../../steps/stepProps'
import { checkWordSelection } from '../../../steps/word-selection/wordSelection'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { celebrate } from '../../../ui/Stars'
import { ink } from '../kit/ink'

// Stage pixels. Two vendor boats moored one above the other, six goods on each (cards 196 wide, 214 apart, 325–1595),
// clear of the lotus pads down the window's sides; the action planks (300–656, 1260–1616) sit either side of the
// bottom-centre feedback toast (670–1250).
const GOODS = { left: 325, step: 214, width: 196, height: 232 }
const BOATS = [{ top: 236 }, { top: 560 }]

type Result = 'right' | 'wrong' | 'missed'
const resultText: Record<Result, string> = { right: 'ถูกต้อง', wrong: 'เลือกผิด', missed: 'ลืมเลือก' }

/**
 * แม่กน Step 5, fill the shopping basket (docs/mae-kon-spec.md): two vendor boats moored still on the quiet canal, one
 * above the other, each carrying six goods (picture and word) on bamboo trays. Tapping a good plays its word and ties a
 * banana-leaf tag on it, meaning "into my basket"; tapping again takes it out. ตรวจคำตอบ checks all twelve, one good
 * one Decision, out of 12 with the shared Activity scoring and Stars, and rings each good right, wrong (red) or
 * missed; ล้างตะกร้า empties the basket. Nothing moves across the goods.
 */
export function WordSelectionStep({ lesson, onFeedback }: ActivityStepProps) {
  const { question, instruction, choices } = lesson.wordSelection
  const activity = lessonActivity(lesson, 'wordSelection')
  const { Button } = useKit()
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  // Results of the last check; changing a good clears its result. `round` replays the result marks.
  const [results, setResults] = useState<ReadonlyMap<string, Result>>(() => new Map())
  const [round, setRound] = useState(0)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  const [unchecked, setUnchecked] = useState(false)
  useReportUncheckedWork(activity, unchecked)
  useClearFeedbackOnLeave(onFeedback)

  const toggle = (choice: WordChoice) => {
    playClip(choice.audio)
    setSelected((old) => {
      const next = new Set(old)
      if (!next.delete(choice.word)) next.add(choice.word)
      return next
    })
    setResults((old) => {
      const next = new Map(old)
      next.delete(choice.word)
      return next
    })
    setUnchecked(true)
    onFeedback(null)
  }

  const check = () => {
    const result = checkWordSelection(choices, selected)
    const wrong = new Set(result.wrong)
    const next = new Map<string, Result>()
    for (const { word } of choices) {
      if (wrong.has(word)) next.set(word, selected.has(word) ? 'wrong' : 'missed')
      else if (selected.has(word)) next.set(word, 'right')
    }
    setResults(next)
    setRound((r) => r + 1)
    setUnchecked(false)
    recordActivityCheck(activity.id, result.score, activity.maxScore, [...selected])
    onFeedback(scoreFeedback(result.score, activity.maxScore, 'ลองใหม่นะ'))
    celebrate(activity.id, result.score === activity.maxScore)
  }

  const empty = () => {
    setSelected(new Set())
    setResults(new Map())
    setUnchecked(false)
    onFeedback(null)
  }

  return (
    <section data-full-stage aria-label={question} className="relative size-full">
      <p className="bamboo-label absolute top-[150px] left-1/2 flex h-[72px] -translate-x-1/2 items-center px-[30px] font-heading text-[36px] font-bold whitespace-nowrap text-kon-ink">
        ใส่ตะกร้า! {instruction}
      </p>

      {/* The two moored boats under their goods. */}
      <svg aria-hidden="true" data-testid="fruit-boats" viewBox="0 0 1920 1080" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        {BOATS.map(({ top }) => (
          <g key={top}>
            <path d={`M306 ${top + 70} V${top + 300}`} stroke="var(--color-teak-deep)" strokeWidth={14} strokeLinecap="round" />
            <path d={`M290 ${top + 196} Q960 ${top + 236} 1630 ${top + 196} L1580 ${top + 290} Q960 ${top + 316} 340 ${top + 290} Z`} fill="var(--color-teak)" {...ink} />
            <path d={`M320 ${top + 226} Q960 ${top + 262} 1600 ${top + 226}`} fill="none" stroke="var(--color-teak-deep)" strokeWidth={5} />
          </g>
        ))}
      </svg>

      <ul>
        {choices.map((choice, i) => (
          <li key={choice.word}>
            <Good
              choice={choice}
              left={GOODS.left + (i % 6) * GOODS.step}
              top={BOATS[Math.floor(i / 6)]!.top}
              selected={selected.has(choice.word)}
              result={results.get(choice.word)}
              round={round}
              onToggle={() => toggle(choice)}
            />
          </li>
        ))}
      </ul>

      {/* Left and right of centre, so the feedback toast (bottom centre) never hides them. */}
      <Button onClick={check} className={cx(action, 'left-[300px]')}>
        <ClipboardCheck aria-hidden="true" className="relative size-14 shrink-0" strokeWidth={2.5} />
        <span className="relative">ตรวจคำตอบ</span>
      </Button>
      <Button onClick={empty} className={cx(action, 'left-[1260px]')}>
        <ShoppingBasket aria-hidden="true" className="relative size-14 shrink-0" strokeWidth={2.5} />
        <span className="relative">ล้างตะกร้า</span>
      </Button>
    </section>
  )
}

const action = 'absolute top-[896px] flex h-[124px] w-[356px] items-center justify-center gap-[10px] px-[30px] font-heading text-[40px] font-bold whitespace-nowrap'

type GoodProps = {
  choice: WordChoice
  left: number
  top: number
  selected: boolean
  result: Result | undefined
  round: number
  onToggle: () => void
}

/** One good on its boat's tray; in the basket it wears a banana-leaf tag. A check rings it in place. */
function Good({ choice, left, top, selected, result, round, onToggle }: GoodProps) {
  const { card } = useKit()
  const reduceMotion = useReducedMotion()
  const BadgeIcon = { right: Check, wrong: X, missed: Pointer }[result ?? 'right']

  return (
    <button
      type="button"
      aria-pressed={selected}
      data-result={result}
      onClick={onToggle}
      className="pointer-events-auto absolute cursor-pointer rounded-[34px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      style={{ left, top, width: GOODS.width, height: GOODS.height }}
    >
      <motion.span
        key={round}
        data-testid="good"
        data-highlight={(selected && !result) || undefined}
        className={cx(
          'absolute inset-0 block',
          card,
          result === 'right' && 'outline-[8px] outline-canal',
          result === 'wrong' && 'outline-[8px] outline-wrong',
          result === 'missed' && 'outline-[8px] outline-dashed outline-coral',
        )}
        initial={false}
        animate={result && !reduceMotion ? { rotate: result === 'right' ? [0, -3, 3, 0] : [0, 2, -2, 0] } : undefined}
        transition={{ duration: 0.5 }}
      >
        <img src={choice.image} alt="" draggable={false} className="pointer-events-none absolute top-[4px] left-1/2 size-[136px] -translate-x-1/2 object-contain" />
        <span className="absolute inset-x-0 bottom-[6px] text-center font-heading text-[48px] leading-[1.2] font-bold text-kon-ink">{choice.word}</span>
        {result && <span className="sr-only"> {resultText[result]}</span>}
        {result && (
          <span
            aria-hidden="true"
            className={cx(
              'absolute -top-[30px] -left-[30px] z-10 flex size-[60px] items-center justify-center rounded-full border-4 border-kon-ink text-on-primary',
              { right: 'bg-canal', wrong: 'bg-wrong', missed: 'bg-coral' }[result],
            )}
          >
            <BadgeIcon className="size-9" strokeWidth={3.5} />
          </span>
        )}
      </motion.span>
      {/* The banana-leaf tag, tied on with a string: into my basket. */}
      {selected && (
        <svg data-testid="leaf-tag" aria-hidden="true" viewBox="0 0 70 80" className="pointer-events-none absolute -top-[22px] -right-[18px] z-10 h-[80px] w-[70px] overflow-visible">
          <path d="M10 6 Q22 2 30 14" fill="none" stroke="var(--color-kon-ink)" strokeWidth={3} strokeLinecap="round" />
          <path d="M30 14 Q70 22 62 60 Q58 76 40 76 Q14 70 18 40 Q20 22 30 14 Z" fill="var(--color-banana)" {...ink} strokeWidth={4} />
          <path d="M30 18 Q44 44 42 72 M36 34 L52 30 M38 48 L56 46 M40 60 L54 62" fill="none" stroke="var(--color-banana-light)" strokeWidth={3} strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
