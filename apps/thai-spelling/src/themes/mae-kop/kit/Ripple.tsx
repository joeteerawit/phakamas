import { motion } from 'motion/react'
import { useStageBleed } from '../../../ui/stage/Stage'

/** Until the ripple covers the window; the old Step leaves and the Scene changes underneath, unseen. */
export const RIPPLE_COVER_MS = 320
/** The whole change: spread out to cover, a short hold, then clear onto the new Step. */
export const RIPPLE_MS = 780
const HOLD_MS = 80
/** Wide enough to cover any window from the stage centre (stage px). */
const SIZE = 4200

/**
 * A ripple spreading out from the centre of the window to cover it: a teal disc ringed by pale rings, as when a drop
 * falls on the pond. It covers the window while the Step behind changes, then fades to show the new Step. It never
 * takes a tap. The caller leaves it out under reduced motion, where the Steps simply cross-fade.
 */
export function Ripple() {
  const bleed = useStageBleed()
  const times = [0, RIPPLE_COVER_MS / RIPPLE_MS, (RIPPLE_COVER_MS + HOLD_MS) / RIPPLE_MS, 1]
  return (
    <div
      data-testid="step-ripple"
      aria-hidden="true"
      className="pointer-events-none absolute z-50 overflow-hidden"
      style={{ inset: `${-bleed.y}px ${-bleed.x}px` }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: SIZE,
          height: SIZE,
          marginLeft: -SIZE / 2,
          marginTop: -SIZE / 2,
          background:
            'repeating-radial-gradient(circle, var(--color-pond) 0 120px, var(--color-pond-light) 120px 136px, var(--color-pond) 136px 260px)',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1, 1, 1.1], opacity: [1, 1, 1, 0] }}
        transition={{ duration: RIPPLE_MS / 1000, times, ease: ['easeOut', 'linear', 'easeIn'] }}
      />
    </div>
  )
}
