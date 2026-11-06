import { cx, pressable } from './clay/buttonClass'
import { useKit } from './kit'

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

/** The speaker of Steps 2–4, drawn by the Theme's UI Kit, with sound waves while its clip plays. */
export function SpeakerButton({ className, playing = false, loading = false, label, onClick }: SpeakerButtonProps) {
  const { Speaker } = useKit()
  const content = <Speaker playing={playing} loading={loading} />
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
