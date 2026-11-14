import type { Theme } from '../types'
import { activitySteps } from '../../session/activities'
import { maeKopKit } from './kit'
import { PondMap } from './map/PondMap'
import { CoverStep } from './steps/CoverStep'
import { ListenRepeatStep } from './steps/ListenRepeatStep'
import { RhymeMatchingStep } from './steps/RhymeMatchingStep'
import { RhymeStep } from './steps/RhymeStep'
import { SentenceStep } from './steps/SentenceStep'
import { SpottingStep } from './steps/SpottingStep'
import { SummaryStep } from './steps/SummaryStep'
import { VocabularyStep } from './steps/VocabularyStep'
import { WordFillingStep } from './steps/WordFillingStep'
import { WordSelectionStep } from './steps/WordSelectionStep'

/** แม่กบ's rainy-pond Theme (docs/mae-kop-spec.md): its own Game and Scene for every Step, its Map, Mascot and UI Kit. */
export const maeKopTheme: Theme = {
  id: 'mae-kop',
  steps: {
    1: { layout: CoverStep, scene: 'kop-cover' },
    2: { layout: VocabularyStep, scene: 'kop-drizzle' },
    3: { layout: ListenRepeatStep, scene: 'kop-drizzle' },
    4: { layout: SpottingStep, scene: 'kop-drizzle' },
    [activitySteps.wordSelection]: { layout: WordSelectionStep, scene: 'kop-drizzle' },
    [activitySteps.wordFilling]: { layout: WordFillingStep, scene: 'kop-drizzle' },
    // Step 7's comic has no Scene: its panels fill the window over a plain gutter.
    7: { layout: RhymeStep, scene: 'kop-gutter' },
    [activitySteps.rhymeMatching]: { layout: RhymeMatchingStep, scene: 'kop-drizzle' },
    9: { layout: SentenceStep, scene: 'kop-drizzle' },
    10: { layout: SummaryStep, scene: 'kop-rainbow' },
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
