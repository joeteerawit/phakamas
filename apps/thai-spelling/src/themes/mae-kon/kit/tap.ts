import type { UiKit } from '../../../ui/kit'

type AudioWindow = typeof globalThis & { webkitAudioContext?: typeof AudioContext }
let context: AudioContext | undefined

/**
 * A soft water "plop", as a paddle dips into the canal: a low sine whose pitch dips then lifts a little (the bubble
 * coming back up), fading out in 0.24 s. Quiet (peak gain 0.09), so it never covers a word being read. The first
 * tap creates the AudioContext, which counts as the user gesture browsers ask for. No boing.
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
  tone.frequency.setValueAtTime(520, now)
  tone.frequency.exponentialRampToValueAtTime(170, now + 0.08)
  tone.frequency.exponentialRampToValueAtTime(240, now + 0.2)
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(0.09, now + 0.015)
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)
  tone.connect(envelope).connect(context.destination)
  tone.start(now)
  tone.stop(now + 0.26)
}

// Ripples in a -50..50 box: three flattened rings on the water and five droplets thrown up above them.
const rings = [14, 26, 38]
  .map((rx, i) => `<ellipse cx="0" cy="12" rx="${rx}" ry="${rx * 0.42}" fill="none" stroke="#2e7d5b" stroke-width="${5 - i}" opacity="${1 - i * 0.25}"/>`)
  .join('')
const droplets = [-34, -17, 0, 17, 34]
  .map((x, i) => `<circle cx="${x}" cy="${-14 - (i % 2 ? 22 : 10)}" r="${i === 2 ? 6 : 4.5}" fill="#cfe8d6" stroke="currentColor" stroke-width="2.5"/>`)
  .join('')
const rippleSvg = `<svg data-ripple viewBox="-50 -50 100 100" width="100%" height="100%" style="overflow:visible">${rings}${droplets}</svg>`

/** แม่กน's tap: a water plop and ripples with droplets at the pointer; the plank's own dip is in CSS. */
export const rippleTap: UiKit['tap'] = {
  burst: () => rippleSvg,
  keyframes: [
    { scale: '0.4', opacity: 1 },
    { scale: '1', opacity: 0.9, offset: 0.5 },
    { scale: '1.25', opacity: 0 },
  ],
  ms: 520,
  sound: plop,
}
