import { maeKongTheme } from '../mae-kong/theme'
import type { Theme } from '../types'

/** แม่กม's snowy-city Theme (docs/mae-kom-spec.md). No Steps of its own yet, so every Step uses แม่กง's layout and Scene. */
export const maeKomTheme: Theme = {
  id: 'mae-kom',
  steps: {},
  mascot: {
    name: 'น้องส้ม',
    // shortcut: these are น้องลิง's pictures under น้องส้ม's name, switch to her own poses when #46 draws them.
    poses: maeKongTheme.mascot.poses,
  },
}
