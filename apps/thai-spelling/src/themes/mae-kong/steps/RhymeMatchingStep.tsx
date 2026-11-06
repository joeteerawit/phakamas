import { Check, RotateCcw, Star, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip } from '../../../audio/audioManager'
import { celebrate } from '../../../ui/Stars'
import { useClearFeedbackOnLeave } from '../../../steps/feedback'
import { lessonActivity, useReportUncheckedWork, useUncheckedWork } from '../../../session/activities'
import { useLessonSession } from '../../../session/lessonSession'
import { creamCard, cx, pressable } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import type { ActivityStepProps } from '../../../steps/stepProps'

const WRONG_FLASH_MS = 700
const TOAST_MS = 2500
const BUZZER = '/assets/comic/ui-buzzer.webp'

/** A point on the 1920×1080 stage. */
type StagePoint = { x: number; y: number }

const SIZE = { width: 269, height: 232 }
/** From a buzzer's top to the middle of the word on its red cap. */
const CAP_TEXT_Y = 80
/**
 * Buzzer top-left corners, in `lesson.rhymeMatching.words` order (TL, TR, BL, BR). Design page 8's left
 * column and rows, with the right column mirrored about x = 960 so the grid and its gaps are symmetric.
 */
const SPOTS: readonly StagePoint[] = [
  { x: 343, y: 308 },
  { x: 1308, y: 308 },
  { x: 343, y: 630 },
  { x: 1308, y: 630 },
]
/** Middle of the word on the red cap; match lines join these. */
const capCentre = ({ x, y }: StagePoint): StagePoint => ({ x: x + SIZE.width / 2, y: y + CAP_TEXT_Y })

type Pair = { a: string; b: string }

