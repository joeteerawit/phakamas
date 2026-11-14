import { Check, ClipboardCheck, Pointer, RotateCcw, X } from 'lucide-react'
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

// Stage pixels. Two washing lines of six (cards 200 wide, 226 apart, 290–1620), clear of the drops down the window's
// sides; the action pills (300–656, 1260–1616) sit either side of the bottom-centre feedback toast (670–1250).
const COLUMN = { left: 290, step: 226, width: 200 }
const LINES = [
  { rope: 250, top: 268 },
  { rope: 572, top: 590 },
]
const CARD_HEIGHT = 260

type Result = 'right' | 'wrong' | 'missed'
const resultText: Record<Result, string> = { right: 'ถูกต้อง', wrong: 'เลือกผิด', missed: 'ลืมเลือก' }

/**
 * แม่กบ Step 5, bring in the washing (docs/mae-kop-spec.md): rain is coming. Twelve picture cards, raincoat pockets,
 * hang still on two washing lines of six, each on a grey peg. Tapping a card plays its word, swaps its peg for a
 * raincoat-yellow one and puts a small laundry-basket badge on it (brought in); tapping again undoes it. Nothing moves
 * across the lines. ตรวจคำตอบ scores each card as one Decision out of 12 with the shared Activity scoring and Stars;
 * เริ่มใหม่ clears.
 */
export function WordSelectionStep({ lesson, onFeedback }: ActivityStepProps) {
  const { question, instruction, choices } = lesson.wordSelection
  const activity = lessonActivity(lesson, 'wordSelection')
  const { Button } = useKit()
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  // Results of the last check; changing a card clears its result. `round` replays the result marks.
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

  const restart = () => {
    setSelected(new Set())
    setResults(new Map())
    setUnchecked(false)
    onFeedback(null)
  }

  return (
    <section data-full-stage aria-label={question} className="relative size-full">
      <p className="drop-label absolute top-[160px] left-1/2 flex h-[72px] -translate-x-1/2 items-center px-[30px] font-heading text-[36px] font-bold whitespace-nowrap text-pond-deep">
        ฝนกำลังมา! {instruction}
      </p>

      {/* The two washing lines, between their poles. */}
      <svg aria-hidden="true" data-testid="washing-lines" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        {LINES.map(({ rope }) => (
          <g key={rope}>
            <path d={`M272 ${rope - 10} V${rope + 300} M1638 ${rope - 10} V${rope + 300}`} stroke="var(--color-mud)" strokeWidth={14} strokeLinecap="round" />
            <path d={`M272 ${rope} Q955 ${rope + 22} 1638 ${rope}`} fill="none" stroke="var(--color-rubber-deep)" strokeWidth={6} />
          </g>
        ))}
      </svg>

      <ul>
        {choices.map((choice, i) => (
          <li key={choice.word}>
            <WashingCard
              choice={choice}
              left={COLUMN.left + (i % 6) * COLUMN.step}
              line={LINES[Math.floor(i / 6)]!}
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
        <ClipboardCheck aria-hidden="true" className="relative size-16" strokeWidth={2.5} />
        <span className="relative">ตรวจคำตอบ</span>
      </Button>
      <Button onClick={restart} className={cx(action, 'left-[1260px]')}>
        <RotateCcw aria-hidden="true" className="relative size-16" strokeWidth={2.5} />
        <span className="relative">เริ่มใหม่</span>
      </Button>
    </section>
  )
}

const action = 'absolute top-[896px] flex h-[124px] w-[356px] items-center justify-center gap-[14px] font-heading text-[44px] font-bold'

type WashingCardProps = {
  choice: WordChoice
  left: number
  line: { rope: number; top: number }
  selected: boolean
  result: Result | undefined
  round: number
  onToggle: () => void
}

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** One card hanging on the line by its peg; brought in, its peg turns yellow and a laundry basket marks it. */
function WashingCard({ choice, left, line, selected, result, round, onToggle }: WashingCardProps) {
  const { card } = useKit()
  const reduceMotion = useReducedMotion()
  const BadgeIcon = { right: Check, wrong: X, missed: Pointer }[result ?? 'right']

  return (
    <button
      type="button"
      aria-pressed={selected}
      data-result={result}
      onClick={onToggle}
      className="pointer-events-auto absolute cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      style={{ left, top: line.top, width: COLUMN.width, height: CARD_HEIGHT }}
    >
      {/* The card hangs where it is; a check only marks it in place (a still mark under reduced motion). */}
      <motion.span
        key={round}
        data-testid="washing-card"
        data-highlight={(selected && !result) || undefined}
        className={cx(
          'absolute inset-0 block',
          card,
          result === 'right' && 'outline-[8px] outline-correct',
          result === 'wrong' && 'outline-[8px] outline-wrong',
          result === 'missed' && 'outline-[8px] outline-dashed outline-final',
        )}
        initial={false}
        animate={result && !reduceMotion ? { rotate: result === 'right' ? [0, -3, 3, 0] : [0, 2, -2, 0] } : undefined}
        style={{ transformOrigin: '50% 0' }}
        transition={{ duration: 0.5 }}
      >
        <img src={choice.image} alt="" draggable={false} className="pointer-events-none absolute top-[34px] left-[25px] size-[150px] object-contain" />
        <span className="absolute inset-x-0 bottom-[22px] text-center font-heading text-[48px] leading-[1.2] font-bold text-rubber-deep">{choice.word}</span>
        {result && <span className="sr-only"> {resultText[result]}</span>}
        {selected && (
          <svg data-testid="basket" aria-hidden="true" viewBox="0 0 60 50" className="absolute right-[6px] bottom-[64px] w-[54px] overflow-visible">
            <path d="M6 18 H54 L48 46 H12 Z" fill="var(--color-raincoat)" {...ink} />
            <path d="M14 18 Q30 -4 46 18 M16 26 H44 M18 34 H42" fill="none" {...ink} />
          </svg>
        )}
        {result && (
          <span
            aria-hidden="true"
            className={cx(
              'absolute -top-[16px] -left-[16px] z-10 flex size-[60px] items-center justify-center rounded-full border-4 border-pond-deep text-on-primary',
              { right: 'bg-correct', wrong: 'bg-wrong', missed: 'bg-final' }[result],
            )}
          >
            <BadgeIcon className="size-9" strokeWidth={3.5} />
          </span>
        )}
      </motion.span>
      {/* The peg clipping it to the line: grey on the line, raincoat yellow once brought in. */}
      <svg data-testid="peg" data-selected={selected || undefined} aria-hidden="true" viewBox="0 0 30 60" className="pointer-events-none absolute -top-[34px] left-[85px] z-10 h-[60px] w-[30px] overflow-visible">
        <rect x="4" y="2" width="22" height="56" rx="6" fill={selected ? 'var(--color-raincoat)' : 'var(--color-rubber)'} {...ink} />
        <path d="M15 8 V52" {...ink} />
      </svg>
    </button>
  )
}
