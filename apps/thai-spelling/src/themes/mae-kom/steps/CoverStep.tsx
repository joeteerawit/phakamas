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

const layer = 'pointer-events-none absolute select-none'

const loop = { repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const

/**
 * แม่กม Step 1 (docs/mae-kom-spec.md), in stage pixels over the kom-cover Scene: the title on a shop sign
 * hung near the top centre, its board (x 410–1510) centred on x = 960, and น้องส้ม floating on the wind to
 * its right. The sign drops in and she drifts on her umbrella; both still under reduced motion.
 */
export function CoverStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const cover = useCover(lesson)
  const { poses } = useMascot()

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      <motion.div
        data-testid="cover-sign"
        className="absolute inset-0"
        initial={still ? false : { y: -1080 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
      >
        <img src="/assets/comic/kom-shop-sign.webp" alt="" draggable={false} className={`${layer} top-[20px] left-[320px] w-[1200px]`} />
        <h2 className="absolute top-[362px] left-[450px] w-[1020px] text-center font-heading text-[84px] leading-[1.4] font-bold whitespace-nowrap text-navy">
          {lesson.title}
        </h2>
        <p className="absolute top-[492px] left-[740px] flex h-[124px] w-[440px] items-center justify-center rounded-full border-[8px] border-comic-ink bg-pill">
          <span className="font-heading text-[74px] leading-[1.2] font-bold whitespace-nowrap text-comic-red">{lesson.subtitle}</span>
        </p>
        <p className="absolute top-[634px] left-[640px] flex h-[70px] w-[640px] items-center justify-center rounded-full border-[5px] border-comic-ink bg-cover-cream font-sans text-[36px] font-bold whitespace-nowrap text-navy">
          {lesson.gradeLine}
        </p>
      </motion.div>

      {/* Drifts about the umbrella handle, as if the wind carries her. */}
      <motion.div
        data-testid="cover-mascot"
        className="absolute top-[150px] left-[1555px] h-[501px] w-[320px] origin-[225px_106px]"
        animate={still ? undefined : { x: [0, -36], y: [0, -28], rotate: [-4, 3] }}
        transition={{ x: { duration: 3.2, ...loop }, y: { duration: 2.2, ...loop }, rotate: { duration: 2.7, ...loop } }}
      >
        <img src={poses.cover} alt="" draggable={false} className={`${layer} inset-0 size-full`} />
      </motion.div>

      <CornerButtons cover={cover} />
    </section>
  )
}

/**
 * The cover's controls from the Kit, in the window's corners whatever its shape, at แม่กง's cover offsets: the music
 * ice block, เริ่มใหม่, and the ▶ as a street sign pointing on, which sways gently; still under reduced motion.
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
          className="absolute right-[248px] bottom-[32px] flex h-[136px] items-center gap-[16px] px-[44px] font-heading text-[52px] font-bold"
        >
          <RotateCcw aria-hidden="true" className="size-[56px]" strokeWidth={2.5} />
          เริ่มใหม่
        </Button>
      )}

      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId, step: String(resumeStep ?? 2) }}
        onClick={start}
        className={cx(pressable, 'absolute right-[32px] bottom-[24px] block size-[187px]', next.className)}
      >
        <span className="sr-only">{resumeStep ? `เรียนต่อ (ขั้น ${resumeStep})` : 'เริ่มเรียน'}</span>
        <motion.span
          data-testid="start-sign"
          className="pointer-events-none block size-full origin-bottom"
          animate={still ? undefined : { rotate: [-3, 3] }}
          transition={{ duration: 1.2, ...loop }}
        >
          <next.Art />
        </motion.span>
      </Link>
    </div>
  )
}
