export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg' | 'bar'

/** Joins class names, skipping empty values. */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Stage-scale press feedback shared by Canva buttons: scale down 150 ms, 8px focus ring.
 * pointer-events-auto so it also works inside a data-full-stage Step (whose layer ignores the pointer).
 */
export const pressable =
  'pointer-events-auto cursor-pointer select-none transition-transform duration-150 ease-out active:scale-95 motion-reduce:transition-none ' +
  'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40'

/** The Canva cream word card: 4px dashed brown border, rounded as on design page 2. */
export const creamCard = 'rounded-[40px] border-4 border-dashed border-cream-border bg-cream'

/** The Canva orange 3D pill (Step 10 เรียนอีกครั้ง): place and size it at the call site. */
export const orangeButton =
  `${pressable} flex h-[124px] items-center justify-center gap-[16px] rounded-full border-[6px] border-card bg-orange px-[40px] ` +
  'font-heading text-[48px] font-bold whitespace-nowrap text-white shadow-orange-button active:translate-y-[6px] active:shadow-orange-button-pressed'

// MASTER.md Button: pill, 3px border, clay shadow, press = translateY(4px) +
// pressed shadow in 150ms, visible 3px focus ring.
const base =
  'inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-(--space-sm) ' +
  'rounded-full border-[3px] border-border font-sans font-semibold whitespace-nowrap shadow-clay ' +
  'transition-[transform,box-shadow] duration-150 ease-out ' +
  'active:translate-y-1 active:shadow-clay-pressed motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  // Main actions: เริ่มเรียน, ถัดไป, ตรวจคำตอบ.
  primary: 'bg-primary text-on-primary',
  // Speaker / listen actions.
  secondary: 'bg-secondary text-on-secondary',
  // Low-emphasis actions such as ย้อนกลับ.
  ghost: 'bg-card text-foreground',
}

const sizes: Record<ButtonSize, string> = {
  // 56px min height (MASTER.md), 48px is the absolute floor.
  md: 'min-h-14 px-(--space-md) text-button',
  lg: 'min-h-16 px-(--space-xl) text-body-lg',
  // Back/Next bar: fills a half-width column on phones, natural width on desktop.
  bar: 'min-h-14 w-full px-(--space-sm) text-button lg:w-auto lg:px-(--space-md)',
}

/** Class names for clay pill buttons and button-styled links. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return cx(base, variants[variant], sizes[size])
}

