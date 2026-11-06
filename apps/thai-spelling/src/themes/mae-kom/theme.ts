import type { Theme } from '../types'
import { CoverStep } from './steps/CoverStep'

/** แม่กม's snowy-city Theme (docs/mae-kom-spec.md). Steps it leaves out use แม่กง's layout and Scene. */
export const maeKomTheme: Theme = {
  id: 'mae-kom',
  steps: {
    1: { layout: CoverStep, scene: 'kom-cover' },
  },
  // น้องส้ม (docs/comic-art.md).
  mascot: {
    name: 'น้องส้ม',
    poses: {
      greet: '/assets/comic/mascot-som-greet.webp',
      cheer: '/assets/comic/mascot-som-cheer.webp',
      encourage: '/assets/comic/mascot-som-encourage.webp',
      cover: '/assets/comic/mascot-som-float.webp',
    },
  },
}
