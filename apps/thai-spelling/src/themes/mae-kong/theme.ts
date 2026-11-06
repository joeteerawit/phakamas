import { activitySteps } from '../../session/activities'
import type { Theme } from '../types'
import { maeKongKit } from './kit'
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

/**
 * แม่กง's Theme, the fallback for every other Theme. Steps in Step order; Activity Steps are numbered in
 * session/activities. Steps without a Scene use the garden.
 */
export const maeKongTheme: Theme = {
  id: 'mae-kong',
  steps: {
    1: { layout: CoverStep, scene: 'cover' },
    2: { layout: VocabularyStep },
    3: { layout: ListenRepeatStep, scene: 'pond' },
    4: { layout: SpottingStep, scene: 'pond' },
    [activitySteps.wordSelection]: { layout: WordSelectionStep, scene: 'step5' },
    [activitySteps.wordFilling]: { layout: WordFillingStep },
    7: { layout: RhymeStep, scene: 'pond' },
    [activitySteps.rhymeMatching]: { layout: RhymeMatchingStep, scene: 'pond' },
    9: { layout: SentenceStep },
    10: { layout: SummaryStep, scene: 'summary' },
  },
  // The comic Mascot (docs/comic-art.md).
  mascot: {
    name: 'น้องลิง',
    poses: {
      greet: '/assets/comic/mascot-greet.webp',
      cheer: '/assets/comic/mascot-cheer.webp',
      encourage: '/assets/comic/mascot-encourage.webp',
      cover: '/assets/comic/mascot-swing.webp',
    },
  },
  kit: maeKongKit,
}
