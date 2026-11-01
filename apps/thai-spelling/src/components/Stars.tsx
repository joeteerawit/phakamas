import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { playClip } from '../audio/audioManager'
import type { AudioClip, Lesson } from '../lessons'
import type { ActivityId } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { activityStars, lessonStars } from '../session/stars'
import { MONKEY_SRC } from './Mascot'
import { popIn } from './motion/PopIn'

/** The Activity being celebrated; not persisted. */
const useCelebration = create<{ activityId: ActivityId | null }>(() => ({ activityId: null }))
/** An Activity Step calls this once its answers are checked (or all pairs matched). */
export const celebrate = (activityId: ActivityId) => useCelebration.setState({ activityId })
export const endCelebration = () => useCelebration.setState({ activityId: null })

const CELEBRATION_MS = 2500
const FLY_AT_MS = 1500
// Stage-pixel offset from the big Stars' centre (960, 480) to the Star counter's centre (550, 86).
const TO_COUNTER = { x: -410, y: -394 }

/** The stage chrome's Star counter: a small wooden pill (MASTER.md wood) next to the title sign. */
export function StarCounter({ lesson }: { lesson: Lesson }) {
  const results = useLessonSession((state) => state.session?.activities)
  const { total, max } = lessonStars(lesson, results)
  return (
    <p
      data-testid="star-counter"
      className="absolute top-[46px] left-[455px] flex h-[80px] items-center gap-[8px] rounded-full border-4 border-cream-border bg-wood px-[24px] font-heading text-[40px] font-bold text-on-wood shadow-[inset_0_-6px_0_rgb(0_0_0/0.2)]"
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
 */
export function Celebration({ lesson }: { lesson: Lesson }) {
  const activityId = useCelebration((state) => state.activityId)
  const stars = useLessonSession((state) => activityStars(activityId ? state.session?.activities[activityId] : undefined))
  return (
    <AnimatePresence>
      {activityId && <Burst key={activityId} stars={stars} clip={lesson.wordSelection.praise} />}
    </AnimatePresence>
  )
}

function Burst({ stars, clip }: { stars: number; clip: AudioClip }) {
  const still = useReducedMotion()
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
      className="absolute inset-0 z-40 cursor-pointer bg-navy/15"
      onClick={endCelebration}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!still && <Confetti />}
      <span className="sr-only">ได้ {stars} ดาว</span>
      <motion.div
        aria-hidden="true"
        className="absolute top-[330px] left-[460px] flex h-[300px] w-[1000px] items-center justify-center gap-[24px] text-[220px] leading-none drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]"
        animate={flying && !still ? { ...TO_COUNTER, scale: 0.15, opacity: 0 } : undefined}
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

/** The cover Mascot hopping in place; still under reduced motion. */
export function JumpingMascot({ className }: { className: string }) {
  const still = useReducedMotion()
  return (
    <motion.img
      src={MONKEY_SRC}
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
