import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type RefObject } from 'react'
import { create } from 'zustand'
import { playClip } from '../audio/audioManager'
import type { AudioClip, Lesson } from '../lessons'
import type { ActivityId } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { activityStars, lessonStars } from '../session/stars'
import { MONKEY_CHEER_SRC, MONKEY_ENCOURAGE_SRC } from './Mascot'
import { popIn } from './motion/PopIn'
import { useStageBleed } from './stage/Stage'

/** The Activity being celebrated, whether that check got full marks, and a count of checks; not persisted. */
const useCelebration = create<{ activityId: ActivityId | null; fullMarks: boolean; round: number }>(() => ({
  activityId: null,
  fullMarks: false,
  round: 0,
}))
/** An Activity Step calls this once its answers are checked (or all pairs matched). */
export const celebrate = (activityId: ActivityId, fullMarks = false) =>
  useCelebration.setState(({ round }) => ({ activityId, fullMarks, round: round + 1 }))
export const endCelebration = () => useCelebration.setState({ activityId: null })

const CELEBRATION_MS = 2500
const FLY_AT_MS = 1500
// Stage-pixel offset from the big Stars' centre (960, 480) to the Star counter's centre (550, 86).
const TO_COUNTER = { x: -410, y: -394 }

/** The stage chrome's Star counter: a small wooden pill (MASTER.md wood) in ink, next to the title sign. */
export function StarCounter({ lesson }: { lesson: Lesson }) {
  const results = useLessonSession((state) => state.session?.activities)
  const { total, max } = lessonStars(lesson, results)
  return (
    <p
      data-testid="star-counter"
      className="absolute top-[46px] left-[455px] flex h-[80px] items-center gap-[8px] rounded-full border-[5px] border-comic-ink bg-wood px-[24px] font-heading text-[40px] font-bold text-on-wood shadow-comic"
    >
      <span className="sr-only">ดาวที่ได้</span>
      <span aria-hidden="true">⭐</span>
      {total}/{max}
    </p>
  )
}

/**
 * Celebration after an Activity is checked: confetti, the earned Stars pop in and fly to the counter,
 * the Mascot jumps and เก่งมาก! plays. Tap or 2.5 s dismisses. Reduced motion: Stars only, static.
 * Step 5 (#35) has its own game-like feedback instead, see `CheckFeedback`; `shakeTarget` is what its full marks shake.
 */
export function Celebration({ lesson, shakeTarget }: { lesson: Lesson; shakeTarget: RefObject<HTMLElement | null> }) {
  const { activityId, fullMarks, round } = useCelebration()
  const stars = useLessonSession((state) => activityStars(activityId ? state.session?.activities[activityId] : undefined))
  const clip = lesson.wordSelection.praise
  return (
    <AnimatePresence>
      {activityId === 'wordSelection' ? (
        <CheckFeedback key={round} fullMarks={fullMarks} stars={stars} clip={clip} shakeTarget={shakeTarget} />
      ) : (
        activityId && <Burst key={activityId} stars={stars} clip={clip} />
      )}
    </AnimatePresence>
  )
}

// Step 5: the Stars sit under the burst's เก่งมาก!, their centre at (960, 610) stage px; the Star counter's is (550, 86).
const STEP5_STARS = { x: 960, y: 610 }
const STEP5_TO_COUNTER = { x: 550 - STEP5_STARS.x, y: 86 - STEP5_STARS.y }
const SHAKE_PX = [0, -18, 18, -14, 14, -8, 8, 0]

/**
 * Step 5's check feedback (#35). Full marks: a comic เก่งมาก! burst in live text, a brief shake of the Step,
 * confetti, the Stars flying to their counter and the Mascot jumping for joy. Below full marks only the
 * Mascot's thumbs up shows, beside the score toast. The Mascot stays in the stage's left margin, clear of the
 * cards and both buttons, and nothing here takes a tap. Reduced motion: no shake, flight or confetti.
 */
