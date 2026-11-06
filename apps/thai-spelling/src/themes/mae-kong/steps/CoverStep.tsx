import { motion, useReducedMotion } from 'motion/react'
import { CoverDecor } from '../scenes/CoverDecor'
import { useCover } from '../../../steps/cover/useCover'
import type { StepProps } from '../../../steps/stepProps'
import { CoverButtons } from '../../../ui/CoverButtons'
import { useMascot } from '../../../ui/mascotContext'

/** Cover layers split from the design's cover image (docs/canva-assets.md, #19). */
const COVER = '/assets/comic'

const layer = 'pointer-events-none absolute select-none'

const loop = { repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const

/**
 * Step 1, design DAHZj0Nxyxs page 1, in stage pixels (cover image 1672×941 scaled ×1.148).
 * The sign drops in and swings, the vine sways, the Mascot swings on it and ▶ pulses; all still under reduced motion.
 */
export function CoverStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const cover = useCover(lesson)
  const { poses } = useMascot()

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      <CoverDecor />

      <motion.div
        data-testid="cover-sign"
        className="absolute inset-0 origin-[960px_0px]"
        initial={still ? false : { y: -1080, rotate: 6 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{
          y: { type: 'spring', stiffness: 140, damping: 14 },
          rotate: { type: 'spring', stiffness: 50, damping: 3, delay: 0.4 },
        }}
      >
        {/* Ropes and vine run on above the stage for windows taller than 16:9. */}
        <div className={`${layer} bottom-[939px] left-[538px] h-[800px] w-[56px] bg-[url(/assets/comic/cover-rope.webp)] bg-size-[56px_36px] bg-bottom`} />
        <div className={`${layer} bottom-[939px] left-[1324px] h-[800px] w-[56px] bg-[url(/assets/comic/cover-rope.webp)] bg-size-[56px_36px] bg-bottom`} />
        <img src={`${COVER}/cover-sign.webp`} alt="" draggable={false} className={`${layer} top-[140px] left-[400px] w-[1120px]`} />
        <h2 className="absolute top-[345px] left-[400px] w-[1120px] text-center font-heading text-[84px] leading-[1.4] font-bold whitespace-nowrap text-navy">
          {lesson.title}
        </h2>
        <p className="absolute top-[480px] left-[740px] flex h-[124px] w-[440px] items-center justify-center rounded-full border-[8px] border-comic-ink bg-pill">
          <span className="font-heading text-[74px] leading-[1.2] font-bold whitespace-nowrap text-comic-red">{lesson.subtitle}</span>
        </p>
        <p className="absolute top-[625px] left-[640px] flex h-[70px] w-[640px] items-center justify-center rounded-full border-[5px] border-comic-ink bg-cover-cream font-sans text-[36px] font-bold whitespace-nowrap text-navy">
          {lesson.gradeLine}
        </p>
      </motion.div>

      {/* Pendulum about the top of the vine. */}
      <motion.div
        data-testid="cover-mascot"
        className="absolute top-0 left-[40px] h-[720px] w-[413px] origin-[170px_0px]"
        animate={still ? undefined : { rotate: [-3, 3] }}
        transition={{ duration: 1.5, ...loop }}
      >
        <div className={`${layer} bottom-[719px] left-[147px] h-[800px] w-[49px] bg-[url(/assets/comic/mascot-vine.webp)] bg-size-[49px_17px] bg-bottom`} />
        <img src={poses.cover} alt="" draggable={false} className={`${layer} inset-0 size-full`} />
      </motion.div>

      <CoverButtons cover={cover} />
    </section>
  )
}
