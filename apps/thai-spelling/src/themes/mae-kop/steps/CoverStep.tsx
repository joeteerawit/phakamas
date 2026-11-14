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

/**
 * แม่กบ Step 1 (docs/mae-kop-spec.md), in stage pixels over the kop-cover Scene: the title on a glossy raincoat-yellow
 * vinyl panel (380–1460 × 130–690) with its snap buttons and stitching, and น้องกบ in her cover pose on her lily pad
 * to its right. The panel drops in and she bobs gently on the water; both still under reduced motion.
 */
export function CoverStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const cover = useCover(lesson)
  const { poses } = useMascot()

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      <motion.div
        data-testid="cover-panel"
        className="vinyl-panel absolute top-[130px] left-[380px] flex h-[560px] w-[1080px] flex-col items-center rounded-[64px] border-[8px] border-pond-deep pt-[96px] shadow-[0_14px_0_rgb(10_87_84/0.5)]"
        initial={still ? false : { y: -900 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 15 }}
      >
        <h2 className="relative font-heading text-[104px] leading-[1.4] font-bold whitespace-nowrap text-rubber-deep">{lesson.title}</h2>
        <p className="relative mt-[20px] flex h-[124px] items-center rounded-full border-[6px] border-pond-deep bg-pond px-[48px]">
          <span className="font-heading text-[64px] leading-[1.2] font-bold whitespace-nowrap text-card">{lesson.subtitle}</span>
        </p>
        <p className="drop-label relative mt-[34px] flex h-[76px] items-center px-[40px] font-sans text-[36px] font-bold whitespace-nowrap text-pond-deep">
          {lesson.gradeLine}
        </p>
      </motion.div>

      {/* She bobs on her lily pad as the rain falls round her. */}
      <motion.img
        data-testid="cover-mascot"
        src={poses.cover}
        alt=""
        draggable={false}
        className="absolute top-[230px] left-[1490px] h-[500px] w-[400px] select-none"
        animate={still ? undefined : { y: [0, -14], rotate: [-1.5, 1.5] }}
        transition={{ y: { duration: 1.8, ...loop }, rotate: { duration: 2.6, ...loop } }}
      />

      <CornerButtons cover={cover} />
    </section>
  )
}

/**
 * The cover's controls from the Kit, in the window's corners whatever its shape, at แม่กง's cover offsets: the vinyl
 * music pill, เริ่มใหม่, and the ▶ as a rubber boot stepping off, which rocks gently; still under reduced motion.
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
          <RotateCcw aria-hidden="true" className="relative size-[56px]" strokeWidth={2.5} />
          <span className="relative">เริ่มใหม่</span>
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
          data-testid="start-boot"
          className="pointer-events-none block size-full origin-bottom"
          animate={still ? undefined : { rotate: [-4, 4] }}
          transition={{ duration: 1.1, ...loop }}
        >
          <next.Art />
        </motion.span>
      </Link>
    </div>
  )
}
