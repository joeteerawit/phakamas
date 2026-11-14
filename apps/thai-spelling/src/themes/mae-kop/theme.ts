import type { Theme } from '../types'
import { activitySteps } from '../../session/activities'
import { maeKopKit } from './kit'
import { PondMap } from './map/PondMap'
import { CoverStep } from './steps/CoverStep'
import { ListenRepeatStep } from './steps/ListenRepeatStep'
import { SpottingStep } from './steps/SpottingStep'
import { VocabularyStep } from './steps/VocabularyStep'

/**
 * แม่กบ's rainy-pond Theme (docs/mae-kop-spec.md): its cover, a Scene for every Step, its Map and its UI Kit. A Step whose
 * layout it leaves out still plays แม่กง's Game until its own Game lands (#62).
 */
export const maeKopTheme: Theme = {
  id: 'mae-kop',
  steps: {
    1: { layout: CoverStep, scene: 'kop-cover' },
    2: { layout: VocabularyStep, scene: 'kop-drizzle' },
    3: { layout: ListenRepeatStep, scene: 'kop-drizzle' },
    4: { layout: SpottingStep, scene: 'kop-drizzle' },
    [activitySteps.wordSelection]: { scene: 'kop-drizzle' },
    [activitySteps.wordFilling]: { scene: 'kop-drizzle' },
    // Step 7's comic has no Scene: its panels fill the window over a plain gutter.
    7: { scene: 'kop-gutter' },
    [activitySteps.rhymeMatching]: { scene: 'kop-drizzle' },
    9: { scene: 'kop-drizzle' },
    10: { scene: 'kop-rainbow' },
  },
  map: PondMap,
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
