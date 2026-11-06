import type { UiKit } from '../../../ui/kit'

type AudioWindow = typeof globalThis & { webkitAudioContext?: typeof AudioContext }
let context: AudioContext | undefined

/**
 * A soft bell jingle, synthesised so it needs no file: two quick strikes, each a bell-like sine with two
 * inharmonic overtones that ring out in 0.35 s. Quiet (peak gain 0.08), so it never covers a word being read.
 * The first tap creates the AudioContext, which counts as the user gesture browsers ask for.
 */
function bellJingle() {
  const Context = globalThis.AudioContext ?? (globalThis as AudioWindow).webkitAudioContext
  if (!Context) return
  context ??= new Context()
  if (context.state === 'suspended') void context.resume()
  const now = context.currentTime
  const out = context.createGain()
  out.gain.value = 0.08
  out.connect(context.destination)
  for (const [delay, pitch] of [
    [0, 1760],
    [0.07, 2217],
  ] as const) {
    for (const [ratio, level] of [
      [1, 1],
      [2.76, 0.35],
      [5.4, 0.12],
    ] as const) {
      const at = now + delay
      const tone = context.createOscillator()
      const envelope = context.createGain()
      tone.frequency.value = pitch * ratio
      envelope.gain.setValueAtTime(0.0001, at)
      envelope.gain.exponentialRampToValueAtTime(level, at + 0.005)
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.35)
      tone.connect(envelope).connect(out)
      tone.start(at)
      tone.stop(at + 0.4)
    }
  }
}

// A puff of snow in a -50..50 box: a cloud of inked snowballs, with flakes thrown out round it.
const PUFF = [
  [0, 0, 20],
  [-18, 6, 14],
  [17, 7, 15],
  [-8, -14, 13],
  [10, -13, 12],
]
const flakes = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3 + Math.PI / 6
  return `<circle cx="${(Math.cos(a) * 40).toFixed(1)}" cy="${(Math.sin(a) * 40).toFixed(1)}" r="5" fill="#fff" stroke="currentColor" stroke-width="3"/>`
}).join('')
const puffSvg =
  `<svg data-puff viewBox="-50 -50 100 100" width="100%" height="100%" style="overflow:visible">` +
  flakes +
  PUFF.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="currentColor" stroke-width="4"/>`).join('') +
  // Fill the seams between the snowballs so the puff reads as one cloud.
  PUFF.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r! - 2}" fill="#fff"/>`).join('') +
  `</svg>`

/** แม่กม's tap: a soft bell jingle and a puff of snow at the pointer; the control itself does not boing. */
export const snowTap: UiKit['tap'] = {
  burst: () => puffSvg,
  keyframes: [
    { scale: '0.4', opacity: 1 },
    { scale: '1.1', opacity: 1, offset: 0.5 },
    { scale: '1.35', opacity: 0 },
  ],
  ms: 450,
  sound: bellJingle,
}