/** Step 8: press one buzzer, then the buzzer of the word that rhymes with it. */
export function RhymeMatchingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { pairs, words, sounds } = lesson.rhymeMatching
  const activity = lessonActivity(lesson, 'rhymeMatching')
  const [matched, setMatched] = useState<ReadonlySet<string>>(() => new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [wrong, setWrong] = useState<Pair | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  const reduceMotion = useReducedMotion()

  const done = matched.size === pairs.length
  const lockedPairs = pairs.filter((pair) => matched.has(pair.left))
  const lastPair = lockedPairs.at(-1)
  // An Activity started but not finished; Home asks before throwing it away.
  const started = !done && (matched.size > 0 || mistakes > 0)
  useReportUncheckedWork(activity, started)
  // ถัดไป before finishing records the pairs matched so far (spec: ถัดไป บันทึกผล); untouched stays skipped.
  useEffect(() => {
    if (!started) return
    useUncheckedWork.setState({ partial: { score: matched.size, answers: { mistakes } } })
    return () => useUncheckedWork.setState({ partial: null })
  }, [started, matched.size, mistakes])
  const isLocked = (word: string) => lockedPairs.some((pair) => pair.left === word || pair.right === word)

  // The toast (shown by StepLayout) hides after a moment so it never keeps covering the board or the stars.
  useEffect(() => {
    onFeedback(feedback)
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [feedback, onFeedback])

  // A wrong pair shakes briefly; each new wrong pair restarts it.
  useEffect(() => {
    if (!wrong) return
    const timer = setTimeout(() => setWrong(null), WRONG_FLASH_MS)
    return () => clearTimeout(timer)
  }, [wrong])
  useClearFeedbackOnLeave(onFeedback)

  const attempt = (a: string, b: string) => {
    setSelected(null)
    const pair = pairs.find((p) => (p.left === a && p.right === b) || (p.left === b && p.right === a))
    if (!pair) {
      setMistakes((count) => count + 1)
      setWrong({ a, b })
      setFeedback({ kind: 'wrong', message: `${a} กับ ${b} ยังไม่ถูก ลองใหม่นะ` })
      return
    }
    const next = new Set(matched).add(pair.left)
    setMatched(next)
    if (next.size < pairs.length) {
      playClip(sounds.correct)
      setFeedback({ kind: 'correct', message: `${a} คล้องจองกับ ${b}` })
      return
    }
    recordActivityCheck(activity.id, pairs.length, activity.maxScore, { mistakes })
    celebrate(activity.id)
    setFeedback({ kind: 'correct', message: 'เก่งมาก! จับคู่ถูกครบแล้ว' })
  }

  const press = (index: number) => {
    const clip = words[index]!
    playClip(clip)
    if (!selected || selected === clip.text) setSelected(selected ? null : clip.text)
    else attempt(selected, clip.text)
  }

  const restart = () => {
    setMatched(new Set())
    setSelected(null)
    setWrong(null)
    setMistakes(0)
    setFeedback(null)
  }

  const spotOf = (word: string) => SPOTS[words.findIndex((clip) => clip.text === word)]!

  return (
    <section data-full-stage className="relative size-full">
      <svg
        data-testid="match-lines"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full overflow-visible [filter:drop-shadow(0_0_10px_var(--color-sun))_drop-shadow(0_0_22px_var(--color-sun))]"
      >
        {lockedPairs.map((pair) => {
          const from = capCentre(spotOf(pair.left))
          const to = capCentre(spotOf(pair.right))
          // Bow upward so the line arcs over the pond instead of running straight through it.
          const bend = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 60 }
          return (
            <motion.path
              key={pair.left}
              d={`M ${from.x} ${from.y} Q ${bend.x} ${bend.y} ${to.x} ${to.y}`}
              fill="none"
              stroke="var(--color-sun)"
              strokeWidth={16}
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )
        })}
      </svg>

      {words.map((clip, index) => {
        const word = clip.text
        const spot = SPOTS[index]!
        const locked = isLocked(word)
        const shaking = wrong?.a === word || wrong?.b === word
        const bouncing = lastPair?.left === word || lastPair?.right === word
        const motionProps = reduceMotion
          ? {}
          : shaking
            ? { animate: { x: [0, -18, 18, -12, 12, 0] }, transition: { duration: 0.45 } }
            : bouncing
              ? { animate: { y: [0, -44, 0, -16, 0] }, transition: { duration: 0.6 } }
              : {}
        return (
          <button
            key={word}
            type="button"
            disabled={locked}
            aria-pressed={locked ? undefined : selected === word}
            onClick={() => press(index)}
            className="group pointer-events-auto absolute cursor-pointer select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-default"
            style={{ left: spot.x, top: spot.y, ...SIZE }}
          >
            {/* Remounts on each wrong try or new pair so the shake or bounce replays. */}
            <motion.span
              key={shaking ? `wrong-${mistakes}` : `matched-${matched.size}`}
              {...motionProps}
              className={cx('block size-full transition-[filter] duration-300', locked && 'saturate-50 brightness-90')}
            >
              <span className="block size-full transition-transform duration-100 ease-out group-active:translate-y-[12px] motion-reduce:transition-none motion-reduce:group-active:translate-y-0 group-disabled:group-active:translate-y-0">
                <img
                  src={BUZZER}
                  alt=""
                  draggable={false}
                  className={cx(
                    'pointer-events-none size-full object-contain transition-[filter] duration-100',
                    selected === word
                      ? '[filter:drop-shadow(0_0_14px_var(--color-sun))_drop-shadow(0_0_30px_var(--color-sun))]'
                      : '[filter:drop-shadow(0_14px_8px_rgb(0_0_0/0.35))] group-active:[filter:drop-shadow(0_4px_3px_rgb(0_0_0/0.35))]',
                  )}
                />
                {/* Inked white lettering stays readable on the red dome. */}
                <span className="absolute inset-x-0 top-[30px] text-center font-heading text-[84px] leading-[1.2] font-bold text-card text-inked">
                  {word}
                </span>
                {locked && (
                  <>
                    <Check aria-hidden="true" className="absolute top-0 right-0 size-16 text-correct" strokeWidth={4} />
                    <span className="sr-only">จับคู่แล้ว</span>
                  </>
                )}
                {shaking && (
                  <>
                    <X aria-hidden="true" className="absolute top-0 right-0 size-16 text-wrong" strokeWidth={4} />
                    <span className="sr-only">ไม่ใช่คู่กัน</span>
                  </>
                )}
              </span>
            </motion.span>
          </button>
        )
      })}

      {done && <CompletedCard score={pairs.length} />}

      <button
        type="button"
        onClick={restart}
        className={cx(
          pressable,
          'absolute top-[920px] left-1/2 flex -translate-x-1/2 items-center gap-[12px] rounded-full border-[5px] border-comic-ink bg-pill px-[32px] font-heading text-[40px] leading-[1.6] font-bold text-navy shadow-comic',
        )}
      >
        <RotateCcw aria-hidden="true" className="size-[40px]" strokeWidth={3} />
        เริ่มใหม่
      </button>
    </section>
  )
}

/** Star burst + score once every pair is matched. */
function CompletedCard({ score }: { score: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={cx(creamCard, 'absolute top-[480px] left-[960px] z-20 flex -translate-x-1/2 flex-col items-center gap-[8px] px-[48px] py-[24px] text-center text-navy')}
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.3, bounce: 0.45 }}
    >
      <div role="img" aria-label={`ได้ ${score} ดาว`} className="flex gap-[12px]">
        {Array.from({ length: score }, (_, i) => (
          <Star key={i} aria-hidden="true" className="size-[88px] fill-accent text-accent" strokeWidth={2} />
        ))}
      </div>
      <p className="font-heading text-[48px] leading-[1.4] font-bold">เก่งมาก! จับคู่ถูกครบ</p>
      <p className="font-heading text-[36px] leading-[1.4] font-semibold">ได้ {score} คะแนน</p>
    </motion.div>
  )
}
