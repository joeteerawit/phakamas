import { Check, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip } from '../../../audio/audioManager'
import { lessonActivity, useReportUncheckedWork, useUncheckedWork } from '../../../session/activities'
import { useLessonSession } from '../../../session/lessonSession'
import { useClearFeedbackOnLeave } from '../../../steps/feedback'
import type { ActivityStepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useKit } from '../../../ui/kit'
import { celebrate } from '../../../ui/Stars'
import { ink } from '../kit/ink'
import { bundleOrder } from './bundles'

const WRONG_MS = 800
const TOAST_MS = 2500
// Stage pixels. The child with the shoulder pole walks in the lane under the toast (280–660), the pole's baskets at its
// ends (x = 560 and 1160); the hut's sign stands at the right (1330–1620 × 280–620); the four vegetable bundles lie
// along the terrace edge (330–1590 × 720–900), all clear of the leaves at the window's sides.
const BUNDLE = { width: 270, height: 180, gap: 60, left: 330, top: 720 }
const POLE = { cx: 860, y: 420, half: 300 }
const TILT = { loaded: -6, wrong: 14 }

type Pair = { left: string; right: string }

/**
 * แม่กก Step 8, balance the carrying pole (docs/mae-kok-spec.md): a child stands with a shoulder pole (คานหาบ) and two
 * empty baskets, in a lane above the words. The four words lie on vegetable bundles along the terrace edge. Tapping a
 * word puts it in the left basket, and the pole dips that way; tapping a second puts it in the right. If they rhyme the
 * pole balances level, the correct sound plays, the child walks a few steps towards the hut and the pair is locked and
 * shown on the hut's sign. If not, the pole tips and the second word slides back to its bundle. Scored per pair with the
 * shared Activity scoring and Stars, counting wrong tries; ถัดไป before finishing records the pairs so far, เริ่มใหม่
 * clears. Under reduced motion the pole never tips and the pair simply appears on the sign.
 */
