import type { ComponentProps } from 'react'
import { buttonClass, cx, type ButtonSize, type ButtonVariant } from './buttonClass'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Clay pill button. For navigation, style a router `Link` with `buttonClass` instead. */
export function Button({ variant = 'primary', size = 'md', type = 'button', className, ...props }: ButtonProps) {
  return <button type={type} className={cx(buttonClass(variant, size), className)} {...props} />
}
