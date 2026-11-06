import type { UiKit } from '../../../ui/kit'

/** Burst fills, cycled tap by tap. */
const BURST_COLOURS = ['--color-sun', '--color-cover-pill', '--color-sky-top', '--color-hill', '--color-orange', '--color-purple']

/**
 * Squash and spring on the individual `scale` and `rotate` properties: Tailwind uses `translate` and Motion
 * owns `transform`, so neither is overwritten. It only ever grows, so a tap near an edge still lands.
 */
const boing: Keyframe[] = [
  { scale: '1', rotate: '0deg' },
  { scale: '1.16 1.1', rotate: '-1.5deg', offset: 0.2 },
  { scale: '1.06 1.16', rotate: '1.5deg', offset: 0.45 },
  { scale: '1.08 1.04', rotate: '-0.5deg', offset: 0.7 },
  { scale: '1', rotate: '0deg' },
]

// An inked eight-point star with rays, drawn in a -50..50 box.
const star = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 ? 13 : 30
  const a = (i * Math.PI) / 8 - Math.PI / 2
  return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`
}).join(' ')
const rays = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 + Math.PI / 8
  const at = (r: number) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`
  return `M${at(36)} L${at(47)}`
}).join(' ')
const burstSvg = (fill: string) =>
  `<svg viewBox="-50 -50 100 100" width="100%" height="100%" style="overflow:visible">` +
  `<path d="${rays}" stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none"/>` +
  `<polygon points="${star}" style="fill:var(${fill})" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>` +
  `</svg>`

/** แม่กง's tap: the control boings and a comic star bursts at the pointer. */
export const comicTap: UiKit['tap'] = {
  squash: { keyframes: boing, ms: 350 },
  burst: (tap) => burstSvg(BURST_COLOURS[tap % BURST_COLOURS.length]!),
  keyframes: [
    { scale: '0.3', rotate: '-20deg', opacity: 1 },
    { scale: '1.1', rotate: '10deg', opacity: 1, offset: 0.55 },
    { scale: '1.3', rotate: '20deg', opacity: 0 },
  ],
  ms: 400,
}
