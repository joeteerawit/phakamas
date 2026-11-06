import { motion } from 'motion/react'
import { useStageBleed } from '../../../ui/stage/Stage'

/** Until the flurry covers the window; the old Step leaves and the Scene changes underneath, unseen. */
export const FLURRY_COVER_MS = 300
/** The whole wipe: in to cover, a short hold, then on out the far side. */
export const FLURRY_MS = 760
const HOLD_MS = 80
/** Stage px of soft, puffy snow past each side of the solid middle. */
const EDGE = 220
// Flakes scattered over the band, in % of its box, spread evenly but out of order.
const FLAKES = Array.from({ length: 40 }, (_, i) => ({ left: (i * 37) % 100, top: (i * 61) % 100, size: 18 + (i % 4) * 10 }))

/**
 * A snow flurry wiping across the whole window in the travel direction: a solid wall of snow between two puffy
 * edges, with flakes over it. It covers the window while the Step behind it changes, then blows on to reveal the
 * new Step. It never takes a tap. The caller leaves it out under reduced motion.
 */
export function SnowFlurry({ direction }: { direction: number }) {
  const bleed = useStageBleed()
  const from = `${direction * 100}%`
  const puffs = (side: 'left' | 'right') =>
    `radial-gradient(circle at ${side === 'left' ? '100%' : '0'} 50%, var(--color-card) 62%, var(--color-ice) 66%, transparent 68%) 0 0 / ${EDGE}px 150px repeat-y`
  return (
    <div
      data-testid="step-flurry"
      aria-hidden="true"
      className="pointer-events-none absolute z-50 overflow-hidden"
      style={{ inset: `${-bleed.y}px ${-bleed.x}px` }}
    >
      <motion.div
        className="absolute inset-y-0"
        style={{ left: -EDGE, width: `calc(100% + ${2 * EDGE}px)` }}
        initial={{ x: from }}
        animate={{ x: [from, '0%', '0%', `${-direction * 100}%`] }}
        transition={{
          duration: FLURRY_MS / 1000,
          times: [0, FLURRY_COVER_MS / FLURRY_MS, (FLURRY_COVER_MS + HOLD_MS) / FLURRY_MS, 1],
          ease: ['easeOut', 'linear', 'easeIn'],
        }}
      >
        <div className="absolute inset-y-0 left-0" style={{ width: EDGE, background: puffs('left') }} />
        <div
          className="absolute inset-y-0 bg-linear-to-b from-card via-frost to-ice"
          style={{ left: EDGE, right: EDGE }}
        />
        <div className="absolute inset-y-0 right-0" style={{ width: EDGE, background: puffs('right') }} />
        {FLAKES.map(({ left, top, size }, i) => (
          <span
            key={i}
            className="absolute rounded-full border-[3px] border-ice-deep bg-card"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
          />
        ))}
      </motion.div>
    </div>
  )
}