function CheckFeedback({
  fullMarks,
  stars,
  clip,
  shakeTarget,
}: {
  fullMarks: boolean
  stars: number
  clip: AudioClip
  shakeTarget: RefObject<HTMLElement | null>
}) {
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const [flying, setFlying] = useState(false)
  useEffect(() => {
    playClip(clip)
    const fly = setTimeout(() => setFlying(true), FLY_AT_MS)
    const end = setTimeout(endCelebration, CELEBRATION_MS)
    return () => {
      clearTimeout(fly)
      clearTimeout(end)
    }
  }, [clip])
  useEffect(() => {
    const target = shakeTarget.current
    if (!fullMarks || still || !target) return
    const shake = animate(target, { x: SHAKE_PX }, { duration: 0.45, ease: 'easeOut' })
    return () => {
      shake.stop()
      target.style.transform = ''
    }
  }, [fullMarks, still, shakeTarget])

  return (
    <motion.div
      data-testid={fullMarks ? 'celebration' : undefined}
      className="pointer-events-none absolute inset-0 z-40"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {fullMarks && (
        <>
          {!still && <Confetti />}
          <span className="sr-only">ได้ {stars} ดาว</span>
          <ComicBurst />
          <motion.div
            data-testid="celebration-stars"
            aria-hidden="true"
            className="absolute flex h-[160px] w-[800px] -translate-1/2 items-center justify-center gap-[16px] text-[128px] leading-none drop-shadow-[6px_8px_0_var(--color-comic-ink)]"
            style={{ left: STEP5_STARS.x, top: STEP5_STARS.y }}
            animate={flying && !still ? { x: STEP5_TO_COUNTER.x - bleed.x, y: STEP5_TO_COUNTER.y - bleed.y, scale: 0.15, opacity: 0 } : undefined}
            transition={{ duration: 0.6, ease: 'easeIn' }}
          >
            {Array.from({ length: stars }, (_, i) => (
              <motion.span key={i} {...popIn(i + 2, !!still)}>
                ⭐
              </motion.span>
            ))}
          </motion.div>
        </>
      )}
      <ReactionMascot pose={fullMarks ? 'cheer' : 'encourage'} />
    </motion.div>
  )
}

