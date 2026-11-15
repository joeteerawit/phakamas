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
import { ink } from '../kit/ink'

// Stage pixels. Two terrace rows of six plants (200 wide, 226 apart, 290–1620), clear of the leaves at the window's
// sides; the action pots (300–656, 1260–1616) sit either side of the bottom-centre feedback toast (670–1250).
const COLUMN = { left: 290, step: 226, width: 200 }
const ROWS = [230, 560]
const PLANT_HEIGHT = 300

type Result = 'right' | 'wrong' | 'missed'
const resultText: Record<Result, string> = { right: 'ถูกต้อง', wrong: 'เลือกผิด', missed: 'ลืมเลือก' }

/**
 * แม่กก Step 5, harvest the แม่กก plants (docs/mae-kok-spec.md): twelve vegetable plants stand still in two terrace rows
 * of six, each with a seed-packet picture tag. Tapping a plant plays its word and harvests it where it stands: it lifts,
 * roots showing, into a woven basket at its foot; tapping again plants it back. Nothing moves across the rows.
 * ตรวจคำตอบ scores each plant as one Decision out of 12 with the shared Activity scoring and Stars; each plant is then
 * marked right, wrong or missed with a badge and screen-reader text, and stays editable. เริ่มใหม่ plants them all back.
 */
