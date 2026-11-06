import type { ComponentType } from 'react'
import type { ActivityStepProps, StepProps } from '../steps/stepProps'
import type { UiKit } from '../ui/kit'
import type { MascotArt } from '../ui/mascotContext'
import type { Scene } from '../ui/stage/Stage'

/** How a Theme draws one Step; a part it leaves out falls back to แม่กง's. */
export type ThemeStep = {
  layout?: ComponentType<ActivityStepProps>
  scene?: Scene
}

/** The look of one Lesson (ADR-0001, ADR-0002): a layout and Scene per Step number, its Mascot and its own UI Kit. */
export type Theme = {
  id: string
  steps: Partial<Record<number, ThemeStep>>
  /** The Lesson's Map (docs/game-concept.md), opened by the cover's ▶; a Theme without one goes straight to Step 2. */
  map?: ComponentType<StepProps>
  mascot: MascotArt
  kit: UiKit
}
