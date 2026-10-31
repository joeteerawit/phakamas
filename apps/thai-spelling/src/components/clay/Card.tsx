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

type CardProps = ComponentProps<'div'> & {
  /** Background tint; dark text stays ≥4.5:1 on every tone. */
  tone?: CardTone
  /** Selected state: pink border. */
  selected?: boolean
  /** Audio playing state: blue glow. */
  playing?: boolean
}

/** White clay card: 24px radius, 3px border, clay shadow (MASTER.md). */
export function Card({ tone = 'white', selected = false, playing = false, className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-clay border-[3px] p-(--space-md) text-foreground shadow-clay',
        tones[tone],
        selected ? 'border-highlight' : 'border-border',
        playing && 'outline-4 outline-offset-2 outline-secondary/50',
        className,
      )}
      {...props}
    />
  )
}
