import { useRef, useState, type PointerEvent } from 'react'

/** Pointer travel (px) before a press becomes a drag instead of a tap. */
const DRAG_THRESHOLD = 8

/** The dragged item: pointer position (relative to `container()`, else the viewport) and travel. */
export type Drag = { id: string; x: number; y: number; dx: number; dy: number }

/**
 * Hand-written Pointer Events drag (spec §7) for Steps 6 and 8. `dragging` follows the pointer and
 * `onDrop(id, clientX, clientY)` runs on release. A press that never moves stays a tap.
 */
export function usePointerDrag(
  onDrop: (id: string, x: number, y: number) => void,
  container?: () => HTMLElement | null,
) {
  const start = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null)
  const justDropped = useRef(false)
  const [dragging, setDragging] = useState<Drag | null>(null)

  const end = () => {
    start.current = null
    setDragging(null)
  }

  return {
    dragging,
    handlers: (id: string) => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        start.current = { id, x: e.clientX, y: e.clientY, moved: false }
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        const s = start.current
        if (s?.id !== id) return
        const dx = e.clientX - s.x
        const dy = e.clientY - s.y
        if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        s.moved = true
        const origin = container?.()?.getBoundingClientRect() ?? { left: 0, top: 0 }
        setDragging({ id, x: e.clientX - origin.left, y: e.clientY - origin.top, dx, dy })
      },
      onPointerUp: (e: PointerEvent<HTMLElement>) => {
        const moved = start.current?.moved
        end()
        if (!moved) return
        // The browser still fires click after a drag; swallow it.
        justDropped.current = true
        setTimeout(() => (justDropped.current = false))
        onDrop(id, e.clientX, e.clientY)
      },
      onPointerCancel: end,
    }),
    /** Wraps a tap handler so the click that ends a drag is ignored. */
    click: (onTap: () => void) => () => {
      if (!justDropped.current) onTap()
    },
  }
}
