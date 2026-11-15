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
 * แม่กก Step 1 (docs/mae-kok-spec.md), in stage pixels over the kok-cover Scene: the title on a big kraft seed-packet
 * signboard (440–1480 × 120–660) staked into the terrace on two wooden stakes, and น้องนก in her cover pose gliding
 * over the terraces to its right. The signboard drops in and she glides gently to and fro; both still under reduced
 * motion. The corner buttons come from the Kit.
 */
export function CoverStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const cover = useCover(lesson)
  const { poses } = useMascot()

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      <motion.div
        data-testid="cover-sign"
        className="absolute top-[120px] left-[440px] h-[640px] w-[1040px]"
        initial={still ? false : { y: -900 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 15 }}
      >
        {/* The two stakes it stands on, driven into the terrace. */}
        {[200, 800].map((x) => (
          <span key={x} aria-hidden="true" className="absolute top-[480px] h-[160px] w-[40px] rounded-b-[12px] border-[5px] border-soil-deep bg-plank" style={{ left: x }} />
        ))}
        <div data-testid="cover-panel" className="seed-packet absolute inset-x-0 top-0 flex h-[540px] flex-col items-center pt-[80px]">
          <h2 className="relative font-heading text-[74px] leading-[1.4] font-bold whitespace-nowrap text-soil-deep">{lesson.title}</h2>
          <p className="relative mt-[24px] flex h-[124px] items-center rounded-[20px_20px_44px_44px] border-[6px] border-soil-deep bg-terracotta px-[48px]">
            <span className="font-heading text-[64px] leading-[1.2] font-bold whitespace-nowrap text-kraft-light">{lesson.subtitle}</span>
          </p>
          <p className="kraft-label relative mt-[34px] flex h-[76px] items-center px-[40px] font-sans text-[36px] font-bold whitespace-nowrap text-soil-deep">
            {lesson.gradeLine}
          </p>
        </div>
      </motion.div>

      {/* She glides over the terraces, to and fro on the breeze. */}
      <motion.img
        data-testid="cover-mascot"
        src={poses.cover}
        alt=""
        draggable={false}
        className="absolute top-[200px] left-[1510px] h-[440px] w-[380px] object-contain select-none"
        animate={still ? undefined : { x: [-24, 18], y: [0, -26], rotate: [-3, 3] }}
        transition={{ x: { duration: 4.2, ...loop }, y: { duration: 2.1, ...loop }, rotate: { duration: 3.1, ...loop } }}
      />

      <CornerButtons cover={cover} />
    </section>
  )
}

/**
 * The cover's controls from the Kit, in the window's corners whatever its shape, at แม่กง's cover offsets: the pot
 * music button, เริ่มใหม่, and the ▶ as a plant-marker stake pointing on, which rocks gently; still under reduced motion.
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
          data-testid="start-stake"
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
