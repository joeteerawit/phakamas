import { useContext, useEffect, useRef } from 'react'
import { KitContext, type UiKit } from '../kit'

// Step 6 chips and their slots: the chip FLIP measures rects, so nothing may scale them mid-move.
const NO_SQUASH = '[data-word], [data-blank]'

/**
 * Every tap on an enabled button or link gets the Theme Kit's tap feedback: its sound, a squash of the control
 * if the Kit has one, and its burst at the pointer. Mounted once by the Stage. The listener is passive and only
 * animates, so the click, focus, keyboard use and Step 6 dragging carry on untouched. Reduced motion: the sound only.
 */
export function ClickFeedback() {
  const layer = useRef<HTMLDivElement>(null)
  // A Stage rendered on its own (as in unit tests) has no Kit, and so no tap feedback.
  const tap = useContext(KitContext)?.tap
  // The listener stays put across Steps; it reads the Lesson's latest tap feedback.
  const kitTap = useRef(tap)
  useEffect(() => {
    kitTap.current = tap
  }, [tap])

  useEffect(() => {
    // Without media queries or the Web Animations API (e.g. jsdom) there is nothing to show.
    if (typeof window.matchMedia !== 'function' || typeof Element.prototype.animate !== 'function') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let taps = 0

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || !(event.target instanceof Element)) return
      const target = event.target.closest<HTMLElement>('button, a[href]')
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return
      const tap = kitTap.current
      if (!tap) return
      const { squash, sound } = tap
      sound?.()
      if (reduce.matches) return
      if (squash && !target.querySelector('[data-word]') && !target.closest(NO_SQUASH)) {
        target.animate(squash.keyframes, { duration: squash.ms, easing: 'ease-out' })
      }
      // A modal dialog sits in the top layer, above the burst layer, so its bursts go inside it.
      const host = target.closest('dialog[open]') ?? layer.current
      if (host) showBurst(host, event.clientX, event.clientY, tap, taps++)
    }

    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true })
  }, [])

  return <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" />
}

/** A burst sized by the window (not the stage scale), centred on the pointer; it removes itself. */
function showBurst(host: Element, x: number, y: number, tap: UiKit['tap'], count: number) {
  const origin = host.getBoundingClientRect()
  const burst = document.createElement('span')
  burst.dataset.testid = 'click-burst'
  burst.setAttribute('aria-hidden', 'true')
  burst.className = 'pointer-events-none absolute z-[60] block size-[clamp(48px,14vmin,150px)] -translate-1/2 text-comic-ink'
  burst.style.left = `${x - origin.left - host.clientLeft}px`
  burst.style.top = `${y - origin.top - host.clientTop}px`
  burst.innerHTML = tap.burst(count)
  host.append(burst)
  const pop = burst.animate(tap.keyframes, { duration: tap.ms, easing: 'ease-out' })
  const remove = () => burst.remove()
  pop.addEventListener('finish', remove)
  pop.addEventListener('cancel', remove)
}
