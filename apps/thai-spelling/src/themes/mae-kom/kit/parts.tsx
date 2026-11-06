import { Check, Music, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useMascot } from '../../../ui/mascotContext'
import { useStageBleed } from '../../../ui/stage/Stage'

// Comic ink lines, as in the แม่กม art.
const ink = { stroke: 'var(--color-comic-ink)', strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const art = 'pointer-events-none size-full select-none overflow-visible'

/**
 * แม่กม's button, a rounded ice block with a snow cap (`ice-block` in styles.css). Place it with `relative` or
 * `absolute` and size it at the call site. Same press feedback rules as every button: focus ring, disabled look.
 */
export function IceButton({ type = 'button', className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cx(
        'ice-block pointer-events-auto cursor-pointer select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/** Home: a small house with a snowy roof, its window lit. */
export function HouseArt() {
  return (
    <svg data-art="house" aria-hidden="true" viewBox="0 0 146 150" className={art}>
      <rect x="92" y="22" width="20" height="36" fill="var(--color-tint-lilac)" {...ink} />
      <rect x="26" y="70" width="94" height="72" rx="6" fill="var(--color-orange)" {...ink} />
      <path d="M73 14 L6 80 H140 Z" fill="var(--color-banner)" {...ink} />
      {/* Snow on the roof and the chimney, with drips over the eaves. */}
      <path
        d="M73 8 C60 16 30 44 8 70 C4 80 14 84 20 78 C26 86 34 84 36 76 C46 82 54 78 56 70 L73 40 L90 70 C92 78 100 82 110 76 C112 84 120 86 126 78 C132 84 142 80 138 70 C116 44 86 16 73 8 Z"
        fill="var(--color-card)"
        {...ink}
      />
      <path d="M88 18 Q102 8 116 18 Q112 26 102 24 Q94 26 88 18 Z" fill="var(--color-card)" {...ink} />
      <rect x="40" y="92" width="30" height="26" rx="4" fill="var(--color-sun)" {...ink} />
      <path d="M55 92 V118 M40 105 H70" {...ink} strokeWidth={4} />
      <rect x="82" y="96" width="26" height="46" rx="12" fill="var(--color-navy)" {...ink} />
      <circle cx="101" cy="122" r="3" fill="var(--color-sun)" />
    </svg>
  )
}

/** Back and Next: an arrow-shaped blue street direction sign on a short pole, snow along its top. */
function StreetArrow({ back = false }: { back?: boolean }) {
  return (
    <svg data-art="street-sign" aria-hidden="true" viewBox="0 0 146 150" className={cx(art, back && '-scale-x-100')}>
      <rect x="58" y="88" width="18" height="62" fill="var(--color-ice-deep)" {...ink} />
      <path d="M8 36 H96 V18 L140 60 L96 102 V84 H8 Z" fill="var(--color-sign-blue)" {...ink} />
      <path d="M18 46 H104 V40 L124 60 L104 80 V74 H18 Z" fill="none" stroke="var(--color-card)" strokeWidth={4} strokeLinejoin="round" />
      {/* A white chevron on the enamel. */}
      <path d="M50 46 L66 60 L50 74 M70 46 L86 60 L70 74" fill="none" stroke="var(--color-card)" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4 38 C6 26 20 24 28 30 C34 22 48 22 54 30 C62 24 74 24 80 32 C86 24 98 22 100 30 C98 38 90 40 84 36 C80 42 70 44 64 38 C58 46 44 44 40 38 C34 44 22 44 18 40 C12 46 2 46 4 38 Z"
        fill="var(--color-card)"
        {...ink}
        strokeWidth={4}
      />
    </svg>
  )
}

export const BackSign = () => <StreetArrow back />
export const NextSign = () => <StreetArrow />

/** The music on/off ice block's note; struck through in red while the music is off. */
export function MusicNote({ on }: { on: boolean }) {
  return (
    <>
      <Music aria-hidden="true" className="size-16" strokeWidth={2.5} />
      {!on && (
        <span
          data-testid="music-off"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[12px] w-[96px] -translate-1/2 -rotate-45 rounded-full border-[3px] border-card bg-final"
        />
      )}
    </>
  )
}

/** The Step title on a blue enamel street-name sign with a white rim and snow on top. */
export function StreetNameSign({ children }: { children: ReactNode }) {
  return (
    <div className="absolute top-[29px] left-[47px] flex h-[115px] w-[382px] items-center justify-center rounded-[18px] border-[5px] border-comic-ink bg-sign-blue px-[30px] font-heading text-[38px] leading-[1.4] font-bold text-card shadow-[inset_0_0_0_6px_var(--color-sign-blue),inset_0_0_0_10px_var(--color-card),0_8px_0_rgb(24_0_173/0.3)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-[18px] left-[24px] h-[30px] w-[300px] rounded-[999px_999px_20px_20px] border-[5px] border-comic-ink bg-card"
      />
      {children}
    </div>
  )
}

/** The speaker: a red vintage radio with a round grille, a dial and two knobs; sound waves beside it while it plays. */
export function RadioSpeaker({ playing, loading }: { playing: boolean; loading: boolean }) {
  return (
    <>
      <svg
        data-art="radio"
        aria-hidden="true"
        viewBox="0 0 120 110"
        className={cx('pointer-events-none relative size-full overflow-visible', loading && 'motion-safe:animate-pulse')}
      >
        <path d="M30 26 V16 Q30 6 40 6 H80 Q90 6 90 16 V26" fill="none" {...ink} strokeWidth={6} />
        <rect x="6" y="24" width="108" height="78" rx="18" fill="var(--color-comic-red)" {...ink} />
        <path d="M14 30 Q60 18 106 30 Q106 38 96 36 Q60 28 24 36 Q14 38 14 30 Z" fill="var(--color-card)" {...ink} strokeWidth={4} />
        <circle cx="42" cy="66" r="25" fill="var(--color-cream)" {...ink} />
        <path d="M24 56 H60 M20 66 H64 M24 76 H60" {...ink} strokeWidth={4} />
        <rect x="74" y="46" width="30" height="22" rx="4" fill="var(--color-cover-cream)" {...ink} strokeWidth={4} />
        <path d="M79 52 V56 M85 52 V56 M91 52 V56 M97 52 V56 M88 64 L94 50" {...ink} strokeWidth={2.5} />
        <circle cx="81" cy="84" r="7" fill="var(--color-cream)" {...ink} strokeWidth={4} />
        <circle cx="99" cy="84" r="7" fill="var(--color-cream)" {...ink} strokeWidth={4} />
      </svg>
      {playing && (
        <svg
          data-testid="sound-waves"
          aria-hidden="true"
          viewBox="0 0 20 56"
          className="pointer-events-none absolute top-1/2 left-[96%] aspect-[20/56] h-[70%] -translate-y-1/2 fill-none stroke-sign-blue stroke-[4]"
          strokeLinecap="round"
        >
          {['M2 22a8 8 0 0 1 0 12', 'M6 16a16 16 0 0 1 0 24', 'M10 10a24 24 0 0 1 0 36'].map((d, i) => (
            <path key={d} d={d} className="animate-sound-wave motion-reduce:animate-none" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </svg>
      )}
    </>
  )
}

// A five-point star in a -50..50 box.
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 21 : 48
  const a = (i * Math.PI) / 5 - Math.PI / 2
  return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r + 4).toFixed(1)}`
}).join(' ')
const FLAKE = [0, 60, 120]
  .map((deg) => {
    const a = (deg * Math.PI) / 180
    const at = (r: number, turn = 0) => `${(Math.cos(a + turn) * r).toFixed(1)} ${(Math.sin(a + turn) * r + 4).toFixed(1)}`
    return `M${at(-17)} L${at(17)} M${at(11)} L${at(17, 0.5)} M${at(11)} L${at(17, -0.5)} M${at(-11)} L${at(-17, 0.5)} M${at(-11)} L${at(-17, -0.5)}`
  })
  .join(' ')

/** One Star of the Stars display: an ice star with a snowflake in it, 1em across. */
export function SnowflakeStar() {
  return (
    <svg data-art="snowflake-star" aria-hidden="true" viewBox="-50 -50 100 100" className="inline-block size-[1em] overflow-visible align-[-0.14em]">
      <polygon points={STAR} fill="var(--color-ice)" {...ink} strokeWidth={6} />
      <path d={FLAKE} fill="none" stroke="var(--color-sign-blue)" strokeWidth={5} strokeLinecap="round" />
    </svg>
  )
}

/** Inside น้องส้ม's speech bubble: a ✓/✗ badge and the message; its tail points to her at the window's left edge. */
export function BubbleContent({ feedback, text }: { feedback: Feedback; text: ReactNode }) {
  const right = feedback.kind === 'correct'
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 30 40" className="pointer-events-none absolute top-1/2 -left-[31px] h-[40px] w-[34px] -translate-y-1/2 overflow-visible">
        <path d="M30 4 L2 20 L30 36" fill="var(--color-card)" stroke="var(--color-comic-ink)" strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <span
        aria-hidden="true"
        className={cx(
          'flex size-[60px] shrink-0 items-center justify-center rounded-[20px] border-4 border-comic-ink text-on-primary',
          right ? 'bg-correct' : 'bg-wrong',
        )}
      >
        {right ? <Check className="size-[38px]" strokeWidth={3.5} /> : <X className="size-[38px]" strokeWidth={3.5} />}
      </span>
      <p className={cx('min-w-0 font-heading text-[46px] leading-[1.35] font-bold text-balance', right ? 'text-correct' : 'text-wrong')}>{text}</p>
    </>
  )
}

// Where she peeks in, in stage px: level with a top bubble (146–286, above and left of the cards it clears), or for
// a bottom bubble higher up the edge (330–570), as the Back button holds the bottom-left corner.
const PEEK = {
  top: { top: 146, height: 140, width: 100, art: 260, left: -70 },
  bottom: { top: 330, height: 240, width: 190, art: 400, left: -80 },
}

/**
 * น้องส้ม peeking in at the window's left edge while her bubble shows: cheering a right answer, a thumbs up
 * otherwise, clear of the corner buttons. She slides in from the edge, or simply appears under reduced motion.
 */
export function PeekingMascot({ feedback, placement }: { feedback: Feedback; placement: 'top' | 'bottom' }) {
  const peek = PEEK[placement]
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const { poses } = useMascot()
  // Her head and coat show above the cut; the rest of her stays past the window's edge.
  return (
    <motion.div
      data-testid="feedback-mascot"
      className="pointer-events-none absolute z-30 overflow-hidden"
      style={{ left: -bleed.x, top: peek.top, width: peek.width, height: peek.height }}
      initial={still ? false : { x: -peek.width }}
      animate={{ x: 0 }}
      exit={still ? { opacity: 0, transition: { duration: 0 } } : { x: -peek.width, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <img
        src={feedback.kind === 'correct' ? poses.cheer : poses.encourage}
        alt=""
        draggable={false}
        className="absolute top-0 max-w-none select-none"
        style={{ left: peek.left, height: peek.art }}
      />
    </motion.div>
  )
}
