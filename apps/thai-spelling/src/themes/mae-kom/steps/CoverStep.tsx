import { motion, useReducedMotion } from 'motion/react'
import { useCover } from '../../../steps/cover/useCover'
import type { StepProps } from '../../../steps/stepProps'
import { CoverButtons } from '../../../ui/CoverButtons'
import { useMascot } from '../../../ui/mascotContext'

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

      <CoverButtons cover={cover} />
    </section>
  )
}