// A jagged comic burst in a -100..100 box: alternating long and short spikes.
const burstPoints = (spikes: number, outer: number, inner: number) =>
  Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer * (i % 4 ? 0.92 : 1)
    const a = (i * Math.PI) / spikes - Math.PI / 2
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r * 0.62).toFixed(1)}`
  }).join(' ')
const BURST_OUTER = burstPoints(14, 100, 74)
const BURST_INNER = burstPoints(14, 82, 62)

/** The full-marks comic burst: inked red and yellow spikes behind เก่งมาก! in the heading font, as live text. */
function ComicBurst() {
  const still = useReducedMotion()
  return (
    <motion.div
      data-testid="comic-burst"
      className="absolute top-[180px] left-[460px] flex h-[500px] w-[1000px] items-start justify-center pt-[118px]"
      initial={still ? false : { scale: 0.2, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -4, opacity: 1 }}
      transition={still ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 14 }}
    >
      <svg aria-hidden="true" viewBox="-100 -62 200 124" className="absolute inset-0 size-full overflow-visible">
        <polygon points={BURST_OUTER} fill="var(--color-comic-red)" stroke="var(--color-comic-ink)" strokeWidth={3} strokeLinejoin="round" />
        <polygon points={BURST_INNER} fill="var(--color-pill)" stroke="var(--color-comic-ink)" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      <p className="relative font-heading text-[150px] leading-[1.3] font-bold whitespace-nowrap text-comic-red text-inked">เก่งมาก!</p>
    </motion.div>
  )
}

/**
 * The Mascot reacting to a Step 5 check, in the stage's left margin: left of the card columns (278) and the
 * ตรวจคำตอบ button (240), above the Back button. It pops in from its feet, so it never leaves this box.
 */
function ReactionMascot({ pose }: { pose: 'cheer' | 'encourage' }) {
  const still = useReducedMotion()
  return (
    <motion.div
      data-testid="mascot-reaction"
      data-pose={pose}
      // Bottom 880; the cheer pose is shorter so its 90 px jump stays as high as the thumbs up.
      className={`absolute left-[16px] w-[220px] origin-bottom ${pose === 'cheer' ? 'top-[621px] h-[259px]' : 'top-[598px] h-[282px]'}`}
      initial={still ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 16 }}
    >
      {pose === 'cheer' ? (
        <JumpingMascot className="inset-0 size-full" />
      ) : (
        <motion.img
          src={MONKEY_ENCOURAGE_SRC}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full origin-bottom object-contain select-none"
          animate={still ? undefined : { rotate: [0, -6, 5, -3, 0] }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  )
}

function Burst({ stars, clip }: { stars: number; clip: AudioClip }) {
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const [flying, setFlying] = useState(false)
  useEffect(() => {
    playClip(clip)
    const fly = setTimeout(() => setFlying(true), FLY_AT_MS)
    const end = setTimeout(endCelebration, CELEBRATION_MS)
    return () => {
      clearTimeout(fly)
      clearTimeout(end)
    }
  }, [clip])

  return (
    <motion.div
      data-testid="celebration"
      className="absolute inset-0 z-40 cursor-pointer"
      onClick={endCelebration}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Tint and tap target reach the window's edges. */}
      <div className="absolute bg-navy/15" style={{ inset: `${-bleed.y}px ${-bleed.x}px` }} />
      {!still && <Confetti />}
      <span className="sr-only">ได้ {stars} ดาว</span>
      <motion.div
        aria-hidden="true"
        className="absolute top-[330px] left-[460px] flex h-[300px] w-[1000px] items-center justify-center gap-[24px] text-[220px] leading-none drop-shadow-[8px_10px_0_var(--color-comic-ink)]"
        animate={flying && !still ? { x: TO_COUNTER.x - bleed.x, y: TO_COUNTER.y - bleed.y, scale: 0.15, opacity: 0 } : undefined}
        transition={{ duration: 0.6, ease: 'easeIn' }}
      >
        {Array.from({ length: stars }, (_, i) => (
          <motion.span
            key={i}
            {...popIn(i, !!still)}
          >
            ⭐
          </motion.span>
        ))}
      </motion.div>
      <JumpingMascot className="top-[520px] left-[80px] h-[480px] w-[507px]" />
    </motion.div>
  )
}

/** The cheering Mascot hopping in place; still under reduced motion. */
export function JumpingMascot({ className }: { className: string }) {
  const still = useReducedMotion()
  return (
    <motion.img
      src={MONKEY_CHEER_SRC}
      alt=""
      draggable={false}
      className={`pointer-events-none absolute select-none object-contain ${className}`}
      animate={still ? undefined : { y: [0, -90, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2, ease: 'easeOut' }}
    />
  )
}

const CONFETTI_COLOURS = ['#ff3131', '#ffde59', '#5ce1e6', '#7ed957', '#ff66c4', '#8c52ff', '#ff914d']
const CONFETTI_PIECES = 48

/** Paper confetti falling over the whole stage; `loop` keeps it falling. Callers skip it under reduced motion. */
export function Confetti({ loop = false }: { loop?: boolean }) {
  return (
    <div data-testid="confetti" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: CONFETTI_PIECES }, (_, i) => {
        // Spread pieces evenly but out of order, so neighbours differ in colour, size and timing.
        const left = ((i * 389) % 1920) + 20
        const drift = ((i * 73) % 240) - 120
        return (
          <motion.span
            key={i}
            className="absolute top-[-60px] block rounded-[4px]"
            style={{
              left,
              width: 18 + (i % 3) * 8,
              height: 28 + (i % 4) * 6,
              backgroundColor: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
            }}
            initial={{ y: 0, x: 0, rotate: 0 }}
            animate={{ y: 1200, x: drift, rotate: (i % 2 ? 1 : -1) * 540 }}
            transition={{
              duration: 1.8 + (i % 5) * 0.25,
              delay: (i % 8) * 0.08 + (loop ? (i % 6) * 0.4 : 0),
              ease: 'easeIn',
              repeat: loop ? Infinity : 0,
            }}
          />
        )
      })}
    </div>
  )
}
