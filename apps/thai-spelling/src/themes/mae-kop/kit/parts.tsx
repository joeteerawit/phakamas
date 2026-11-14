import { Check, Music, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useMascot } from '../../../ui/mascotContext'
import { useStageBleed } from '../../../ui/stage/Stage'

// Inked outlines in the rain-slate of the แม่กบ palette.
const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const art = 'pointer-events-none size-full select-none overflow-visible'

/**
 * แม่กบ's button, a glossy raincoat-yellow vinyl pill (`vinyl-button` in styles.css). Place it with `relative` or
 * `absolute` and size it at the call site. Same press feedback rules as every button: focus ring, disabled look.
 */
export function VinylButton({ type = 'button', className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cx(
        'vinyl-button pointer-events-auto cursor-pointer select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/** Home: a small teal vinyl hut on stilts, a drip running off its roof. */
export function HutArt() {
  return (
    <svg data-art="hut" aria-hidden="true" viewBox="0 0 146 150" className={art}>
      <path d="M38 120 V144 M108 120 V144" {...ink} strokeWidth={8} />
      <path d="M14 144 Q73 132 132 144" fill="none" stroke="var(--color-pond-light)" strokeWidth={6} strokeLinecap="round" />
      <rect x="28" y="66" width="90" height="58" rx="8" fill="var(--color-pond)" {...ink} />
      <path d="M73 12 L4 72 Q73 60 142 72 Z" fill="var(--color-raincoat)" {...ink} />
      <path d="M20 66 Q73 54 126 66" fill="none" stroke="var(--color-raincoat-deep)" strokeWidth={4} strokeDasharray="7 6" />
      <rect x="62" y="86" width="24" height="38" rx="10" fill="var(--color-pond-deep)" {...ink} strokeWidth={4} />
      <circle cx="44" cy="90" r="9" fill="var(--color-raincoat-light)" {...ink} strokeWidth={4} />
      {/* The drip off the eave. */}
      <path d="M134 74 Q141 88 134 94 Q127 88 134 74 Z" fill="var(--color-pond-light)" {...ink} strokeWidth={3.5} />
    </svg>
  )
}

/** Back and Next: a slate-grey rubber boot whose toe points the way, a tread on its sole. */
function Boot({ back = false }: { back?: boolean }) {
  return (
    <svg data-art="boot" aria-hidden="true" viewBox="0 0 146 150" className={cx(art, back && '-scale-x-100')}>
      <path d="M28 14 H76 V86 Q120 86 136 108 Q140 128 120 130 H28 Z" fill="var(--color-rubber)" {...ink} />
      <path d="M24 12 H80 V30 H24 Z" fill="var(--color-raincoat)" {...ink} />
      <path d="M34 40 Q50 36 66 40" fill="none" stroke="rgb(255 255 255 / 0.55)" strokeWidth={6} strokeLinecap="round" />
      {/* The sole and its tread. */}
      <path d="M22 128 H124 Q140 128 140 138 Q140 146 124 146 H22 Z" fill="var(--color-rubber-deep)" {...ink} />
      <path d="M38 132 V142 M58 132 V142 M78 132 V142 M98 132 V142 M116 132 V142" stroke="var(--color-rubber)" strokeWidth={5} strokeLinecap="round" />
    </svg>
  )
}

export const BackBoot = () => <Boot back />
export const NextBoot = () => <Boot />

/** The music on/off pill's note; struck through in red while the music is off. */
export function MusicNote({ on }: { on: boolean }) {
  return (
    <>
      <Music aria-hidden="true" className="relative size-16" strokeWidth={2.5} />
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

/** The Step title on a teal vinyl tag with yellow stitching, hung from a peg. */
export function VinylTag({ children }: { children: ReactNode }) {
  return (
    <div className="absolute top-[29px] left-[47px] flex h-[115px] w-[382px] items-center justify-center rounded-[22px_22px_44px_44px] border-[5px] border-pond-deep bg-pond px-[30px] font-heading text-[38px] leading-[1.4] font-bold text-card shadow-[inset_0_0_0_7px_var(--color-pond),inset_0_0_0_10px_var(--color-raincoat),0_8px_0_rgb(10_87_84/0.45)]">
      {children}
    </div>
  )
}

/** The speaker: a snail on a pebble, its spiral shell the speaker; ripple rings spread round it while it plays. */
export function SnailSpeaker({ playing, loading }: { playing: boolean; loading: boolean }) {
  return (
    <>
      {playing && (
        <svg
          data-testid="sound-waves"
          aria-hidden="true"
          viewBox="0 0 120 110"
          className="pointer-events-none absolute inset-0 size-full overflow-visible fill-none stroke-pond stroke-[4]"
        >
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx="60"
              cy="96"
              rx={44 + i * 14}
              ry={10 + i * 4}
              className="animate-sound-wave motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
      )}
      <svg
        data-art="snail"
        aria-hidden="true"
        viewBox="0 0 120 110"
        className={cx('pointer-events-none relative size-full overflow-visible', loading && 'motion-safe:animate-pulse')}
      >
        <ellipse cx="60" cy="96" rx="54" ry="13" fill="var(--color-rubber)" {...ink} />
        <path d="M14 88 Q20 66 44 72 H96 Q110 72 112 58 L116 40" fill="var(--color-raincoat-light)" {...ink} />
        <path d="M104 52 L100 30 M112 54 L118 34" {...ink} strokeWidth={4} />
        <circle cx="100" cy="28" r="5" fill="var(--color-rubber-deep)" />
        <circle cx="118" cy="32" r="5" fill="var(--color-rubber-deep)" />
        <circle cx="54" cy="52" r="34" fill="var(--color-raincoat)" {...ink} />
        <path d="M54 52 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 1 1 9 9 a15 15 0 1 1 -15 -15 a22 22 0 1 1 22 22" fill="none" {...ink} strokeWidth={4} />
      </svg>
    </>
  )
}

// A raindrop in a -50..50 box, with a four-point star glint.
const DROP = 'M0 -48 C14 -24 38 0 38 20 C38 40 20 50 0 50 C-20 50 -38 40 -38 20 C-38 0 -14 -24 0 -48 Z'
const GLINT = 'M-10 4 L-6 14 L4 18 L-6 22 L-10 32 L-14 22 L-24 18 L-14 14 Z'

/** One Star of the Stars display: a raincoat-yellow raindrop with a star glint, 1em across. */
export function RaindropStar() {
  return (
    <svg data-art="raindrop-star" aria-hidden="true" viewBox="-50 -50 100 100" className="inline-block size-[1em] overflow-visible align-[-0.14em]">
      <path d={DROP} fill="var(--color-raincoat)" {...ink} strokeWidth={6} />
      <path d={GLINT} fill="var(--color-card)" />
    </svg>
  )
}

/** Inside น้องกบ's drop-shaped bubble: a ✓/✗ badge and the message; its pointed tail points to her puddle on the left. */
export function DropBubbleContent({ feedback, text }: { feedback: Feedback; text: ReactNode }) {
  const right = feedback.kind === 'correct'
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 34 40" className="pointer-events-none absolute top-1/2 -left-[31px] h-[40px] w-[34px] -translate-y-1/2 overflow-visible">
        <path d="M34 4 Q10 14 2 20 Q10 26 34 36" fill="var(--color-raincoat-light)" stroke="var(--color-pond-deep)" strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <span
        aria-hidden="true"
        className={cx(
          'flex size-[60px] shrink-0 items-center justify-center rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-4 border-pond-deep text-on-primary',
          right ? 'bg-correct' : 'bg-wrong',
        )}
      >
        {right ? <Check className="size-[38px]" strokeWidth={3.5} /> : <X className="size-[38px]" strokeWidth={3.5} />}
      </span>
      <p className={cx('min-w-0 font-heading text-[46px] leading-[1.35] font-bold text-balance', right ? 'text-correct' : 'text-wrong')}>{text}</p>
    </>
  )
}

// Where she pops up, in stage px: level with a top bubble (146–286), or for a bottom bubble higher up the edge
// (330–570), as the Back button holds the bottom-left corner. Her puddle is the box's bottom edge.
const POP = {
  top: { top: 146, height: 140, width: 110, art: 150, left: -6 },
  bottom: { top: 330, height: 240, width: 190, art: 250, left: -10 },
}

/**
 * น้องกบ popping up from a puddle at the window's left edge while her bubble shows, with a ring of splash: cheering a
 * right answer, a thumbs up otherwise, clear of the corner buttons. Under reduced motion she is simply there.
 */
export function PuddleMascot({ feedback, placement }: { feedback: Feedback; placement: 'top' | 'bottom' }) {
  const pop = POP[placement]
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const { poses } = useMascot()
  return (
    <motion.div
      data-testid="feedback-mascot"
      aria-hidden="true"
      className="pointer-events-none absolute z-30 overflow-hidden"
      style={{ left: -bleed.x, top: pop.top, width: pop.width, height: pop.height }}
      exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.img
        src={feedback.kind === 'correct' ? poses.cheer : poses.encourage}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{ left: pop.left, top: 6, height: pop.art }}
        initial={still ? false : { y: pop.height }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      />
      {/* The puddle she stands in, and the splash ring as she comes up. */}
      <span className="absolute inset-x-0 bottom-0 h-[26px] rounded-[50%] border-[4px] border-pond-deep bg-pond" />
      {!still && (
        <motion.span
          data-testid="feedback-splash"
          className="absolute inset-x-[6px] bottom-[2px] h-[22px] rounded-[50%] border-[4px] border-pond-light"
          initial={{ scale: 0.4, opacity: 1 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}
