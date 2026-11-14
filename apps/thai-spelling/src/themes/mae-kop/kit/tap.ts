import type { UiKit } from '../../../ui/kit'

type AudioWindow = typeof globalThis & { webkitAudioContext?: typeof AudioContext }
let context: AudioContext | undefined

/**
 * A soft drip "plop", synthesised so it needs no file: one sine whose pitch falls quickly, like a drop into water,
 * fading out in 0.18 s. Quiet (peak gain 0.1), so it never covers a word being read. The first tap creates the
 * AudioContext, which counts as the user gesture browsers ask for.
 */
function plop() {
  const Context = globalThis.AudioContext ?? (globalThis as AudioWindow).webkitAudioContext
  if (!Context) return
  context ??= new Context()
  if (context.state === 'suspended') void context.resume()
  const now = context.currentTime
  const tone = context.createOscillator()
  const envelope = context.createGain()
  tone.type = 'sine'
  tone.frequency.setValueAtTime(1100, now)
  tone.frequency.exponentialRampToValueAtTime(260, now + 0.12)
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(0.1, now + 0.01)
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  tone.connect(envelope).connect(context.destination)
  tone.start(now)
  tone.stop(now + 0.2)
}

// A ring of splashing droplets in a -50..50 box: eight teardrops pointing outwards round a ripple ring.
const droplets = Array.from({ length: 8 }, (_, i) => {
  const deg = i * 45
  return `<path transform="rotate(${deg}) translate(0 -36)" d="M0 -10 C4 -4 7 0 7 4 C7 8 4 10 0 10 C-4 10 -7 8 -7 4 C-7 0 -4 -4 0 -10 Z" fill="#c4eee8" stroke="currentColor" stroke-width="3"/>`
}).join('')
const splashSvg =
  `<svg data-splash viewBox="-50 -50 100 100" width="100%" height="100%" style="overflow:visible">` +
  `<ellipse cx="0" cy="0" rx="20" ry="20" fill="none" stroke="#0f7f7a" stroke-width="5"/>` +
  droplets +
  `</svg>`

/** แม่กบ's tap: a drip plop and a ring of splashing droplets at the pointer; the control's own vinyl squashes in CSS. */
export const splashTap: UiKit['tap'] = {
  burst: () => splashSvg,
  keyframes: [
    { scale: '0.3', opacity: 1 },
    { scale: '1', opacity: 1, offset: 0.45 },
    { scale: '1.3', opacity: 0 },
  ],
  ms: 450,
  sound: plop,
}
