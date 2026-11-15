import type { UiKit } from '../../../ui/kit'

type AudioWindow = typeof globalThis & { webkitAudioContext?: typeof AudioContext }
let context: AudioContext | undefined

/**
 * A hollow clay-pot "tok", synthesised so it needs no file: a short triangle tone that drops a little in pitch, with a
 * quiet higher overtone for the pot's ring, both gone in 0.14 s. Quiet (peak gain 0.12), so it never covers a word being
 * read. The first tap creates the AudioContext, which counts as the user gesture browsers ask for.
 */
function tok() {
  const Context = globalThis.AudioContext ?? (globalThis as AudioWindow).webkitAudioContext
  if (!Context) return
  context ??= new Context()
  if (context.state === 'suspended') void context.resume()
  const now = context.currentTime
  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(0.12, now + 0.005)
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  envelope.connect(context.destination)
  const body = context.createOscillator()
  body.type = 'triangle'
  body.frequency.setValueAtTime(420, now)
  body.frequency.exponentialRampToValueAtTime(300, now + 0.1)
  body.connect(envelope)
  body.start(now)
  body.stop(now + 0.16)
}

// A burst of seeds and leaf bits in a -50..50 box: six seeds and four little leaves flung outwards.
const seeds = Array.from({ length: 6 }, (_, i) => {
  const deg = i * 60 + 15
  return `<ellipse transform="rotate(${deg}) translate(0 -34)" rx="5" ry="8" fill="#a4804c" stroke="currentColor" stroke-width="3"/>`
}).join('')
const leaves = Array.from({ length: 4 }, (_, i) => {
  const deg = i * 90 + 45
  return `<path transform="rotate(${deg}) translate(0 -40)" d="M0 -10 Q9 -2 0 10 Q-9 -2 0 -10 Z" fill="#5c9e3a" stroke="currentColor" stroke-width="3"/>`
}).join('')
const seedSvg =
  `<svg data-seeds viewBox="-50 -50 100 100" width="100%" height="100%" style="overflow:visible">` +
  `<circle r="12" fill="#6e4426" stroke="currentColor" stroke-width="3"/>` +
  seeds +
  leaves +
  `</svg>`

/** แม่กก's tap: a clay-pot tok and a burst of seeds and leaf bits at the pointer; the pot sinks in CSS. */
export const seedTap: UiKit['tap'] = {
  burst: () => seedSvg,
  keyframes: [
    { scale: '0.3', opacity: 1, rotate: '0deg' },
    { scale: '1', opacity: 1, rotate: '20deg', offset: 0.5 },
    { scale: '1.2', opacity: 0, rotate: '35deg' },
  ],
  ms: 480,
  sound: tok,
}
