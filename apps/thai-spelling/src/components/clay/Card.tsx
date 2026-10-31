import type { ComponentProps } from 'react'
import { cx } from './buttonClass'

export type CardTone = 'white' | 'yellow' | 'pink' | 'sky' | 'mint' | 'lilac' | 'peach'

const tones: Record<CardTone, string> = {
  white: 'bg-card',
  yellow: 'bg-tint-yellow',
  pink: 'bg-tint-pink',
  sky: 'bg-tint-sky',
  mint: 'bg-tint-mint',
  lilac: 'bg-tint-lilac',
  peach: 'bg-tint-peach',
}

/** Cycles bright tints so neighbouring cards differ (e.g. by index). */
export const toneAt = (i: number): CardTone =>
  (['yellow', 'pink', 'sky', 'mint', 'lilac', 'peach'] as const)[i % 6] ?? 'yellow'

type CardLook = {
  /** Background tint; dark text stays ≥4.5:1 on every tone. */
  tone?: CardTone
  /** Selected state: pink border. */
  selected?: boolean
  /** Audio playing state: blue glow. */
  playing?: boolean
  /** Marked wrong after a check: red border (pair it with a ✗ icon and text). */
  wrong?: boolean
}

/** Class names for a clay card, also for card-shaped buttons. */
export function cardClass({ tone = 'white', selected = false, playing = false, wrong = false }: CardLook = {}) {
  return cx(
    'rounded-clay border-[3px] p-(--space-md) text-foreground shadow-clay',
    tones[tone],
    wrong ? 'border-wrong' : selected ? 'border-highlight' : 'border-border',
    playing && 'outline-4 outline-offset-2 outline-secondary/50',
  )
}

/** White clay card: 24px radius, 3px border, clay shadow (MASTER.md). */
export function Card({ tone, selected, playing, className, ...props }: ComponentProps<'div'> & CardLook) {
  return <div className={cx(cardClass({ tone, selected, playing }), className)} {...props} />
}
