import { activitySteps } from '../../session/activities'
import type { Theme } from '../types'
import { maeKokKit } from './kit'
import { HillsideMap } from './map/HillsideMap'
import { CoverStep } from './steps/CoverStep'
import { ListenRepeatStep } from './steps/ListenRepeatStep'
import { VocabularyStep } from './steps/VocabularyStep'

/**
 * แม่กก's hillside-garden Theme (docs/mae-kok-spec.md): its cover on the busy terraced hillside, the calm terrace for
 * Steps 2–6, 8 and 9 and the hillside at sunset for 10, and its own UI Kit on every Step. Every layout it leaves out
 * uses แม่กง's for now; its Games come with the later tickets of #60. The cover's ▶ opens its Map.
 */
export const maeKokTheme: Theme = {
  id: 'mae-kok',
  steps: {
    1: { layout: CoverStep, scene: 'kok-cover' },
    2: { layout: VocabularyStep, scene: 'kok-terrace' },
    3: { layout: ListenRepeatStep, scene: 'kok-terrace' },
    4: { scene: 'kok-terrace' },
    [activitySteps.wordSelection]: { scene: 'kok-terrace' },
    [activitySteps.wordFilling]: { scene: 'kok-terrace' },
    [activitySteps.rhymeMatching]: { scene: 'kok-terrace' },
    9: { scene: 'kok-terrace' },
    10: { scene: 'kok-sunset' },
  },
  map: HillsideMap,
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
  kit: maeKokKit,
}
