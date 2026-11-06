import type { ComponentType } from 'react'
import type { ActivityStepProps } from '../steps/stepProps'
import type { MascotArt } from '../ui/mascotContext'
import type { Scene } from '../ui/stage/Stage'

/** How a Theme draws one Step; a part it leaves out falls back to แม่กง's. */
export type ThemeStep = {
  layout?: ComponentType<ActivityStepProps>
  scene?: Scene
}

/** The look of one Lesson (ADR-0001): a layout and Scene per Step number, and its Mascot. */
export type Theme = {
  id: string
  steps: Partial<Record<number, ThemeStep>>
  mascot: MascotArt
}
