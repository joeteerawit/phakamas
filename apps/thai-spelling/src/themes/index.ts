import { maeKongTheme } from './mae-kong/theme'
import type { Theme } from './types'

export type { Theme, ThemeStep } from './types'

const themes: Readonly<Record<string, Theme>> = {
  [maeKongTheme.id]: maeKongTheme,
}

/** The Theme a Lesson names; every Lesson's Theme is registered here. */
export function getTheme(themeId: string): Theme {
  const theme = Object.hasOwn(themes, themeId) ? themes[themeId] : undefined
  if (!theme) throw new Error(`Unknown Theme: ${themeId}`)
  return theme
}

/** Step `stepNumber`'s layout in `theme`, or แม่กง's when the Theme leaves it out. */
export const stepLayout = (theme: Theme, stepNumber: number) =>
  theme.steps[stepNumber]?.layout ?? maeKongTheme.steps[stepNumber]?.layout

/** Step `stepNumber`'s Scene in `theme`, or แม่กง's when the Theme leaves it out. */
export const stepScene = (theme: Theme, stepNumber: number) =>
  theme.steps[stepNumber]?.scene ?? maeKongTheme.steps[stepNumber]?.scene
