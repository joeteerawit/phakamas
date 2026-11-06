import { cx } from './clay/buttonClass'
import { useMascot } from './mascotContext'

type MascotSize = 'sm' | 'md' | 'lg'

const sizes: Record<MascotSize, string> = {
  sm: 'size-20',
  md: 'size-28',
  lg: 'size-40 sm:size-48 lg:size-56',
}

type MascotProps = {
  size?: MascotSize
  /** Hide from assistive tech when a parent already names the Mascot. */
  decorative?: boolean
  className?: string
}

/** The Lesson's Mascot, which guides the student through every Step, greeting. */
export function Mascot({ size = 'md', decorative = false, className }: MascotProps) {
  const { name, poses } = useMascot()
  return (
    <img
      src={poses.greet}
      alt={decorative ? '' : name}
      width={514}
      height={600}
      draggable={false}
      className={cx('pointer-events-none select-none object-contain', sizes[size], className)}
    />
  )
}
