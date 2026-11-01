import { cx, pressable } from './clay/buttonClass'

/** The orange Canva speaker (docs/canva-assets.md); 142 px, so keep it ≤ ~140 stage px. */
export const SPEAKER_SRC = '/assets/canva/chrome/speaker-button.webp'

type SpeakerButtonProps = {
  /** Size and stage position, e.g. `top-[30px] left-[1470px] size-[124px]`. */
  className: string
  /** The clip is playing: sound waves beside the speaker. */
  playing?: boolean
  /** The clip is loading: the speaker pulses. */
  loading?: boolean
  /** Accessible name; required with `onClick`. */
  label?: string
  /** Without it the speaker is only a picture inside a card that is itself the button. */
  onClick?: () => void
}

/** The orange speaker of Steps 2–4, with sound waves while its clip plays. */
export function SpeakerButton({ className, playing = false, loading = false, label, onClick }: SpeakerButtonProps) {
  const content = (
    <>
      <img
        src={SPEAKER_SRC}
        alt=""
        draggable={false}
        className={cx('pointer-events-none relative size-full object-contain', loading && 'motion-safe:animate-pulse')}
      />
      {playing && <SoundWaves />}
    </>
  )
  if (!onClick) {
    return (
      <span aria-hidden="true" className={cx('pointer-events-none absolute block', className)}>
        {content}
      </span>
    )
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cx(pressable, 'absolute', className)}>
      {content}
    </button>
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
