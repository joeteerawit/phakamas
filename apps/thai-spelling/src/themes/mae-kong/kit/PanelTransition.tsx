import { motion } from 'motion/react'
import { useStageBleed } from '../../../ui/stage/Stage'

/** Steps whose entry or exit turns a comic panel instead of sliding (#36): the comic-art cover and Step 5. */
export const PANEL_STEPS: ReadonlySet<number> = new Set([1, 5])
/** Until the panel covers the window. The old Step leaves and the scene changes underneath, unseen. */
export const PANEL_COVER_MS = 260
/** The whole sweep: in to cover, a short hold, then on out the far side. */
export const PANEL_MS = 640
const HOLD_MS = 80
/** Stage px each slanted edge leans over. */
const SLANT = 260
const slanted = `polygon(${SLANT}px 0, 100% 0, calc(100% - ${SLANT}px) 100%, 0 100%)`

/**
 * A comic panel sweeping across the whole window in the travel direction: a white gutter, an ink frame and a
 * yellow halftone panel with slanted edges. It covers the window while the Step behind it changes, then moves on
 * to reveal the new Step. It never takes a tap, so the new Step works as soon as any of it shows.
 * The caller leaves it out under reduced motion.
 */
export function PanelTransition({ direction }: { direction: number }) {
  const bleed = useStageBleed()
  const from = `${direction * 100}%`
  return (
    <div
      data-testid="panel-transition"
      aria-hidden="true"
      className="pointer-events-none absolute z-50 overflow-hidden"
      style={{ inset: `${-bleed.y}px ${-bleed.x}px` }}
    >
      <motion.div
        data-panel
        className="absolute inset-y-0"
        style={{ left: -SLANT, width: `calc(100% + ${2 * SLANT}px)` }}
        initial={{ x: from }}
        animate={{ x: [from, '0%', '0%', `${-direction * 100}%`] }}
        transition={{
          duration: PANEL_MS / 1000,
          times: [0, PANEL_COVER_MS / PANEL_MS, (PANEL_COVER_MS + HOLD_MS) / PANEL_MS, 1],
          ease: ['easeOut', 'linear', 'easeIn'],
        }}
      >
        {/* Mirrored going back, so the leading edge leans the same way as the travel. */}
        <div className={`absolute inset-0 ${direction < 0 ? '-scale-x-100' : ''}`}>
          <div className="absolute inset-0 bg-card" style={{ clipPath: slanted }} />
          <div className="absolute inset-y-0 right-[24px] left-[24px] bg-comic-ink" style={{ clipPath: slanted }} />
          <div
            className="absolute inset-y-0 right-[44px] left-[44px] bg-pill"
            style={{
              clipPath: slanted,
              backgroundImage:
                'radial-gradient(circle, rgb(17 17 17 / 0.16) 22%, transparent 25%), ' +
                'repeating-conic-gradient(from 0deg at 50% 50%, rgb(255 255 255 / 0.45) 0deg 5deg, transparent 5deg 15deg)',
              backgroundSize: '34px 34px, 100% 100%',
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
