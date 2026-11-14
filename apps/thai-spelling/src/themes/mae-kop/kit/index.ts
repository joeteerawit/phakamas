import type { UiKit } from '../../../ui/kit'
import { BackBoot, DropBubbleContent, HutArt, MusicNote, NextBoot, PuddleMascot, RaindropStar, SnailSpeaker, VinylButton, VinylTag } from './parts'
import { Ripple, RIPPLE_COVER_MS, RIPPLE_MS } from './Ripple'
import { splashTap } from './tap'

/**
 * แม่กบ's UI Kit (docs/mae-kop-spec.md): raincoat-yellow vinyl buttons, a teal vinyl hut and rubber boots for Home,
 * Back and Next, a snail speaker, raincoat-pocket cards, น้องกบ's drop-shaped bubble from a puddle, raindrop Stars
 * on a reed, a ripple between Steps and a drip plop with a splash on every tap.
 */
export const maeKopKit: UiKit = {
  Button: VinylButton,
  home: { className: 'rounded-[28px]', Art: HutArt },
  back: { className: 'rounded-[28px]', Art: BackBoot },
  next: { className: 'rounded-[28px]', Art: NextBoot },
  music: { className: 'vinyl-button flex items-center justify-center', Art: MusicNote },
  Speaker: SnailSpeaker,
  card: 'pocket-card',
  TitleSign: VinylTag,
  stepBadge: 'drop-label px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-pond-deep',
  feedback: {
    // One pale yellow drop either way; the badge, the text colour and the spoken prefix tell right from wrong.
    className: () =>
      'relative flex items-center gap-[14px] rounded-[56px_56px_56px_18px] border-[5px] border-pond-deep bg-raincoat-light py-[12px] ps-[16px] pe-[28px] shadow-[0_8px_0_rgb(10_87_84/0.4)]',
    Content: DropBubbleContent,
    Aside: PuddleMascot,
  },
  Star: RaindropStar,
  starCounter: 'reed-stars items-center gap-[10px] px-[26px] font-heading text-[40px] font-bold text-pond-deep',
  // Every Step change is a ripple.
  stepChange: { covers: () => true, coverMs: RIPPLE_COVER_MS, ms: RIPPLE_MS, Cover: Ripple },
  tap: splashTap,
}
