import { cx } from './clay/buttonClass'

/** Microsoft Fluent Emoji 3D "Monkey" (MIT), see public/assets/images/characters/. */
export const MASCOT_SRC = '/assets/images/characters/monkey_3d.png'
export const MASCOT_NAME = 'น้องลิง'
/** The comic Mascot greeting (docs/comic-art.md). */
export const MONKEY_SRC = '/assets/comic/mascot-greet.webp'
/** The comic Mascot jumping for joy, for celebrations. */
export const MONKEY_CHEER_SRC = '/assets/comic/mascot-cheer.webp'

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

/** น้องลิง, the Mascot that guides the student through every Step. */
export function Mascot({ size = 'md', decorative = false, className }: MascotProps) {
  return (
    <img
      src={MASCOT_SRC}
      alt={decorative ? '' : MASCOT_NAME}
      width={256}
      height={256}
      draggable={false}
      className={cx('pointer-events-none select-none object-contain', sizes[size], className)}
    />
  )
}
