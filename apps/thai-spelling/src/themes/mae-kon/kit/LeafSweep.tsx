import { motion } from 'motion/react'
import { useStageBleed } from '../../../ui/stage/Stage'

/** Until the two leaves meet and cover the window; the old Step leaves and the Scene changes underneath, unseen. */
export const LEAVES_COVER_MS = 340
/** The whole change: sweep in to meet, a short hold, then part back out to the sides onto the new Step. */
export const LEAVES_MS = 820
const HOLD_MS = 80

/** One banana leaf filling half the window: a broad green blade with its midrib along the inner edge and side veins. */
function Leaf({ side }: { side: 'left' | 'right' }) {
  const left = side === 'left'
  const times = [0, LEAVES_COVER_MS / LEAVES_MS, (LEAVES_COVER_MS + HOLD_MS) / LEAVES_MS, 1]
  const out = left ? '-105%' : '105%'
  return (
    <motion.div
      data-leaf={side}
      className="absolute inset-y-0 w-[56%]"
      style={{ [left ? 'left' : 'right']: 0 }}
      initial={{ x: out }}
      animate={{ x: [out, '0%', '0%', out] }}
      transition={{ duration: LEAVES_MS / 1000, times, ease: ['easeOut', 'linear', 'easeIn'] }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`size-full ${left ? '' : '-scale-x-100'}`}>
        <path d="M0 -4 H86 Q104 50 86 104 H0 Z" fill="var(--color-banana)" stroke="var(--color-kon-ink)" strokeWidth="0.8" />
        <path d="M0 -4 H80 Q96 50 80 104 H0 Z" fill="var(--color-banana-deep)" opacity="0.25" />
        {/* The midrib near the inner edge, and the parallel side veins running out to the outer edge. */}
        <path d="M84 -4 Q100 50 84 104" fill="none" stroke="var(--color-banana-light)" strokeWidth="1.6" />
        {Array.from({ length: 14 }, (_, i) => {
          const y = i * 8
          return <path key={i} d={`M${86 + Math.sin((y / 100) * Math.PI) * 10} ${y} L0 ${y + 6}`} stroke="var(--color-banana-light)" strokeWidth="0.5" opacity="0.7" />
        })}
      </svg>
    </motion.div>
  )
}

/**
 * Two banana leaves sweep in from the window's sides, meet in the middle to cover it while the Step behind changes,
 * then part back out to show the new Step. They never take a tap. The caller leaves them out under reduced motion,
 * where the Steps simply cross-fade.
 */
export function LeafSweep() {
  const bleed = useStageBleed()
  return (
    <div
      data-testid="step-leaves"
      aria-hidden="true"
      className="pointer-events-none absolute z-50 overflow-hidden"
      style={{ inset: `${-bleed.y}px ${-bleed.x}px` }}
    >
      <Leaf side="left" />
      <Leaf side="right" />
    </div>
  )
}
