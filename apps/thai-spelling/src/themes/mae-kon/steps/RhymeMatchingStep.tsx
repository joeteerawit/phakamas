import { Check, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip, useClipStatus } from '../../../audio/audioManager'
import type { AudioClip } from '../../../lessons'
import { lessonActivity, useReportUncheckedWork, useUncheckedWork } from '../../../session/activities'
import { useLessonSession } from '../../../session/lessonSession'
import { useClearFeedbackOnLeave } from '../../../steps/feedback'
import type { ActivityStepProps } from '../../../steps/stepProps'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useKit } from '../../../ui/kit'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { celebrate } from '../../../ui/Stars'
import { ink } from '../kit/ink'

const SLACK_MS = 800
const TOAST_MS = 2500
// Stage pixels. Four boats in two columns (330 and 1230) and two rows (330 and 640), 360×220, the raft landing down the
// middle (920–1000). Each boat has its own lane, its row: once paired it drifts along it to the landing (left boats to
// 560, right boats to 1000), so it never passes over another boat. The toast shows above them (146–256).
const BOAT = { width: 360, height: 220 }
const COLUMN = { left: 330, right: 1230 }
const DOCKED = { left: 560, right: 1000 }
const ROW = [330, 640]
// Words in reading order (top-left, top-right, bottom-left, bottom-right).
const SPOTS = [
  { row: 0, side: 'left' },
  { row: 0, side: 'right' },
  { row: 1, side: 'left' },
  { row: 1, side: 'right' },
] as const

type Spot = (typeof SPOTS)[number]
type Point = { x: number; y: number }
const boatLeft = (spot: Spot, docked: boolean) => (docked ? DOCKED : COLUMN)[spot.side]
/** The ring on a boat's bow, towards the landing, where a rope is tied. */
const bow = (spot: Spot, docked: boolean): Point => ({
  x: boatLeft(spot, docked) + (spot.side === 'left' ? BOAT.width - 16 : 16),
  y: ROW[spot.row]! + 120,
})
const rope = (a: Point, b: Point, sag: number) => `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + sag} ${b.x} ${b.y}`

type Pair = { a: string; b: string }

/**
 * แม่กน Step 8, raft the rhyming boats (docs/mae-kon-spec.md): four small boats float in two columns on the quiet canal,
 * each carrying one word and its leaf-cone speaker. Tapping a boat plays its word and picks it; tapping a second boat
 * whose word rhymes ties a coral rope between their bows, and both drift along their own lanes to the raft landing in the
 * middle, where they lock. A wrong pair: the rope goes slack and falls, the boats stay, and the miss is counted. Scored
 * per pair, out of 2, with the shared Activity scoring and Stars; ถัดไป before finishing records the pairs so far,
 * เริ่มใหม่ clears. Under reduced motion the rope just appears and the boats stay put.
 */
export function RhymeMatchingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { pairs, words, sounds } = lesson.rhymeMatching
  const activity = lessonActivity(lesson, 'rhymeMatching')
  const { Button } = useKit()
  const still = !!useReducedMotion()
  const [matched, setMatched] = useState<readonly string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [wrong, setWrong] = useState<Pair & { round: number } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)

  const done = matched.length === pairs.length
  const spotOf = (word: string) => SPOTS[words.findIndex((clip) => clip.text === word)]!
  const pairOf = (word: string) => pairs.find((p) => p.left === word || p.right === word)!
  const isMatched = (word: string) => matched.includes(pairOf(word).left)

  const started = !done && (matched.length > 0 || mistakes > 0)
  useReportUncheckedWork(activity, started)
  // ถัดไป before finishing records the pairs matched so far; untouched stays skipped.
  useEffect(() => {
    if (!started) return
    useUncheckedWork.setState({ partial: { score: matched.length, answers: { mistakes } } })
    return () => useUncheckedWork.setState({ partial: null })
  }, [started, matched.length, mistakes])

  // The toast hides after a moment so it never keeps covering the canal.
  useEffect(() => {
    onFeedback(feedback)
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [feedback, onFeedback])
  useEffect(() => {
    if (!wrong) return
    const timer = setTimeout(() => setWrong(null), SLACK_MS)
    return () => clearTimeout(timer)
  }, [wrong])
  useClearFeedbackOnLeave(onFeedback)

  const attempt = (a: string, b: string) => {
    setSelected(null)
    const pair = pairs.find((p) => (p.left === a && p.right === b) || (p.left === b && p.right === a))
    if (!pair) {
      setMistakes((count) => count + 1)
      setWrong((old) => ({ a, b, round: (old?.round ?? 0) + 1 }))
      setFeedback({ kind: 'wrong', message: `${a} กับ ${b} ยังไม่คล้องจองกัน ลองใหม่นะ` })
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
    setFeedback({ kind: 'correct', message: 'เก่งมาก! ผูกแพครบแล้ว' })
  }

  const press = (clip: AudioClip) => {
    playClip(clip)
    const word = clip.text
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
    <section data-full-stage className="relative size-full font-heading text-kon-ink">
      {/* The raft landing down the middle, between the two columns, and the lanes the boats drift along. */}
      <div aria-hidden="true" data-testid="raft-landing" className="pointer-events-none absolute top-[300px] left-[920px] h-[600px] w-[80px] rounded-[16px] border-[5px] border-kon-ink bg-[repeating-linear-gradient(0deg,var(--color-teak)_0_46px,var(--color-teak-deep)_46px_52px)]" />

      {/* The ropes: one tied for each pair, and a slack one falling for a wrong try. */}
      <svg aria-hidden="true" data-testid="ropes" viewBox="0 0 1920 1080" className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible">
        {pairs
          .filter((p) => matched.includes(p.left))
          .map((p) => {
            const [a, b] = [spotOf(p.left), spotOf(p.right)]
            return (
              <motion.path
                key={p.left}
                data-testid="raft-rope"
                fill="none"
                stroke="var(--color-coral)"
                strokeWidth={10}
                strokeLinecap="round"
                initial={still ? false : { d: rope(bow(a, false), bow(b, false), 30) }}
                animate={{ d: rope(bow(a, !still), bow(b, !still), 18) }}
                transition={still ? { duration: 0 } : { duration: 0.9, ease: 'easeInOut' }}
              />
            )
          })}
        <AnimatePresence>
          {wrong && (
            <motion.path
              key={wrong.round}
              data-testid="slack-rope"
              fill="none"
              stroke="var(--color-coral)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray="18 10"
              initial={{ d: rope(bow(spotOf(wrong.a), false), bow(spotOf(wrong.b), false), 20), opacity: 1, y: 0 }}
              animate={still ? { opacity: 1 } : { d: rope(bow(spotOf(wrong.a), false), bow(spotOf(wrong.b), false), 220), opacity: [1, 1, 0], y: [0, 0, 80] }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: SLACK_MS / 1000, ease: 'easeIn' }}
            />
          )}
        </AnimatePresence>
      </svg>

      <ul>
        {words.map((clip, i) => {
          const spot = SPOTS[i]!
          const locked = isMatched(clip.text)
          return (
            <li key={clip.id}>
              <RaftBoat
                clip={clip}
                spot={spot}
                docked={locked}
                selected={selected === clip.text}
                missed={wrong && (wrong.a === clip.text || wrong.b === clip.text) ? wrong.round : 0}
                still={still}
                onPress={() => press(clip)}
              />
            </li>
          )
        })}
      </ul>

      <Button onClick={restart} className="absolute top-[920px] left-[330px] flex h-[124px] w-[320px] items-center justify-center gap-[12px] px-[30px] text-[42px] font-bold">
        <RotateCcw aria-hidden="true" className="relative size-[44px] shrink-0" strokeWidth={3} />
        <span className="relative">เริ่มใหม่</span>
      </Button>
      {done && (
        <p className="bamboo-label absolute top-[940px] left-[720px] flex h-[84px] items-center px-[32px] text-[40px] font-bold whitespace-nowrap">
          ผูกแพครบ {pairs.length} คู่ ได้ {pairs.length} คะแนน
        </p>
      )}
    </section>
  )
}

