import { activitySteps } from '../../session/activities'
import type { Theme } from '../types'
import { maeKomKit } from './kit'
import { CoverStep } from './steps/CoverStep'
import { ListenRepeatStep } from './steps/ListenRepeatStep'
import { SpottingStep } from './steps/SpottingStep'
import { VocabularyStep } from './steps/VocabularyStep'

/** แม่กม's snowy-city Theme (docs/mae-kom-spec.md). Parts of a Step it leaves out use แม่กง's layout and Scene. */
export const maeKomTheme: Theme = {
  id: 'mae-kom',
  steps: {
    1: { layout: CoverStep, scene: 'kom-cover' },
    2: { layout: VocabularyStep, scene: 'kom-windy' },
    3: { layout: ListenRepeatStep, scene: 'kom-windy' },
    4: { layout: SpottingStep, scene: 'kom-windy' },
    [activitySteps.wordSelection]: { scene: 'kom-windy' },
    [activitySteps.wordFilling]: { scene: 'kom-windy' },
    [activitySteps.rhymeMatching]: { scene: 'kom-windy' },
    9: { scene: 'kom-windy' },
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
  kit: maeKomKit,
}
