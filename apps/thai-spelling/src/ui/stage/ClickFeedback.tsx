import { useEffect, useRef } from 'react'

const BOING_MS = 350
const BURST_MS = 400
/** Burst fills, cycled tap by tap. */
const BURST_COLOURS = ['--color-sun', '--color-cover-pill', '--color-sky-top', '--color-hill', '--color-orange', '--color-purple']
// Step 6 chips and their slots: the chip FLIP measures rects, so nothing may scale them mid-move.
const NO_BOING = '[data-word], [data-blank]'

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

/**
 * Every tap on an enabled button or link boings it and pops a comic burst at the pointer. Mounted once by
 * the Stage. The listener is passive and only animates, so the click, focus, keyboard use and Step 6
 * dragging carry on untouched. Reduced motion: nothing.
 */
export function ClickFeedback() {
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Without media queries or the Web Animations API (e.g. jsdom) there is nothing to show.
    if (typeof window.matchMedia !== 'function' || typeof Element.prototype.animate !== 'function') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let taps = 0

    const onPointerDown = (event: PointerEvent) => {
      if (reduce.matches || !event.isPrimary || !(event.target instanceof Element)) return
      const target = event.target.closest<HTMLElement>('button, a[href]')
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return
      if (!target.querySelector('[data-word]') && !target.closest(NO_BOING)) {
        target.animate(boing, { duration: BOING_MS, easing: 'ease-out' })
      }
      // A modal dialog sits in the top layer, above the burst layer, so its bursts go inside it.
      const host = target.closest('dialog[open]') ?? layer.current
      if (host) showBurst(host, event.clientX, event.clientY, BURST_COLOURS[taps++ % BURST_COLOURS.length]!)
    }

    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true })
  }, [])

  return <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" />
}

/** A burst sized by the window (not the stage scale), centred on the pointer; it removes itself. */
function showBurst(host: Element, x: number, y: number, fill: string) {
  const origin = host.getBoundingClientRect()
  const burst = document.createElement('span')
  burst.dataset.testid = 'click-burst'
  burst.setAttribute('aria-hidden', 'true')
  burst.className = 'pointer-events-none absolute z-[60] block size-[clamp(48px,14vmin,150px)] -translate-1/2 text-comic-ink'
  burst.style.left = `${x - origin.left - host.clientLeft}px`
  burst.style.top = `${y - origin.top - host.clientTop}px`
  burst.innerHTML = burstSvg(fill)
  host.append(burst)
  const pop = burst.animate(
    [
      { scale: '0.3', rotate: '-20deg', opacity: 1 },
      { scale: '1.1', rotate: '10deg', opacity: 1, offset: 0.55 },
      { scale: '1.3', rotate: '20deg', opacity: 0 },
    ],
    { duration: BURST_MS, easing: 'ease-out' },
  )
  const remove = () => burst.remove()
  pop.addEventListener('finish', remove)
  pop.addEventListener('cancel', remove)
}
