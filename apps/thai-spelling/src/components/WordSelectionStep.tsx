import { Check, ClipboardCheck, Pointer, RotateCcw, X } from 'lucide-react'
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { useState } from 'react'
import { playClip } from '../audio/audioManager'
import { celebrate } from './Stars'
import { scoreFeedback, useClearFeedbackOnLeave } from '../activities/feedback'
import { checkWordSelection } from '../activities/wordSelection'
import type { WordChoice } from '../lessons'
import { lessonActivity, useReportUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { cx } from './clay/buttonClass'
import type { ActivityStepProps } from './stepProps'

// Stage pixels from design DAHZj0Nxyxs page 5, minus StepLayout's content box origin (200, 180).
// Rows sit 40px higher than the design so the ≥44px check buttons fit under them on a 390px phone.
const COLUMNS = [278, 523, 768, 1013, 1258, 1503].map((x) => x - 200)
const ROWS = [225, 606].map((y) => y - 180)

type Result = 'right' | 'wrong' | 'missed'

const resultText: Record<Result, string> = { right: 'ถูกต้อง', wrong: 'เลือกผิด', missed: 'ลืมเลือก' }

/** Step 5: tap the picture cards of this มาตรา, ตรวจคำตอบ scores every choice, เริ่มใหม่ clears. */
export function WordSelectionStep({ lesson, onFeedback }: ActivityStepProps) {
  const { question, choices } = lesson.wordSelection
  const activity = lessonActivity(lesson, 'wordSelection')
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  // Results of the last check; editing a word clears its result. `round` replays the feedback animation.
  const [results, setResults] = useState<ReadonlyMap<string, Result>>(() => new Map())
  const [round, setRound] = useState(0)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  // Selections changed since the last check; Home asks before throwing them away.
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
    celebrate(activity.id)
  }

  const restart = () => {
    setSelected(new Set())
    setResults(new Map())
    setUnchecked(false)
    onFeedback(null)
  }

  return (
    <section aria-label={question} className="relative h-[876px] w-[1520px] shrink-0">
      <ul>
        {choices.map((choice, i) => (
          <li key={choice.word}>
            <PictureCard
              choice={choice}
              left={COLUMNS[i % 6]!}
              top={ROWS[Math.floor(i / 6)]!}
              selected={selected.has(choice.word)}
              result={results.get(choice.word)}
              round={round}
              onToggle={() => toggle(choice)}
            />
          </li>
        ))}
      </ul>
      {/* Left and right of centre, so the feedback toast (bottom centre) never hides them. */}
      <button type="button" onClick={check} className={cx(actionClass, 'left-[40px] bg-cream')}>
        <ClipboardCheck aria-hidden="true" className="size-16" strokeWidth={2.5} />
        ตรวจคำตอบ
      </button>
      <button type="button" onClick={restart} className={cx(actionClass, 'left-[1080px] bg-pill')}>
        <RotateCcw aria-hidden="true" className="size-16" strokeWidth={2.5} />
        เริ่มใหม่
      </button>
    </section>
  )
}

const actionClass =
  'absolute top-[748px] flex h-[124px] w-[400px] items-center justify-center gap-[16px] rounded-full border-[6px] border-cream-border ' +
  'font-heading text-[48px] font-bold text-navy shadow-[0_8px_0_rgba(0,0,0,0.2)] transition-transform duration-150 active:scale-95 ' +
  'motion-reduce:transition-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring'

type PictureCardProps = {
  choice: WordChoice
  left: number
  top: number
  selected: boolean
  result: Result | undefined
  round: number
  onToggle: () => void
}

function PictureCard({ choice, left, top, selected, result, round, onToggle }: PictureCardProps) {
  const reduceMotion = useReducedMotion()
  const motionFor: Record<Result, TargetAndTransition> = {
    right: { y: [0, -40, 0, -16, 0], transition: { duration: 0.6, ease: 'easeOut' } },
    wrong: { x: [0, -6, 6, -6, 6, -6, 6, 0], transition: { duration: 0.45 } },
    missed: { scale: [1, 1.06, 1, 1.06, 1], transition: { duration: 1.2, ease: 'easeInOut' } },
  }

  const BadgeIcon = { right: Check, wrong: X, missed: Pointer }[result ?? 'right']

  return (
    <button
      type="button"
      aria-pressed={selected}
      data-result={result}
      onClick={onToggle}
      style={{ left, top }}
      className={cx(
        'absolute h-[311px] w-[210px] cursor-pointer select-none rounded-[36px]',
        'transition-transform duration-200 ease-out motion-reduce:transition-none',
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
        selected && '-translate-y-[14px]',
      )}
    >
      {/* Keyed by check round so the same result animates again on the next check. */}
      <motion.span
        key={round}
        animate={result && !reduceMotion ? motionFor[result] : undefined}
        className={cx('absolute inset-0 block rounded-[36px] border-4', cardLook(selected, result))}
      >
        <span className="absolute top-[204px] right-[12px] font-heading text-[54px] leading-[1.2] font-bold text-navy">
          {choice.word}
        </span>
        {result && <span className="sr-only"> {resultText[result]}</span>}
        <img
          src={choice.image}
          alt=""
          draggable={false}
          className="pointer-events-none absolute top-[22px] left-[10px] h-[180px] w-[190px] object-contain"
        />
        <img
          src="/assets/canva/activities/tap-hint.webp"
          alt=""
          draggable={false}
          className="pointer-events-none absolute top-[205px] left-[22px] h-[85px] w-[87px] object-contain"
        />
        {result && (
          <span
            aria-hidden="true"
            className={cx(
              'absolute -top-[18px] -right-[18px] flex size-[64px] items-center justify-center rounded-full border-4 border-card text-on-primary',
              { right: 'bg-correct', wrong: 'bg-wrong', missed: 'bg-final' }[result],
            )}
          >
            <BadgeIcon className="size-10" strokeWidth={3.5} />
          </span>
        )}
        {result === 'right' && !reduceMotion && <Sparkles />}
      </motion.span>
    </button>
  )
}

const glow = 'shadow-[0_0_0_6px_#fde047,0_0_40px_12px_rgba(253,224,71,0.85)]'

/** Card colours per state; right/wrong/missed also get a badge icon and sr-only text, never colour alone. */
function cardLook(selected: boolean, result: Result | undefined) {
  if (result === 'right') return cx('border-solid border-correct bg-cream', glow)
  if (result === 'wrong') return 'border-solid border-wrong bg-[#ffc9c2]'
  if (result === 'missed') return 'border-solid border-final bg-cream shadow-[0_0_0_6px_rgba(255,49,49,0.5)]'
  return selected ? cx('border-solid border-accent bg-cream', glow) : 'border-dashed border-cream-border bg-cream'
}

const SPARKS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)

/** A one-shot burst of stars from the card centre. */
function Sparkles() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
      {SPARKS.map((angle, i) => (
        <motion.span
          key={i}
          className="absolute -translate-1/2 text-[48px] leading-none text-sun drop-shadow-[0_0_6px_#f59e0b]"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: Math.cos(angle) * 170, y: Math.sin(angle) * 200, opacity: 0, scale: 1.2, rotate: 90 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  )
}
