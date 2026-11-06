import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps } from 'react'

/** Gap between cards popping in (ticket #18: 60–80 ms). */
const STAGGER_SECONDS = 0.07

/**
 * Motion props for the `index`-th card of a Step: a springy pop in order, or a plain fade with
 * reduced motion. Spread onto any `motion.*` element: `<motion.li {...popIn(i, reduce)}>`.
 */
export function popIn(index: number, reduceMotion: boolean) {
  const delay = index * STAGGER_SECONDS
  if (reduceMotion) {
    return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay } }
  }
  return {
    initial: { opacity: 0, scale: 0.6, y: 24 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 18, delay },
  }
}

/** A `motion.div` that pops in as the `index`-th card of its Step (see `popIn`). */
export function PopIn({ index, ...props }: { index: number } & ComponentProps<typeof motion.div>) {
  const reduceMotion = useReducedMotion() ?? false
  return <motion.div {...popIn(index, reduceMotion)} {...props} />
}
