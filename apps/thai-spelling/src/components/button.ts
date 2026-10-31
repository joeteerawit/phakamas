type ButtonVariant = 'primary' | 'secondary' | 'home'
type ButtonSize = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm ' +
  'transition-[transform,background-color] duration-150 active:scale-95 select-none ' +
  'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-sun text-ink hover:bg-sun-strong',
  secondary: 'bg-white text-ink ring-2 ring-leaf-strong/40 hover:bg-leaf-soft',
  home: 'bg-leaf text-ink hover:bg-leaf-strong hover:text-white',
}

const sizes: Record<ButtonSize, string> = {
  // min-h-12 = 48px (spec §6: buttons at least 48px tall).
  md: 'min-h-12 min-w-12 px-5 py-2 text-lg',
  lg: 'min-h-16 px-10 py-3 text-2xl sm:text-3xl',
}

/** Class names for pill buttons and button-styled links. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md') {
  return `${base} ${variants[variant]} ${sizes[size]}`
}