export function HarvestStep({ lesson, onFeedback }: ActivityStepProps) {
  const { question, instruction, choices } = lesson.wordSelection
  const activity = lessonActivity(lesson, 'wordSelection')
  const { Button } = useKit()
  const [harvested, setHarvested] = useState<ReadonlySet<string>>(() => new Set())
  // Results of the last check; changing a plant clears its result. `round` replays the result marks.
  const [results, setResults] = useState<ReadonlyMap<string, Result>>(() => new Map())
  const [round, setRound] = useState(0)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  const [unchecked, setUnchecked] = useState(false)
  useReportUncheckedWork(activity, unchecked)
  useClearFeedbackOnLeave(onFeedback)

  const toggle = (choice: WordChoice) => {
    playClip(choice.audio)
    setHarvested((old) => {
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
    const result = checkWordSelection(choices, harvested)
    const wrong = new Set(result.wrong)
    const next = new Map<string, Result>()
    for (const { word } of choices) {
      if (wrong.has(word)) next.set(word, harvested.has(word) ? 'wrong' : 'missed')
      else if (harvested.has(word)) next.set(word, 'right')
    }
    setResults(next)
    setRound((r) => r + 1)
    setUnchecked(false)
    recordActivityCheck(activity.id, result.score, activity.maxScore, [...harvested])
    onFeedback(scoreFeedback(result.score, activity.maxScore, 'ลองใหม่นะ'))
    celebrate(activity.id, result.score === activity.maxScore)
  }

  const restart = () => {
    setHarvested(new Set())
    setResults(new Map())
    setUnchecked(false)
    onFeedback(null)
  }

  return (
    <section data-full-stage aria-label={question} className="relative size-full">
      <p className="kraft-label absolute top-[150px] left-1/2 flex h-[68px] -translate-x-1/2 items-center px-[30px] font-heading text-[34px] font-bold whitespace-nowrap text-soil-deep">
        ถึงเวลาเก็บผัก! {instruction}
      </p>

      {/* The two terrace rows: a strip of soil along each, the plants standing in it. */}
      {ROWS.map((top) => (
        <div
          key={top}
          aria-hidden="true"
          data-testid="terrace-row"
          className="pointer-events-none absolute left-[270px] h-[46px] w-[1380px] rounded-[20px] border-[5px] border-soil-deep bg-soil"
          style={{ top: top + 238 }}
        />
      ))}

      <ul>
        {choices.map((choice, i) => (
          <li key={choice.word}>
            <Plant
              choice={choice}
              left={COLUMN.left + (i % 6) * COLUMN.step}
              top={ROWS[Math.floor(i / 6)]!}
              harvested={harvested.has(choice.word)}
              result={results.get(choice.word)}
              round={round}
              onToggle={() => toggle(choice)}
            />
          </li>
        ))}
      </ul>

      {/* Left and right of centre, so the feedback toast (bottom centre) never hides them. */}
      <Button data-main onClick={check} className={cx(action, 'left-[300px]')}>
        <ClipboardCheck aria-hidden="true" className="relative mt-[10px] size-14" strokeWidth={2.5} />
        <span className="relative mt-[10px]">ตรวจคำตอบ</span>
      </Button>
      <Button onClick={restart} className={cx(action, 'left-[1260px]')}>
        <RotateCcw aria-hidden="true" className="relative mt-[10px] size-14" strokeWidth={2.5} />
        <span className="relative mt-[10px]">เริ่มใหม่</span>
      </Button>
    </section>
  )
}

const action = 'absolute top-[896px] flex h-[124px] w-[356px] items-center justify-center gap-[14px] font-heading text-[42px] font-bold'

type PlantProps = {
  choice: WordChoice
  left: number
  top: number
  harvested: boolean
  result: Result | undefined
  round: number
  onToggle: () => void
}

/** One vegetable plant with its seed-packet picture tag; harvested, it lifts, roots showing, into the basket at its foot. */
function Plant({ choice, left, top, harvested, result, round, onToggle }: PlantProps) {
  const { card } = useKit()
  const still = !!useReducedMotion()
  const BadgeIcon = { right: Check, wrong: X, missed: Pointer }[result ?? 'right']

  return (
    <button
      type="button"
      aria-pressed={harvested}
      data-result={result}
      onClick={onToggle}
      className="pointer-events-auto absolute cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      style={{ left, top, width: COLUMN.width, height: PLANT_HEIGHT }}
    >
      {/* The plant lifts where it stands; nothing travels across the row (and it simply shows lifted under reduced motion). */}
      <motion.span
        data-testid="plant"
        className="absolute inset-0 block"
        initial={false}
        animate={{ y: harvested ? -22 : 0 }}
        transition={still ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18 }}
      >
        {/* Its leaves, behind the tag. */}
        <svg aria-hidden="true" viewBox="0 0 200 80" className="pointer-events-none absolute top-0 left-0 w-[200px] overflow-visible">
          <path d="M100 80 C40 70 30 20 60 4 C80 30 90 50 100 80 Z M100 80 C160 70 170 20 140 4 C120 30 110 50 100 80 Z" fill="var(--color-sprout)" {...ink} />
          <path d="M100 80 C90 40 92 14 100 0 C108 14 110 40 100 80 Z" fill="var(--color-sprout-deep)" {...ink} strokeWidth={4} />
        </svg>
        {/* The roots, out of the soil once it is pulled up. */}
        {harvested && (
          <svg data-testid="roots" aria-hidden="true" viewBox="0 0 120 50" className="pointer-events-none absolute top-[238px] left-[40px] w-[120px] overflow-visible">
            <path d="M60 0 Q50 24 30 46 M60 0 Q62 30 58 50 M60 0 Q74 24 92 44 M60 10 Q40 14 20 28 M60 10 Q84 14 104 26" fill="none" stroke="#e9d3a8" strokeWidth={6} strokeLinecap="round" />
          </svg>
        )}
        <motion.span
          key={round}
          data-testid="plant-tag"
          data-highlight={(harvested && !result) || undefined}
          className={cx(
            'absolute top-[36px] left-[10px] block h-[208px] w-[180px]',
            card,
            result === 'right' && 'outline-[8px] outline-correct',
            result === 'wrong' && 'outline-[8px] outline-wrong',
            result === 'missed' && 'outline-[8px] outline-dashed outline-final',
          )}
          initial={false}
          animate={result && !still ? { rotate: result === 'right' ? [0, -3, 3, 0] : [0, 2, -2, 0] } : undefined}
          transition={{ duration: 0.5 }}
        >
          <img src={choice.image} alt="" draggable={false} className="pointer-events-none absolute top-[26px] left-[35px] size-[110px] object-contain" />
          <span className="absolute inset-x-0 bottom-[8px] text-center font-heading text-[44px] leading-[1.2] font-bold text-soil-deep">{choice.word}</span>
          {result && <span className="sr-only"> {resultText[result]}</span>}
          {result && (
            <span
              aria-hidden="true"
              className={cx(
                'absolute -top-[16px] -left-[16px] z-10 flex size-[60px] items-center justify-center rounded-full border-4 border-soil-deep text-on-primary',
                { right: 'bg-correct', wrong: 'bg-wrong', missed: 'bg-final' }[result],
              )}
            >
              <BadgeIcon className="size-9" strokeWidth={3.5} />
            </span>
          )}
        </motion.span>
      </motion.span>
      {/* The woven basket at its foot, holding the harvested plant. */}
      {harvested && (
        <svg data-testid="basket" aria-hidden="true" viewBox="0 0 160 60" className="pointer-events-none absolute top-[240px] left-[20px] w-[160px] overflow-visible">
          <path d="M6 6 H154 L138 56 H22 Z" fill="var(--color-kraft)" {...ink} />
          <path d="M14 22 H146 M18 38 H142 M44 6 L50 56 M80 6 V56 M116 6 L110 56" fill="none" stroke="var(--color-kraft-deep)" strokeWidth={4} />
        </svg>
      )}
    </button>
  )
}