type RaftBoatProps = {
  clip: AudioClip
  spot: Spot
  docked: boolean
  selected: boolean
  /** Bumped on each wrong try this boat is in; 0 = none showing. */
  missed: number
  still: boolean
  onPress: () => void
}

/** One small boat with its word and its speaker: lifted while picked, drifting along its lane to the landing once paired. */
function RaftBoat({ clip, spot, docked, selected, missed, still, onPress }: RaftBoatProps) {
  const status = useClipStatus(clip.id)
  const left = boatLeft(spot, docked && !still)
  return (
    <motion.button
      type="button"
      disabled={docked}
      aria-pressed={docked ? undefined : selected}
      data-paired={docked || undefined}
      data-side={spot.side}
      onClick={onPress}
      className="pointer-events-auto absolute top-0 left-0 cursor-pointer rounded-[40px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-default"
      style={{ width: BOAT.width, height: BOAT.height }}
      initial={false}
      animate={{ x: left, y: ROW[spot.row]! - (selected && !still ? 20 : 0) }}
      transition={still ? { duration: 0 } : { x: { duration: 0.9, ease: 'easeInOut' }, y: { type: 'spring', stiffness: 400, damping: 20 } }}
    >
      <svg viewBox="0 0 360 220" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <path d="M6 110 Q180 150 354 104 L310 210 Q180 228 50 210 Z" fill={docked ? 'var(--color-canal)' : 'var(--color-teak)'} {...ink} />
        <path d="M30 132 Q180 168 330 128" fill="none" stroke={docked ? 'var(--color-canal-deep)' : 'var(--color-teak-deep)'} strokeWidth={5} />
        {/* The bow ring a rope is tied to, towards the landing. */}
        <circle cx={spot.side === 'left' ? 344 : 16} cy="120" r="10" fill="none" {...ink} strokeWidth={5} />
      </svg>
      {/* The word on a bamboo board in the boat, with its leaf-cone speaker. */}
      <span
        className={`absolute top-[18px] left-[62px] flex h-[124px] w-[236px] items-center justify-center rounded-[22px] border-[5px] border-kon-ink text-[72px] leading-[1.3] font-bold ${selected ? 'bg-marigold' : 'bg-honey-light'}`}
      >
        {clip.text}
      </span>
      <SpeakerButton className={spot.side === 'left' ? 'top-[30px] left-[-6px] size-[72px]' : 'top-[30px] right-[-6px] size-[72px]'} playing={status === 'playing'} loading={status === 'loading'} />
      {docked && <Check aria-hidden="true" className="absolute -top-[16px] right-[40px] size-[60px] rounded-full border-4 border-kon-ink bg-canal p-[6px] text-card" strokeWidth={4} />}
      {missed > 0 && <X aria-hidden="true" className="absolute -top-[16px] right-[40px] size-[60px] rounded-full border-4 border-kon-ink bg-wrong p-[6px] text-card" strokeWidth={4} />}
      {docked && <span className="sr-only"> ผูกแพแล้ว</span>}
      {missed > 0 && <span className="sr-only"> ไม่ใช่คู่กัน</span>}
    </motion.button>
  )
}
