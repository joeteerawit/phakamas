import { motion } from 'motion/react'
import { useStageBleed } from '../../../ui/stage/Stage'

/** Until the soil covers the window; the old Step leaves and the Scene changes underneath, unseen. */
export const HOE_COVER_MS = 380
/** The whole change: sweep in to cover, a short hold, then sweep on out the far side onto the new Step. */
export const HOE_MS = 860
const HOLD_MS = 80

/**
 * One pass of a hoe across the window: a band of turned soil, furrowed, pushed by the hoe's blade at its leading edge,
 * sweeps in from the side the student came from until it covers the window, then on out the far side to show the
 * new Step. It never takes a tap. The caller leaves it out under reduced motion, where the Steps simply cross-fade.
 */
export function HoeSweep({ direction }: { direction: number }) {
  const bleed = useStageBleed()
  const times = [0, HOE_COVER_MS / HOE_MS, (HOE_COVER_MS + HOLD_MS) / HOE_MS, 1]
  const from = direction >= 0 ? '-115%' : '115%'
  const to = direction >= 0 ? '115%' : '-115%'
  return (
    <div
      data-testid="step-hoe"
      aria-hidden="true"
      className="pointer-events-none absolute z-50 overflow-hidden"
      style={{ inset: `${-bleed.y}px ${-bleed.x}px` }}
    >
      <motion.div
        className="absolute inset-y-0 -left-[3%] w-[106%]"
        initial={{ x: from }}
        animate={{ x: [from, '0%', '0%', to] }}
        transition={{ duration: HOE_MS / 1000, times, ease: ['easeOut', 'linear', 'easeIn'] }}
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,var(--color-soil)_0_70px,#5a361c_70px_84px,var(--color-soil)_84px_150px)]" />
        {/* The hoe's blade and handle at the band's leading edge. */}
        <svg
          viewBox="0 0 160 400"
          preserveAspectRatio="none"
          className={`absolute top-0 h-full w-[160px] ${direction >= 0 ? '-right-[120px]' : '-left-[120px] -scale-x-100'}`}
        >
          <path d="M20 0 V400" stroke="var(--color-soil-deep)" strokeWidth={36} />
          <path d="M20 0 V400" stroke="var(--color-terracotta)" strokeWidth={22} />
          <path d="M44 120 L140 150 L140 250 L44 280 Z" fill="#9aa4ad" stroke="var(--color-soil-deep)" strokeWidth={8} strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  )
}
