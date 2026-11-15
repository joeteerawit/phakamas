import { Check, Music, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useMascot } from '../../../ui/mascotContext'
import { useStageBleed } from '../../../ui/stage/Stage'
import { ink } from './ink'

const art = 'pointer-events-none size-full select-none overflow-visible'

/**
 * แม่กน's button, a warm-wood boat plank lashed with coral rope (`plank-button` in mae-kon.css). Place it with
 * `relative` or `absolute` and size it at the call site. Same press feedback rules as every button: focus ring,
 * disabled look.
 */
export function PlankButton({ type = 'button', className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cx(
        'plank-button pointer-events-auto cursor-pointer select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/** The woven งอบ hat, in a 0..146 × 0..150 box; Home, the Step 4 hats and the stamps of Steps 7 and 9 all use it. */
export function NgobArt({ className, colour = 'var(--color-bamboo)' }: { className?: string; colour?: string }) {
  return (
    <svg data-art="ngob" aria-hidden="true" viewBox="0 0 146 150" className={cx(art, className)}>
      {/* The chin strap. */}
      <path d="M40 104 Q73 146 106 104" fill="none" stroke="var(--color-coral)" strokeWidth={6} strokeLinecap="round" />
      {/* The wide brim and the crown on top of it. */}
      <ellipse cx="73" cy="96" rx="68" ry="20" fill={colour} {...ink} />
      <path d="M26 92 Q30 30 73 22 Q116 30 120 92 Q73 108 26 92 Z" fill={colour} {...ink} />
      {/* The weave. */}
      <path d="M40 86 Q48 44 73 30 M106 86 Q98 44 73 30 M56 92 Q60 52 73 30 M90 92 Q86 52 73 30" fill="none" stroke="var(--color-bamboo-deep)" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M34 72 Q73 84 112 72 M44 52 Q73 62 102 52" fill="none" stroke="var(--color-bamboo-deep)" strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx="73" cy="24" rx="9" ry="5" fill="var(--color-teak-deep)" {...ink} strokeWidth={3} />
    </svg>
  )
}

/** Home: a woven งอบ hat. */
export const NgobHome = () => <NgobArt />

/** Back and Next: a wooden paddle, its blade pointing the way. */
function Paddle({ back = false }: { back?: boolean }) {
  return (
    <svg data-art="paddle" aria-hidden="true" viewBox="0 0 146 150" className={cx(art, back && '-scale-x-100')}>
      <g transform="rotate(-12 73 75)">
        {/* The grip and the shaft. */}
        <rect x="4" y="66" width="26" height="20" rx="9" fill="var(--color-teak-deep)" {...ink} />
        <rect x="26" y="69" width="56" height="14" rx="6" fill="var(--color-honey)" {...ink} />
        {/* The blade, pointing the way. */}
        <path d="M78 76 Q90 46 122 50 Q144 56 144 76 Q144 96 122 102 Q90 106 78 76 Z" fill="var(--color-teak)" {...ink} />
        <path d="M88 76 H134" stroke="var(--color-teak-deep)" strokeWidth={4} strokeLinecap="round" />
        <path d="M100 62 Q116 58 128 64" fill="none" stroke="rgb(255 255 255 / 0.5)" strokeWidth={5} strokeLinecap="round" />
      </g>
      {/* Water dripping off the blade tip. */}
      <path d="M126 112 Q132 124 126 130 Q120 124 126 112 Z" fill="var(--color-canal-light)" {...ink} strokeWidth={3} />
    </svg>
  )
}

export const BackPaddle = () => <Paddle back />
export const NextPaddle = () => <Paddle />

/** The music on/off plank's note; struck through in coral while the music is off. */
export function MusicNote({ on }: { on: boolean }) {
  return (
    <>
      <Music aria-hidden="true" className="relative size-16" strokeWidth={2.5} />
      {!on && (
        <span
          data-testid="music-off"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[12px] w-[96px] -translate-1/2 -rotate-45 rounded-full border-[3px] border-card bg-coral-deep"
        />
      )}
    </>
  )
}

/** The Step title on a board of split bamboo, hung from a bamboo pole by two coral cords. */
export function BambooTitle({ children }: { children: ReactNode }) {
  return (
    <div className="absolute top-[29px] left-[47px] h-[115px] w-[382px]">
      <span aria-hidden="true" className="absolute -top-[10px] -right-[14px] -left-[14px] h-[16px] rounded-full border-[4px] border-kon-ink bg-[repeating-linear-gradient(90deg,var(--color-bamboo)_0_46px,var(--color-bamboo-deep)_46px_50px)]" />
      <span aria-hidden="true" className="absolute top-[2px] right-[46px] left-[46px] h-[16px] border-x-[4px] border-coral" />
      <div className="absolute inset-x-0 top-[14px] bottom-0 flex items-center justify-center rounded-[14px] border-[5px] border-kon-ink bg-[repeating-linear-gradient(90deg,#f3dfa9_0_30px,var(--color-bamboo)_30px_34px,#e2c47f_34px_36px)] px-[26px] font-heading text-[34px] leading-[1.4] font-bold text-kon-ink shadow-[0_8px_0_rgb(43_29_18/0.4)]">
        {children}
      </div>
    </div>
  )
}

/** The speaker: a rolled banana-leaf cone (กรวยใบตอง), its mouth to the right; sound lines fan out while it plays. */
export function LeafConeSpeaker({ playing, loading }: { playing: boolean; loading: boolean }) {
  return (
    <>
      {playing && (
        <svg
          data-testid="sound-waves"
          aria-hidden="true"
          viewBox="0 0 120 110"
          className="pointer-events-none absolute inset-0 size-full overflow-visible fill-none stroke-banana-deep stroke-[6]"
          strokeLinecap="round"
        >
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${104 + i * 12} ${36 - i * 8} Q${116 + i * 14} 55 ${104 + i * 12} ${74 + i * 8}`}
              className="animate-sound-wave motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
      )}
      <svg
        data-art="leaf-cone"
        aria-hidden="true"
        viewBox="0 0 120 110"
        className={cx('pointer-events-none relative size-full overflow-visible', loading && 'motion-safe:animate-pulse')}
      >
        {/* The cone, rolled from one leaf: the tip at the left, the open mouth to the right. */}
        <path d="M8 58 L96 18 Q112 55 96 92 Z" fill="var(--color-banana)" {...ink} />
        <ellipse cx="96" cy="55" rx="12" ry="37" fill="var(--color-banana-light)" {...ink} />
        <ellipse cx="98" cy="55" rx="6" ry="26" fill="var(--color-banana-deep)" />
        {/* The leaf's veins and the rolled edge. */}
        <path d="M14 58 L92 28 M14 58 L90 80 M40 47 L46 70 M64 37 L70 78" fill="none" stroke="var(--color-banana-deep)" strokeWidth={3} strokeLinecap="round" />
        {/* The bamboo pin that holds it shut. */}
        <path d="M30 34 L60 92" stroke="var(--color-teak-deep)" strokeWidth={5} strokeLinecap="round" />
      </svg>
    </>
  )
}

// A five-point star in a -50..50 box, painted on a paddle blade.
const STAR = 'M0 -30 L8.8 -12.1 L28.5 -9.3 L14.3 4.6 L17.6 24.3 L0 15 L-17.6 24.3 L-14.3 4.6 L-28.5 -9.3 L-8.8 -12.1 Z'

/** One Star of the Stars display: a gold star painted on a teak paddle blade, 1em across. */
export function PaddleStar() {
  return (
    <svg data-art="paddle-star" aria-hidden="true" viewBox="-50 -50 100 100" className="inline-block size-[1em] overflow-visible align-[-0.14em]">
      <path d="M0 -48 Q36 -46 40 0 Q36 46 0 48 Q-36 46 -40 0 Q-36 -46 0 -48 Z" fill="var(--color-teak)" {...ink} strokeWidth={6} />
      <path d={STAR} fill="var(--color-marigold)" {...ink} strokeWidth={4} />
    </svg>
  )
}

/** Inside the round woven tray น้องส้ม holds up: a ✓/✗ badge and the message; it never tells right from wrong by colour alone. */
export function TrayBubbleContent({ feedback, text }: { feedback: Feedback; text: ReactNode }) {
  const right = feedback.kind === 'correct'
  return (
    <>
      <span
        aria-hidden="true"
        className={cx(
          'flex size-[60px] shrink-0 items-center justify-center rounded-full border-4 border-kon-ink text-on-primary',
          right ? 'bg-canal' : 'bg-coral-deep',
        )}
      >
        {right ? <Check className="size-[38px]" strokeWidth={3.5} /> : <X className="size-[38px]" strokeWidth={3.5} />}
      </span>
      <p className={cx('min-w-0 font-heading text-[46px] leading-[1.35] font-bold text-balance', right ? 'text-canal-deep' : 'text-coral-deep')}>{text}</p>
    </>
  )
}

// Where her boat sits, in stage px: level with a top tray (146–286), or for a bottom tray higher up the edge
// (330–570), as the Back paddle holds the bottom-left corner.
const BOAT = {
  top: { top: 146, height: 140, width: 110, art: 140 },
  bottom: { top: 330, height: 240, width: 180, art: 240 },
}

/**
 * น้องส้ม in her boat at the window's left edge while the tray is up: cheering a right answer, a thumbs up otherwise,
 * clear of the corner controls. The boat rocks in on the water; under reduced motion she is simply there.
 */
export function BoatMascot({ feedback, placement }: { feedback: Feedback; placement: 'top' | 'bottom' }) {
  const boat = BOAT[placement]
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const { poses } = useMascot()
  return (
    <motion.div
      data-testid="feedback-mascot"
      aria-hidden="true"
      className="pointer-events-none absolute z-30 overflow-hidden"
      style={{ left: -bleed.x, top: boat.top, width: boat.width, height: boat.height }}
      exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="absolute inset-0"
        initial={still ? false : { x: -boat.width }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Her poses sit in her boat already. */}
        <img
          src={feedback.kind === 'correct' ? poses.cheer : poses.encourage}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-1/2 max-w-none -translate-x-1/2 select-none object-contain"
          style={{ height: boat.art }}
        />
      </motion.div>
    </motion.div>
  )
}
