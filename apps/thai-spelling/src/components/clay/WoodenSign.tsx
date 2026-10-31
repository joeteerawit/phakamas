import type { ReactNode } from 'react'

type WoodenSignProps = {
  children: ReactNode
  /** Heading level; a Step heading is the page's h1. */
  as?: 'h1' | 'h2'
}

/** Step heading on a wooden plank, Mali white text (MASTER.md). */
export function WoodenSign({ children, as: Heading = 'h1' }: WoodenSignProps) {
  return (
    <div className="relative mx-auto w-fit max-w-full">
      {/* Two ropes the plank hangs from. */}
      <span aria-hidden="true" className="absolute -top-5 left-[22%] h-7 w-1.5 rounded-full bg-wood" />
      <span aria-hidden="true" className="absolute right-[22%] -top-5 h-7 w-1.5 rounded-full bg-wood" />
      <div className="relative rounded-clay border-[3px] border-border bg-wood px-(--space-lg) py-(--space-sm) shadow-clay">
        {/* Nails. */}
        <span aria-hidden="true" className="absolute top-1/2 left-3 size-2 -translate-y-1/2 rounded-full bg-on-wood/40" />
        <span aria-hidden="true" className="absolute top-1/2 right-3 size-2 -translate-y-1/2 rounded-full bg-on-wood/40" />
        <Heading className="text-center font-heading text-heading font-bold text-on-wood lg:text-heading-lg">
          {children}
        </Heading>
      </div>
    </div>
  )
}
