import { createContext, useContext, type ComponentProps, type ComponentType, type ReactNode } from 'react'
import type { Feedback } from './clay/FeedbackToast'

/** How one chrome control looks: classes for its shape and material, and the art drawn inside it. */
export type ControlLook<P = object> = { className: string; Art: ComponentType<P> }

/**
 * A Theme's UI Kit (ADR-0002, docs/game-concept.md): what its controls look like. The shared parts in `src/ui`
 * keep the behaviour every Kit wraps: roles and names, tap targets, focus, placement on the Stage, audio wiring.
 */
export type UiKit = {
  /** The Theme's button; size and place come from the call site. */
  Button: ComponentType<ComponentProps<'button'>>
  /** Home, Back and Next, each drawn in its window-corner box; the music on/off button beside Home. */
  home: ControlLook
  back: ControlLook
  next: ControlLook
  music: ControlLook<{ on: boolean }>
  /** The speaker, filling its button's box; sound waves (data-testid sound-waves) while its clip plays. */
  Speaker: ComponentType<{ playing: boolean; loading: boolean }>
  /** Card frame classes; a card sets `data-highlight` while it is selected or playing. */
  card: string
  /** The sign holding the Step title (the h1) in the top-left corner. */
  TitleSign: ComponentType<{ children: ReactNode }>
  /** Classes for the ขั้น n/10 badge. */
  stepBadge: string
  /**
   * The feedback bubble: classes per result, what it holds around the message (`text`, with its spoken prefix),
   * and anything shown beside it on the stage while it is up (decorative, e.g. the Mascot at the window's edge).
   */
  feedback: {
    className: (kind: Feedback['kind']) => string
    Content: ComponentType<{ feedback: Feedback; text: ReactNode }>
    Aside?: ComponentType<{ feedback: Feedback; placement: 'top' | 'bottom' }>
  }
  /** The Stars display: one Star, and classes for the Lesson's Star counter. */
  Star: ComponentType
  starCounter: string
  /**
   * The change between Steps. When `covers(from, to)`, `Cover` sweeps over the window, covering it by `coverMs`
   * while the Steps swap underneath, and is gone by `ms`; otherwise the Steps slide. Never under reduced motion.
   */
  stepChange: {
    covers: (from: number, to: number) => boolean
    coverMs: number
    ms: number
    Cover: ComponentType<{ direction: number }>
  }
  /**
   * Every tap on a button or link: an optional squash of the control, a burst at the pointer (SVG markup, cycled
   * tap by tap, animated by `keyframes`), and an optional sound. Reduced motion keeps only the sound.
   */
  tap: {
    squash?: { keyframes: Keyframe[]; ms: number }
    burst: (tap: number) => string
    keyframes: Keyframe[]
    ms: number
    sound?: () => void
  }
}

/** The Lesson's UI Kit, provided by the Step route from the Lesson's Theme. */
export const KitContext = createContext<UiKit | null>(null)

export function useKit(): UiKit {
  const kit = useContext(KitContext)
  if (!kit) throw new Error('useKit needs a KitContext provider')
  return kit
}
