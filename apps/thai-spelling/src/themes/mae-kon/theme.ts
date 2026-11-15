import type { Theme } from '../types'
import { activitySteps } from '../../session/activities'
import { maeKonKit } from './kit'
import { MarketMap } from './map/MarketMap'
import { CoverStep } from './steps/CoverStep'

/**
 * แม่กน's floating-market Theme (docs/mae-kon-spec.md): its Scenes, Map, Mascot and UI Kit. Steps 2–10 still use แม่กง's
 * layouts over its own Scenes until their Games land (#100–#109).
 */
export const maeKonTheme: Theme = {
  id: 'mae-kon',
  steps: {
    1: { layout: CoverStep, scene: 'kon-cover' },
    2: { scene: 'kon-canal' },
    3: { scene: 'kon-canal' },
    4: { scene: 'kon-canal' },
    [activitySteps.wordSelection]: { scene: 'kon-canal' },
    [activitySteps.wordFilling]: { scene: 'kon-canal' },
    7: { scene: 'kon-canal' },
    [activitySteps.rhymeMatching]: { scene: 'kon-canal' },
    9: { scene: 'kon-canal' },
    10: { scene: 'kon-dusk' },
  },
  map: MarketMap,
  // น้องส้ม in her boat: labelled placeholders (scripts/mae-kon-placeholders.mjs) until the art ticket (#97) lands.
  mascot: {
    name: 'น้องส้ม',
    poses: {
      greet: '/assets/comic/mascot-kon-greet.webp',
      cheer: '/assets/comic/mascot-kon-cheer.webp',
      encourage: '/assets/comic/mascot-kon-encourage.webp',
      cover: '/assets/comic/mascot-kon-cover.webp',
    },
  },
  kit: maeKonKit,
}
