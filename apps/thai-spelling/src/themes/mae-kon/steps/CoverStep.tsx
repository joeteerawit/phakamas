import { Link } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toggleMusic } from '../../../audio/music'
import { useCover, type Cover } from '../../../steps/cover/useCover'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { useStageBleed } from '../../../ui/stage/Stage'

const loop = { repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const

/** Where น้องส้ม's boat stops, below the sign (stage px), and how far left she starts, off the window. */
const BOAT = { left: 760, top: 560, width: 400, height: 412 }
const PADDLE_IN_FROM = -1400

/**
 * แม่กน Step 1 (docs/mae-kon-spec.md), in stage pixels over the kon-cover Scene: the title carved on a long teak
 * boat-plank sign (300–1620 × 70–500), its ends lashed with coral rope, and น้องส้ม paddling her boat in from the
 * canal to stop below it. ▶ opens the Lesson. Under reduced motion she is already there and nothing moves.
 */
export function CoverStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const cover = useCover(lesson)
  const { poses } = useMascot()

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      <div
        data-testid="cover-sign"
        className="plank-sign absolute top-[70px] left-[300px] flex h-[430px] w-[1320px] flex-col items-center pt-[56px]"
      >
        <h2 className="relative font-heading text-[92px] leading-[1.4] font-bold whitespace-nowrap text-teak-deep [text-shadow:0_3px_0_var(--color-honey-light),0_-2px_0_rgb(43_29_18/0.45)]">
          {lesson.title}
        </h2>
        <p className="relative mt-[14px] flex h-[116px] items-center rounded-[26px] border-[6px] border-kon-ink bg-canal px-[48px]">
          <span className="font-heading text-[62px] leading-[1.2] font-bold whitespace-nowrap text-card">{lesson.subtitle}</span>
        </p>
        <p className="bamboo-label relative mt-[26px] flex h-[72px] items-center px-[40px] font-sans text-[34px] font-bold whitespace-nowrap text-kon-ink">
          {lesson.gradeLine}
        </p>
      </div>

      {/* She paddles in along the canal and stops below the sign, then rocks gently on the water. */}
      <motion.div
        data-testid="cover-mascot"
        className="absolute"
        style={{ left: BOAT.left, top: BOAT.top, width: BOAT.width, height: BOAT.height }}
        initial={still ? false : { x: PADDLE_IN_FROM }}
        animate={{ x: 0 }}
        transition={{ duration: 2.6, ease: 'easeOut' }}
      >
        <motion.img
          src={poses.cover}
          alt=""
          draggable={false}
          className="size-full object-contain select-none"
          animate={still ? undefined : { y: [0, -10], rotate: [-1.5, 1.5] }}
          transition={{ y: { duration: 1.9, ...loop }, rotate: { duration: 2.7, ...loop } }}
        />
      </motion.div>

      <CornerButtons cover={cover} />
    </section>
  )
}

/**
 * The cover's controls from the Kit, in the window's corners whatever its shape, at แม่กง's cover offsets: the plank
 * music button, เริ่มใหม่, and ▶ as a paddle that rocks gently; still under reduced motion.
 */
function CornerButtons({ cover }: { cover: Cover }) {
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const { Button, music, next } = useKit()
  const { lessonId, resumeStep, musicOn, restart, start } = cover

  return (
    <div className="absolute" style={{ inset: bleed.inset }}>
      <button
        type="button"
        aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
        aria-pressed={musicOn}
        onClick={toggleMusic}
        className={cx(pressable, 'absolute bottom-[32px] left-[40px] h-[139px] w-[135px]', music.className)}
      >
        <music.Art on={musicOn} />
      </button>

      {resumeStep && (
        <Button
          onClick={restart}
          className="absolute right-[248px] bottom-[32px] flex h-[136px] items-center gap-[16px] px-[56px] font-heading text-[52px] font-bold"
        >
          <RotateCcw aria-hidden="true" className="relative size-[56px]" strokeWidth={2.5} />
          <span className="relative">เริ่มใหม่</span>
        </Button>
      )}

      {/* ▶ paddles on into the Lesson. */}
      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId, step: String(resumeStep ?? 2) }}
        onClick={start}
        className={cx(pressable, 'absolute right-[32px] bottom-[24px] block size-[187px]', next.className)}
      >
        <span className="sr-only">{resumeStep ? `เรียนต่อ (ขั้น ${resumeStep})` : 'เริ่มเรียน'}</span>
        <motion.span
          data-testid="start-paddle"
          className="pointer-events-none block size-full"
          animate={still ? undefined : { rotate: [-5, 5] }}
          transition={{ duration: 1.1, ...loop }}
        >
          <next.Art />
        </motion.span>
      </Link>
    </div>
  )
}
