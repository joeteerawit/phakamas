import { maeKongKit } from '../mae-kong/kit'
import type { Theme } from '../types'

/**
 * แม่กก's hillside-garden Theme (docs/mae-kok-spec.md). Every Step it leaves out uses แม่กง's layout and Scene; its
 * own Scenes, Map, Games and UI Kit come with the later tickets of #60.
 */
export const maeKokTheme: Theme = {
  id: 'mae-kok',
  steps: {},
  // น้องนก: placeholder SVG drawings exported to webp (scripts/placeholder-art-mae-kok.mjs) until the art ticket (#83) lands.
  mascot: {
    name: 'น้องนก',
    poses: {
      greet: '/assets/comic/mascot-nok-greet.webp',
      cheer: '/assets/comic/mascot-nok-cheer.webp',
      encourage: '/assets/comic/mascot-nok-encourage.webp',
      cover: '/assets/comic/mascot-nok-cover.webp',
    },
  },
  kit: maeKongKit,
}
