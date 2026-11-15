import { motion, useReducedMotion } from 'motion/react'
import { ink } from '../kit/ink'

/**
 * A market stall-keeper in a งอบ, standing behind her stall, drawn in a 0..200 × 0..300 box. `waving` raises her
 * hand and waves it; under reduced motion the hand is simply up. Decorative.
 */
export function StallKeeper({ waving, className, shirt = 'var(--color-canal)' }: { waving: boolean; className?: string; shirt?: string }) {
  const still = useReducedMotion()
  return (
    <svg data-testid="stall-keeper" data-waving={waving || undefined} aria-hidden="true" viewBox="0 0 200 300" className={`pointer-events-none overflow-visible ${className ?? ''}`}>
      <path d="M40 300 V170 Q100 140 160 170 V300 Z" fill={shirt} {...ink} />
      <path d="M44 190 Q20 240 40 280" fill="none" stroke="var(--color-kon-ink)" strokeWidth={30} strokeLinecap="round" />
      <path d="M44 190 Q20 240 40 280" fill="none" stroke="#f2c48d" strokeWidth={18} strokeLinecap="round" />
      {/* The waving arm, from the shoulder: down at her side, or up and waving. */}
      <motion.g
        data-testid="stall-keeper-arm"
        style={{ transformBox: 'view-box', transformOrigin: '156px 186px' }}
        initial={false}
        animate={waving ? (still ? { rotate: -150 } : { rotate: [-140, -170, -140] }) : { rotate: 0 }}
        transition={waving && !still ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      >
        <path d="M156 186 Q180 236 162 280" fill="none" stroke="var(--color-kon-ink)" strokeWidth={30} strokeLinecap="round" />
        <path d="M156 186 Q180 236 162 280" fill="none" stroke="#f2c48d" strokeWidth={18} strokeLinecap="round" />
      </motion.g>
      <circle cx="100" cy="120" r="46" fill="#f2c48d" {...ink} />
      <circle cx="84" cy="118" r="5" fill="var(--color-kon-ink)" />
      <circle cx="116" cy="118" r="5" fill="var(--color-kon-ink)" />
      <path d="M84 138 Q100 152 116 138" fill="none" {...ink} strokeWidth={4} />
      {/* Her งอบ. */}
      <ellipse cx="100" cy="86" rx="74" ry="16" fill="var(--color-bamboo)" {...ink} />
      <path d="M48 84 Q56 34 100 26 Q144 34 152 84 Q100 96 48 84 Z" fill="var(--color-bamboo)" {...ink} />
      <path d="M70 80 Q80 48 100 32 M130 80 Q120 48 100 32" fill="none" stroke="var(--color-bamboo-deep)" strokeWidth={3} />
    </svg>
  )
}
