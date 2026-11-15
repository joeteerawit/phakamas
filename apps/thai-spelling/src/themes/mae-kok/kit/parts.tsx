import { Check, Music, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useMascot } from '../../../ui/mascotContext'
import { useStageBleed } from '../../../ui/stage/Stage'
import { ink, RISE } from './ink'

const art = 'pointer-events-none size-full select-none overflow-visible'

/**
 * แม่กก's button, a matte terracotta flowerpot with a rolled rim (`pot-button` in styles.css); `data-main` makes it
 * the main one, which sprouts a leaf. Place it with `relative` or `absolute` and size it at the call site. Same press
 * feedback rules as every button: focus ring, disabled look.
 */
export function PotButton({ type = 'button', className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cx(
        'pot-button pointer-events-auto cursor-pointer select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/** Home: a wooden birdhouse on its post, a round door and a perch. */
export function BirdhouseArt() {
  return (
    <svg data-art="birdhouse" aria-hidden="true" viewBox="0 0 146 150" className={art}>
      <path d="M73 112 V148" {...ink} strokeWidth={14} />
      <path d="M73 112 V148" stroke="var(--color-plank)" strokeWidth={6} strokeLinecap="round" />
      <path d="M26 56 H120 V116 H26 Z" fill="var(--color-plank)" {...ink} />
      <path d="M36 70 H110 M36 86 H110 M36 102 H110" stroke="#8c5c2c" strokeWidth={3} />
      <path d="M73 8 L4 62 H142 Z" fill="var(--color-terracotta)" {...ink} />
      <path d="M30 50 L73 18 L116 50" fill="none" stroke="var(--color-terracotta-light)" strokeWidth={4} strokeLinecap="round" />
      <circle cx="73" cy="82" r="15" fill="var(--color-soil-deep)" {...ink} strokeWidth={4} />
      <path d="M60 104 H86" {...ink} strokeWidth={7} />
      {/* A leaf growing up its post. */}
      <path d="M73 136 Q96 128 102 112 Q80 114 73 136 Z" fill="var(--color-sprout)" {...ink} strokeWidth={3.5} />
    </svg>
  )
}

/** Back and Next: a wooden plant-marker stake leaning the way it goes, a chevron burned into its head. */
function Stake({ back = false }: { back?: boolean }) {
  return (
    <svg data-art="stake" aria-hidden="true" viewBox="0 0 146 150" className={cx(art, back && '-scale-x-100')}>
      <g transform="rotate(12 73 140)">
        <path d="M58 70 H88 V128 L73 148 L58 128 Z" fill="var(--color-plank)" {...ink} />
        <rect x="18" y="12" width="110" height="68" rx="14" fill="var(--color-kraft)" {...ink} />
        <path d="M58 26 L84 46 L58 66" fill="none" stroke="var(--color-soil-deep)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M58 26 L84 46 L58 66" fill="none" stroke="#5a3418" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M30 146 Q73 134 120 146" fill="none" stroke="var(--color-soil)" strokeWidth={8} strokeLinecap="round" />
    </svg>
  )
}

export const BackStake = () => <Stake back />
export const NextStake = () => <Stake />

/** The music on/off pot's note; struck through in red while the music is off. */
export function MusicNote({ on }: { on: boolean }) {
  return (
    <>
      <Music aria-hidden="true" className="relative mt-[14px] size-16" strokeWidth={2.5} />
      {!on && (
        <span
          data-testid="music-off"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[12px] w-[96px] -translate-1/2 -rotate-45 rounded-full border-[3px] border-kraft-light bg-final"
        />
      )}
    </>
  )
}

/** The Step title on a wooden garden signboard, a kraft label pinned on it. */
export function GardenSign({ children }: { children: ReactNode }) {
  return (
    <div
      data-art="garden-sign"
      className="absolute top-[29px] left-[47px] flex h-[115px] w-[382px] items-center justify-center rounded-[14px] border-[5px] border-soil-deep bg-[repeating-linear-gradient(180deg,var(--color-plank)_0_26px,#8c5c2c_26px_29px)] px-[12px] shadow-[0_8px_0_rgb(58_34_16/0.45)]"
    >
      <span className="flex h-[84px] w-full items-center justify-center rounded-[10px] border-[4px] border-soil bg-kraft-light px-[8px] font-heading text-[38px] leading-[1.4] font-bold text-soil-deep">
        {children}
      </span>
    </div>
  )
}

/** The speaker: a terracotta pot lying on its side like a horn; sound lines come out of its mouth while it plays. */
export function PotHorn({ playing, loading }: { playing: boolean; loading: boolean }) {
  return (
    <>
      {playing && (
        <svg
          data-testid="sound-waves"
          aria-hidden="true"
          viewBox="0 0 120 110"
          className="pointer-events-none absolute inset-0 size-full overflow-visible fill-none stroke-sprout-deep stroke-[6]"
          strokeLinecap="round"
        >
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${104 + i * 12} ${34 - i * 8} Q${116 + i * 14} 56 ${104 + i * 12} ${78 + i * 8}`}
              className="animate-sound-wave motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
      )}
      <svg
        data-art="pot-horn"
        aria-hidden="true"
        viewBox="0 0 120 110"
        className={cx('pointer-events-none relative size-full overflow-visible', loading && 'motion-safe:animate-pulse')}
      >
        <ellipse cx="60" cy="100" rx="52" ry="9" fill="var(--color-soil)" opacity={0.5} />
        {/* The pot's body narrows to its base at the left; its open mouth faces right. */}
        <path d="M12 42 L84 18 V94 L12 70 Z" fill="var(--color-terracotta)" {...ink} />
        <path d="M24 46 L76 30" stroke="var(--color-terracotta-light)" strokeWidth={5} strokeLinecap="round" />
        <rect x="78" y="10" width="22" height="92" rx="9" fill="#c45f34" {...ink} />
        <ellipse cx="100" cy="56" rx="8" ry="40" fill="var(--color-soil-deep)" {...ink} strokeWidth={4} />
        <path d="M8 40 V72" {...ink} strokeWidth={7} />
      </svg>
    </>
  )
}

// A five-point star in a -50..50 box, and the sprout growing from its top point.
const STAR = 'M0 -40 L11 -12 L42 -12 L17 6 L26 36 L0 18 L-26 36 L-17 6 L-42 -12 L-11 -12 Z'
const SPROUT = 'M0 -40 Q-2 -52 -14 -56 Q-8 -44 0 -40 Z M0 -40 Q4 -54 18 -54 Q10 -42 0 -40 Z'

/** One Star of the Stars display: a terracotta seed-star with a sprout on top, 1em across. */
export function SeedStar() {
  return (
    <svg data-art="seed-star" aria-hidden="true" viewBox="-50 -50 100 100" className="inline-block size-[1em] overflow-visible align-[-0.14em]">
      <path d={SPROUT} fill="var(--color-sprout)" {...ink} strokeWidth={4} />
      <path d={STAR} fill="var(--color-terracotta)" {...ink} strokeWidth={6} />
      <ellipse cx="-8" cy="-6" rx="7" ry="4" fill="var(--color-terracotta-light)" />
    </svg>
  )
}

/** Inside the kraft leaf bubble: a ✓/✗ badge and the message; its stem points down to น้องนก's stake on the left. */
export function LeafBubbleContent({ feedback, text }: { feedback: Feedback; text: ReactNode }) {
  const right = feedback.kind === 'correct'
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 40 30" className="pointer-events-none absolute -bottom-[26px] left-[30px] h-[30px] w-[40px] overflow-visible">
        <path d="M4 0 Q8 18 2 28 Q20 16 34 0" fill="var(--color-kraft-light)" stroke="var(--color-sprout-deep)" strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <span
        aria-hidden="true"
        className={cx(
          'flex size-[60px] shrink-0 items-center justify-center rounded-[50%_10%_50%_10%] border-4 border-soil-deep text-on-primary',
          right ? 'bg-correct' : 'bg-wrong',
        )}
      >
        {right ? <Check className="size-[38px]" strokeWidth={3.5} /> : <X className="size-[38px]" strokeWidth={3.5} />}
      </span>
      <p className={cx('min-w-0 font-heading text-[46px] leading-[1.35] font-bold text-balance', right ? 'text-correct' : 'text-wrong')}>{text}</p>
    </>
  )
}

/**
 * น้องนก rising on a garden stake from the window's bottom edge while her bubble shows: cheering a right answer, a
 * thumbs up otherwise, clear of the corner buttons. Under reduced motion she is simply there.
 */
export function StakeMascot({ feedback }: { feedback: Feedback; placement: 'top' | 'bottom' }) {
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const { poses } = useMascot()
  return (
    <motion.div
      data-testid="feedback-mascot"
      aria-hidden="true"
      className="pointer-events-none absolute z-30 overflow-hidden"
      style={{ left: RISE.left - bleed.x, bottom: -bleed.y, width: RISE.width, height: RISE.height }}
      exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.div
        data-testid="feedback-stake"
        className="absolute inset-0"
        initial={still ? false : { y: RISE.height }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <span className="absolute top-[118px] bottom-0 left-[46px] w-[18px] border-x-[4px] border-soil-deep bg-plank" />
        <span className="absolute top-[112px] left-[24px] h-[16px] w-[62px] rounded-[6px] border-[4px] border-soil-deep bg-plank" />
        <img
          src={feedback.kind === 'correct' ? poses.cheer : poses.encourage}
          alt=""
          draggable={false}
          className="absolute top-0 left-0 h-[124px] w-[110px] max-w-none object-contain select-none"
        />
      </motion.div>
    </motion.div>
  )
}
