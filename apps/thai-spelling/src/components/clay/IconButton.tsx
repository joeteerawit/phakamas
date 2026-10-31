import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cx, iconButtonClass, type ButtonVariant } from './buttonClass'

type IconButtonProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  icon: LucideIcon
  /** Thai accessible name; required because the button has no visible text. */
  label: string
  variant?: ButtonVariant
}

/** Round clay button holding one Lucide icon. */
export function IconButton({ icon: Icon, label, variant = 'ghost', type = 'button', className, ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cx(iconButtonClass(variant), className)} {...props}>
      <Icon aria-hidden="true" className="size-7" strokeWidth={2.5} />
    </button>
  )
}