export function RhymeMatchingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { pairs, words, sounds } = lesson.rhymeMatching
  const activity = lessonActivity(lesson, 'rhymeMatching')
  const { Button } = useKit()
  const still = !!useReducedMotion()
  const [matched, setMatched] = useState<readonly Pair[]>([])
  const [leftWord, setLeftWord] = useState<string | null>(null)
  const [wrong, setWrong] = useState<{ word: string; round: number } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [walks, setWalks] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)

  const done = matched.length === pairs.length
  const order = bundleOrder(pairs)
  const clipOf = (word: string) => words.find((clip) => clip.text === word)!
  const locked = (word: string) => matched.some((p) => p.left === word || p.right === word)

  const started = !done && (matched.length > 0 || mistakes > 0)
  useReportUncheckedWork(activity, started)
  // ถัดไป before finishing records the pairs matched so far; untouched stays skipped.
  useEffect(() => {
    if (!started) return
    useUncheckedWork.setState({ partial: { score: matched.length, answers: { mistakes } } })
    return () => useUncheckedWork.setState({ partial: null })
  }, [started, matched.length, mistakes])

  // The toast hides after a moment so it never keeps covering the lane.
  useEffect(() => {
    onFeedback(feedback)
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [feedback, onFeedback])
  // A wrong second word rides in the right basket a moment, then slides back to its bundle.
  useEffect(() => {
    if (!wrong) return
    const timer = setTimeout(() => setWrong(null), WRONG_MS)
    return () => clearTimeout(timer)
  }, [wrong])
  useClearFeedbackOnLeave(onFeedback)

  const attempt = (a: string, b: string) => {
    const pair = pairs.find((p) => (p.left === a && p.right === b) || (p.left === b && p.right === a))
    if (!pair) {
      setMistakes((count) => count + 1)
      setWrong((old) => ({ word: b, round: (old?.round ?? 0) + 1 }))
      setFeedback({ kind: 'wrong', message: `${a} กับ ${b} ยังไม่ใช่คู่กัน ลองใหม่นะ` })
      return
    }
    const next = [...matched, pair]
    setMatched(next)
    setLeftWord(null)
    setWalks((n) => n + 1)
    if (next.length < pairs.length) {
      playClip(sounds.correct)
      setFeedback({ kind: 'correct', message: `${a} คล้องจองกับ ${b}` })
      return
    }
    recordActivityCheck(activity.id, pairs.length, activity.maxScore, { mistakes })
    celebrate(activity.id)
    setFeedback({ kind: 'correct', message: 'เก่งมาก! หาบผักครบทุกคู่แล้ว' })
  }

  const press = (word: string) => {
    if (locked(word) || wrong) return
    playClip(clipOf(word))
    if (leftWord === null) return setLeftWord(word)
    if (leftWord === word) return setLeftWord(null)
    attempt(leftWord, word)
  }

  const restart = () => {
    setMatched([])
    setLeftWord(null)
    setWrong(null)
    setMistakes(0)
    setFeedback(null)
  }

  const rightWord = wrong?.word ?? null
  const tilt = still ? 0 : rightWord ? TILT.wrong : leftWord ? TILT.loaded : 0

  return (
    <section data-full-stage className="relative size-full font-heading text-soil-deep">
      <CarryingPole left={leftWord} right={rightWord} tilt={tilt} walks={walks} still={still} />
      <HutSign pairs={matched} still={still} />

      {/* The terrace edge the bundles lie along. */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[880px] left-[300px] h-[40px] w-[1320px] rounded-[16px] border-[5px] border-soil-deep bg-soil" />
      <ul aria-label="มัดผัก">
        {order.map((word, i) => {
          const inBasket = word === leftWord || word === rightWord
          const isLocked = locked(word)
          return (
            <li key={word}>
              <button
                type="button"
                disabled={isLocked}
                aria-pressed={isLocked ? undefined : word === leftWord}
                data-paired={isLocked || undefined}
                onClick={() => press(word)}
                className="pointer-events-auto absolute cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-default"
                style={{ left: BUNDLE.left + i * (BUNDLE.width + BUNDLE.gap), top: BUNDLE.top, width: BUNDLE.width, height: BUNDLE.height }}
              >
                <Bundle word={word} empty={inBasket || isLocked} />
                {isLocked && <span className="sr-only"> จับคู่แล้ว</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {done && (
        <p className="kraft-label absolute top-[940px] left-[300px] flex h-[84px] items-center px-[32px] text-[38px] font-bold whitespace-nowrap">
          หาบครบ {pairs.length} คู่ ได้ {pairs.length} คะแนน
        </p>
      )}
      <Button onClick={restart} className="absolute top-[936px] left-[1280px] flex h-[124px] w-[340px] items-center justify-center gap-[12px] text-[44px] font-bold">
        <RotateCcw aria-hidden="true" className="relative mt-[10px] size-[44px]" strokeWidth={3} />
        <span className="relative mt-[10px]">เริ่มใหม่</span>
      </Button>
    </section>
  )
}

/** A bundle of greens tied with string, its word on a kraft tag; empty while its word rides in a basket or is paired. */
function Bundle({ word, empty }: { word: string; empty: boolean }) {
  return (
    <span data-testid="bundle" data-empty={empty || undefined} className="pointer-events-none absolute inset-0 block">
      <svg aria-hidden="true" viewBox="0 0 270 180" className="absolute inset-0 size-full overflow-visible">
        {[40, 90, 140, 190].map((x) => (
          <path key={x} d={`M${x + 20} 170 Q${x} 90 ${x + 10} 20 Q${x + 50} 70 ${x + 30} 170 Z`} fill={empty ? '#b8c99a' : 'var(--color-sprout)'} {...ink} strokeWidth={4} />
        ))}
        <rect x="30" y="140" width="210" height="22" rx="8" fill={empty ? '#c9b48a' : 'var(--color-kraft-deep)'} {...ink} strokeWidth={4} />
      </svg>
      <span
        className={cx(
          'absolute top-[50px] left-1/2 flex h-[86px] min-w-[150px] -translate-x-1/2 items-center justify-center rounded-[14px] border-[5px] border-soil-deep px-[14px] text-[60px] leading-none font-bold',
          empty ? 'border-dashed bg-kraft-light/60 text-soil-deep/40' : 'bg-kraft-light',
        )}
      >
        {word}
      </span>
    </span>
  )
}

/** The child under the shoulder pole, a basket at each end; the pole dips, tips or balances with what the baskets hold. */
function CarryingPole({ left, right, tilt, walks, still }: { left: string | null; right: string | null; tilt: number; walks: number; still: boolean }) {
  const drop = Math.sin((tilt * Math.PI) / 180) * POLE.half
  return (
    <motion.div
      key={still ? 'still' : walks}
      data-testid="carrier"
      data-tilt={tilt}
      aria-hidden="true"
      className="pointer-events-none absolute top-[280px] left-0 h-[380px] w-[1320px]"
      initial={false}
      animate={still || walks === 0 ? undefined : { x: [0, 60, 0] }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
    >
      {/* The child, the pole across the shoulders. */}
      <svg viewBox="0 0 160 260" className="absolute top-[60px] w-[160px] overflow-visible" style={{ left: POLE.cx - 80 }}>
        <path d="M60 200 V256 M100 200 V256" {...ink} strokeWidth={14} />
        <path d="M40 100 H120 L132 210 H28 Z" fill="var(--color-terracotta)" {...ink} />
        <circle cx="80" cy="62" r="40" fill="#f5c08a" {...ink} />
        <path d="M30 56 Q80 -6 130 56 Z" fill="#e8c25a" {...ink} />
        <path d="M66 76 Q80 88 94 76" fill="none" {...ink} strokeWidth={4} />
      </svg>
      <motion.div
        data-testid="pole"
        className="absolute h-[20px] rounded-full border-[5px] border-soil-deep bg-[#d9c27a]"
        style={{ left: POLE.cx - POLE.half - 20, top: POLE.y - 280 - 10, width: (POLE.half + 20) * 2 }}
        initial={false}
        animate={{ rotate: tilt }}
        transition={still ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 12 }}
      />
      {(
        [
          ['left', -1, left],
          ['right', 1, right],
        ] as const
      ).map(([side, sign, word]) => (
        <motion.div
          key={side}
          data-testid={`basket-${side}`}
          className="absolute h-[200px] w-[200px]"
          style={{ left: POLE.cx + sign * POLE.half - 100, top: POLE.y - 280 }}
          initial={false}
          animate={{ y: sign * drop }}
          transition={still ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 12 }}
        >
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible">
            <path d="M100 0 L40 110 M100 0 L160 110" stroke="var(--color-soil-deep)" strokeWidth={4} />
            <path d="M24 110 H176 L156 196 H44 Z" fill="var(--color-kraft)" {...ink} />
            <path d="M34 140 H166 M40 168 H160 M70 110 L76 196 M100 110 V196 M130 110 L124 196" stroke="var(--color-kraft-deep)" strokeWidth={4} />
          </svg>
          <AnimatePresence>
            {word && (
              <motion.span
                key={word}
                data-testid="basket-word"
                className="absolute top-[54px] left-1/2 flex h-[80px] min-w-[130px] -translate-x-1/2 items-center justify-center rounded-[12px] border-[5px] border-soil-deep bg-kraft-light px-[12px] text-[54px] leading-none font-bold"
                initial={still ? false : { y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={still ? { opacity: 0, transition: { duration: 0 } } : { y: 300, opacity: 0, transition: { duration: 0.35 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                {word}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  )
}

/** The sign by the hut, where each locked pair is shown. */
function HutSign({ pairs, still }: { pairs: readonly Pair[]; still: boolean }) {
  return (
    <div data-testid="hut-sign" className="absolute top-[280px] left-[1330px] h-[340px] w-[290px]">
      <svg aria-hidden="true" viewBox="0 0 290 340" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <path d="M60 340 V140 M230 340 V140" {...ink} strokeWidth={12} />
        <path d="M60 340 V140 M230 340 V140" stroke="#c9b25a" strokeWidth={6} />
        <path d="M20 60 L145 0 L270 60 Z" fill="var(--color-kraft-deep)" {...ink} />
        <rect x="20" y="60" width="250" height="230" rx="14" fill="var(--color-plank)" {...ink} />
      </svg>
      <ul aria-label="คู่ที่หาบแล้ว" className="absolute top-[80px] left-[36px] flex w-[218px] flex-col gap-[14px]">
        <AnimatePresence>
          {pairs.map((pair) => (
            <motion.li
              key={pair.left}
              data-testid="sign-pair"
              className="flex h-[86px] items-center justify-center gap-[6px] rounded-[12px] border-[4px] border-soil-deep bg-kraft-light text-[40px] leading-none font-bold"
              initial={still ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: still ? 0 : 0.8 }}
            >
              {pair.left}
              <Check aria-hidden="true" className="size-[30px] text-correct" strokeWidth={4} />
              {pair.right}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
