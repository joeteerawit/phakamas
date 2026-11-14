import { Check, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip } from '../../../audio/audioManager'
import { lessonActivity, useReportUncheckedWork, useUncheckedWork } from '../../../session/activities'
import { useLessonSession } from '../../../session/lessonSession'
import { useClearFeedbackOnLeave } from '../../../steps/feedback'
import type { ActivityStepProps } from '../../../steps/stepProps'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useKit } from '../../../ui/kit'
import { celebrate } from '../../../ui/Stars'
import { bootOrder } from './boots'

const WRONG_FLASH_MS = 700
const TOAST_MS = 2500
// Stage pixels: four 260 px boots 80 apart on the porch mat (320–1600), their tops at 420; the toast shows above them.
const BOOT = { width: 260, height: 360, gap: 80, left: 320, top: 420 }
// A right pair turns its own colour: the first teal, the second raincoat yellow.
const PAIR_COLOURS = ['var(--color-pond)', 'var(--color-raincoat)']

type Pair = { a: string; b: string }

/**
 * แม่กบ Step 8, find the pair of boots (docs/mae-kop-spec.md): four grey rain boots stand on the porch mat, each with a
 * word on its side, no pair side by side. Tap one boot (it lifts a little), then the boot whose word rhymes. A right pair
 * turns the same colour, clops, splashes at its feet and is locked where it stands; a wrong pair wobbles and both turn
 * back to grey. Scored per pair, out of 2, counting wrong tries, with the shared Activity scoring and Stars; ถัดไป
 * before finishing records the pairs so far, เริ่มใหม่ clears.
 */
export function RhymeMatchingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { pairs, words, sounds } = lesson.rhymeMatching
  const activity = lessonActivity(lesson, 'rhymeMatching')
  const { Button } = useKit()
  const reduceMotion = !!useReducedMotion()
  const [matched, setMatched] = useState<readonly string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [wrong, setWrong] = useState<Pair | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)

  const done = matched.length === pairs.length
  const order = bootOrder(pairs)
  const clipOf = (word: string) => words.find((clip) => clip.text === word)!
  const pairOf = (word: string) => matched.findIndex((left) => pairs.some((p) => p.left === left && (p.left === word || p.right === word)))

  const started = !done && (matched.length > 0 || mistakes > 0)
  useReportUncheckedWork(activity, started)
  // ถัดไป before finishing records the pairs matched so far; untouched stays skipped.
  useEffect(() => {
    if (!started) return
    useUncheckedWork.setState({ partial: { score: matched.length, answers: { mistakes } } })
    return () => useUncheckedWork.setState({ partial: null })
  }, [started, matched.length, mistakes])

  // The toast hides after a moment so it never keeps covering the mat.
  useEffect(() => {
    onFeedback(feedback)
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [feedback, onFeedback])
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
      setFeedback({ kind: 'wrong', message: `${a} กับ ${b} ยังไม่ใช่คู่กัน ลองใหม่นะ` })
      return
    }
    const next = [...matched, pair.left]
    setMatched(next)
    if (next.length < pairs.length) {
      playClip(sounds.correct)
      setFeedback({ kind: 'correct', message: `${a} คล้องจองกับ ${b}` })
      return
    }
    recordActivityCheck(activity.id, pairs.length, activity.maxScore, { mistakes })
    celebrate(activity.id)
    setFeedback({ kind: 'correct', message: 'เก่งมาก! จับคู่รองเท้าครบแล้ว' })
  }

  const press = (word: string) => {
    playClip(clipOf(word))
    if (!selected || selected === word) setSelected(selected ? null : word)
    else attempt(selected, word)
  }

  const restart = () => {
    setMatched([])
    setSelected(null)
    setWrong(null)
    setMistakes(0)
    setFeedback(null)
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-pond-deep">
      {/* The woven porch mat the boots stand on. */}
      <div
        aria-hidden="true"
        data-testid="porch-mat"
        className="pointer-events-none absolute top-[740px] left-[300px] h-[120px] w-[1320px] rounded-[30px] border-[6px] border-mud bg-[repeating-linear-gradient(90deg,#c9a46a_0_30px,#b08850_30px_60px)]"
      />

      <ul>
        {order.map((word, i) => {
          const pair = pairOf(word)
          const shaking = wrong?.a === word || wrong?.b === word
          return (
            <li key={word}>
              <Boot
                word={word}
                left={BOOT.left + i * (BOOT.width + BOOT.gap)}
                colour={pair >= 0 ? PAIR_COLOURS[pair % PAIR_COLOURS.length]! : null}
                selected={selected === word}
                shaking={shaking ? mistakes : 0}
                still={reduceMotion}
                onPress={() => press(word)}
              />
            </li>
          )
        })}
      </ul>

      {done && (
        <p className="drop-label absolute top-[300px] left-1/2 flex h-[84px] -translate-x-1/2 items-center px-[32px] text-[40px] font-bold whitespace-nowrap">
          จับคู่ครบ {pairs.length} คู่ ได้ {pairs.length} คะแนน
        </p>
      )}

      <Button onClick={restart} className="absolute top-[900px] left-[790px] flex h-[124px] w-[340px] items-center justify-center gap-[12px] text-[44px] font-bold">
        <RotateCcw aria-hidden="true" className="relative size-[44px]" strokeWidth={3} />
        <span className="relative">เริ่มใหม่</span>
      </Button>
    </section>
  )
}

