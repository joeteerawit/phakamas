import type { Theme } from '../types'
import { maeKopKit } from './kit'

/**
 * แม่กบ's rainy-pond Theme (docs/mae-kop-spec.md). Every Step it leaves out uses แม่กง's layout and Scene; its own
 * Scenes, Map and Games come with the later tickets of #62.
 */
export const maeKopTheme: Theme = {
  id: 'mae-kop',
  steps: {},
  // น้องกบ: SVG stand-ins exported to webp (scripts/placeholder-art.mjs) until the art ticket (#69) lands.
  mascot: {
    name: 'น้องกบ',
    poses: {
      greet: '/assets/comic/mascot-kop-greet.webp',
      cheer: '/assets/comic/mascot-kop-cheer.webp',
      encourage: '/assets/comic/mascot-kop-encourage.webp',
      cover: '/assets/comic/mascot-kop-cover.webp',
    },
  },
  kit: maeKopKit,
}
