import { Check, Volume2, VolumeX, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useMascot } from '../../../ui/mascotContext'

/** Shared comic chrome (docs/comic-art.md). */
const COMIC = '/assets/comic'
const chromeImage = 'pointer-events-none size-full select-none object-contain'

/** The orange home button. */
export const HomeArt = () => <img src={`${COMIC}/ui-home.webp`} alt="" draggable={false} className={chromeImage} />
/** The ▶ button mirrored. */
export const BackArt = () => <img src={`${COMIC}/play-button.webp`} alt="" draggable={false} className={`${chromeImage} -scale-x-100`} />
export const NextArt = () => <img src={`${COMIC}/play-button.webp`} alt="" draggable={false} className={chromeImage} />

export const MusicIcon = ({ on }: { on: boolean }) =>
  on ? <Volume2 aria-hidden="true" className="size-16" strokeWidth={2.5} /> : <VolumeX aria-hidden="true" className="size-16" strokeWidth={2.5} />

/** The wooden plank with the Step title. */
export function PlankSign({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute top-[29px] left-[47px] flex h-[115px] w-[382px] items-center justify-center bg-contain bg-center bg-no-repeat px-[24px] font-heading text-[38px] leading-[1.4] font-bold text-navy"
      style={{ backgroundImage: `url(${COMIC}/ui-plank.webp)` }}
    >
      {children}
    </div>
  )
}

/** The blue comic speaker (docs/comic-art.md); 270×278 px, so it stays sharp up to ~270 stage px. */
export function ComicSpeaker({ playing, loading }: { playing: boolean; loading: boolean }) {
  return (
    <>
      <img
        src={`${COMIC}/speaker-button.webp`}
        alt=""
        draggable={false}
        className={cx('pointer-events-none relative size-full object-contain', loading && 'motion-safe:animate-pulse')}
      />
      {playing && <SoundWaves />}
    </>
  )
}

/** 3 arcs beside the speaker; they pulse outwards, or stay lit with reduced motion. */
function SoundWaves() {
  return (
    <svg
      data-testid="sound-waves"
      aria-hidden="true"
      viewBox="0 0 20 56"
      className="pointer-events-none absolute top-1/2 left-[92%] aspect-[20/56] h-[79%] -translate-y-1/2 fill-none stroke-final stroke-[3.5]"
      strokeLinecap="round"
    >
      {['M2 22a8 8 0 0 1 0 12', 'M6 16a16 16 0 0 1 0 24', 'M10 10a24 24 0 0 1 0 36'].map((d, i) => (
        <path key={d} d={d} className="animate-sound-wave motion-reduce:animate-none" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </svg>
  )
}

/** The comic Mascot cheers a right answer and gives a thumbs up otherwise, beside a ✓/✗ badge and the message. */
export function ToastContent({ feedback, text }: { feedback: Feedback; text: ReactNode }) {
  const { poses } = useMascot()
  return (
    <>
      {/* 80 stage px tall (29 CSS px on a 390px-tall phone). */}
      <img
        src={feedback.kind === 'correct' ? poses.cheer : poses.encourage}
        alt=""
        draggable={false}
        className="pointer-events-none h-[80px] w-[68px] shrink-0 object-contain select-none"
      />
      <span
        aria-hidden="true"
        className={cx(
          'flex size-[56px] shrink-0 items-center justify-center rounded-full border-4 border-comic-ink text-on-primary',
          feedback.kind === 'correct' ? 'bg-correct' : 'bg-wrong',
        )}
      >
        {feedback.kind === 'correct' ? <Check className="size-[34px]" strokeWidth={3.5} /> : <X className="size-[34px]" strokeWidth={3.5} />}
      </span>
      <p
        className={cx(
          'min-w-0 font-heading text-[46px] leading-[1.35] font-bold text-balance',
          feedback.kind === 'correct' ? 'text-correct' : 'text-wrong',
        )}
      >
        {text}
      </p>
    </>
  )
}

export const GoldStar = () => '⭐'
