import type { Theme } from '../types'
import { maeKonKit } from './kit'

/**
 * แม่กน's floating-market Theme (docs/mae-kon-spec.md). Every Step it leaves out uses แม่กง's layout and Scene; its own
 * Scenes, Map and Games come with the later tickets of #59. Its UI Kit dresses every Step's chrome already.
 */
export const maeKonTheme: Theme = {
  id: 'mae-kon',
  steps: {},
  // น้องส้ม, the Mascot the tickets name, in her แม่กม poses until her boat poses come with the Scenes (#99).
  mascot: {
    name: 'น้องส้ม',
    poses: {
      greet: '/assets/comic/mascot-som-greet.webp',
      cheer: '/assets/comic/mascot-som-cheer.webp',
      encourage: '/assets/comic/mascot-som-encourage.webp',
      cover: '/assets/comic/mascot-som-float.webp',
    },
  },
  kit: maeKonKit,
}
