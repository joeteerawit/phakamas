import type { UiKit } from '../../../ui/kit'
import { HOE_COVER_MS, HOE_MS, HoeSweep } from './HoeSweep'
import { BackStake, BirdhouseArt, GardenSign, LeafBubbleContent, MusicNote, NextStake, PotButton, PotHorn, SeedStar, StakeMascot } from './parts'
import { seedTap } from './tap'

/**
 * แม่กก's UI Kit (docs/mae-kok-spec.md): matte terracotta flowerpot buttons, a wooden birdhouse and plant-marker
 * stakes for Home, Back and Next, a pot-horn speaker, kraft seed-packet cards, a kraft leaf bubble with น้องนก rising
 * on a garden stake, seed-stars in a planter box, one pass of a hoe between Steps and a clay-pot tok with a burst of
 * seeds on every tap.
 */
export const maeKokKit: UiKit = {
  Button: PotButton,
  home: { className: 'rounded-[28px]', Art: BirdhouseArt },
  back: { className: 'rounded-[28px]', Art: BackStake },
  next: { className: 'rounded-[28px]', Art: NextStake },
  music: { className: 'pot-button flex items-center justify-center', Art: MusicNote },
  Speaker: PotHorn,
  card: 'seed-packet',
  TitleSign: GardenSign,
  stepBadge: 'kraft-label px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-soil-deep',
  feedback: {
    // One kraft leaf either way; the badge, the text colour and the spoken prefix tell right from wrong.
    className: () =>
      'relative flex items-center gap-[14px] rounded-[64px_10px_64px_10px] border-[5px] border-sprout-deep bg-kraft-light py-[12px] ps-[18px] pe-[30px] shadow-[0_8px_0_rgb(46_106_32/0.4)]',
    Content: LeafBubbleContent,
    Aside: StakeMascot,
  },
  Star: SeedStar,
  starCounter: 'planter-box items-center gap-[10px] px-[26px] font-heading text-[40px] font-bold',
  // Every Step change is one pass of the hoe.
  stepChange: { covers: () => true, coverMs: HOE_COVER_MS, ms: HOE_MS, Cover: HoeSweep },
  tap: seedTap,
}