type BootProps = {
  word: string
  left: number
  /** A locked pair's colour, or null while grey. */
  colour: string | null
  selected: boolean
  /** Bumped on each wrong try this boot is in, so the wobble replays; 0 = still. */
  shaking: number
  still: boolean
  onPress: () => void
}

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 7, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** One rain boot with its word on the side: lifted while chosen, wobbling when wrong, coloured and splashing once paired. */
function Boot({ word, left, colour, selected, shaking, still, onPress }: BootProps) {
  const locked = colour !== null
  return (
    <button
      type="button"
      disabled={locked}
      aria-pressed={locked ? undefined : selected}
      data-paired={locked || undefined}
      onClick={onPress}
      className="pointer-events-auto absolute cursor-pointer rounded-[40px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-default"
      style={{ left, top: BOOT.top, width: BOOT.width, height: BOOT.height }}
    >
      <motion.span
        key={shaking ? `wrong-${shaking}` : 'boot'}
        data-testid="boot"
        className="absolute inset-0 block"
        initial={false}
        animate={still ? undefined : shaking ? { rotate: [0, -8, 8, -5, 5, 0] } : { y: selected ? -26 : 0 }}
        transition={shaking ? { duration: 0.45 } : { type: 'spring', stiffness: 400, damping: 18 }}
        style={{ transformOrigin: '50% 100%', translate: still && selected ? '0 -26px' : undefined }}
      >
        <svg viewBox="0 0 260 360" className="absolute inset-0 size-full overflow-visible">
          <path
            data-testid="boot-rubber"
            d="M40 20 H170 V230 Q250 236 252 300 V330 H40 Z"
            fill={colour ?? 'var(--color-rubber)'}
            {...ink}
          />
          <path d="M34 14 H176 V54 H34 Z" fill={colour ? 'var(--color-card)' : '#8d9aa7'} {...ink} />
          <path d="M60 80 Q70 70 90 74" fill="none" stroke="rgb(255 255 255 / 0.6)" strokeWidth={10} strokeLinecap="round" />
          <path d="M30 330 H258 V352 H30 Z" fill="var(--color-rubber-deep)" {...ink} />
        </svg>
        {/* The word on a white patch on the boot's side. */}
        <span className="absolute top-[110px] left-[38px] flex h-[120px] w-[140px] items-center justify-center rounded-[22px] border-[5px] border-rubber-deep bg-card text-[72px] leading-[1.3] font-bold text-rubber-deep">
          {word}
        </span>
        {locked && <Check aria-hidden="true" className="absolute -top-[10px] -right-[4px] size-[64px] rounded-full border-4 border-pond-deep bg-correct p-[6px] text-card" strokeWidth={4} />}
        {shaking > 0 && <X aria-hidden="true" className="absolute -top-[10px] -right-[4px] size-[64px] rounded-full border-4 border-pond-deep bg-wrong p-[6px] text-card" strokeWidth={4} />}
      </motion.span>
      {locked && <span className="sr-only"> จับคู่แล้ว</span>}
      {shaking > 0 && <span className="sr-only"> ไม่ใช่คู่กัน</span>}
      {/* The splash at its feet as the pair locks. */}
      <AnimatePresence>
        {locked && !still && (
          <motion.span
            data-testid="boot-splash"
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[20px] left-[10px] h-[50px] w-[240px] rounded-[50%] border-[6px] border-pond-light"
            initial={{ scale: 0.4, opacity: 1 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </button>
  )
}
