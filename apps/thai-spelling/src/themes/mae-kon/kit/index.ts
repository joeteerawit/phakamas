import type { UiKit } from '../../../ui/kit'
import { LEAVES_COVER_MS, LEAVES_MS, LeafSweep } from './LeafSweep'
import { BackPaddle, BambooTitle, BoatMascot, LeafConeSpeaker, MusicNote, NextPaddle, NgobHome, PaddleStar, PlankButton, TrayBubbleContent } from './parts'
import { rippleTap } from './tap'

/**
 * แม่กน's UI Kit (docs/mae-kon-spec.md): warm-wood plank buttons lashed with coral rope, a woven งอบ for Home and
 * wooden paddles for Back and Next, a banana-leaf cone speaker, bamboo-tray cards, the woven tray น้องส้ม holds up
 * from her boat, Stars painted on a paddle blade, two banana leaves between Steps and a water plop with ripples.
 */
export const maeKonKit: UiKit = {
  Button: PlankButton,
  home: { className: 'rounded-[28px]', Art: NgobHome },
  back: { className: 'rounded-[28px]', Art: BackPaddle },
  next: { className: 'rounded-[28px]', Art: NextPaddle },
  music: { className: 'plank-button flex items-center justify-center', Art: MusicNote },
  Speaker: LeafConeSpeaker,
  card: 'bamboo-tray',
  TitleSign: BambooTitle,
  stepBadge: 'bamboo-label px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-kon-ink',
  feedback: {
    // One round woven tray either way; the badge, the text colour and the spoken prefix tell right from wrong.
    className: () =>
      'relative flex items-center gap-[14px] rounded-full border-[5px] border-kon-ink bg-[radial-gradient(ellipse_at_center,#fbf1d6_0_72%,var(--color-bamboo)_100%)] py-[14px] ps-[20px] pe-[34px] shadow-[inset_0_0_0_9px_var(--color-bamboo),inset_0_0_0_12px_var(--color-bamboo-deep),0_8px_0_rgb(43_29_18/0.4)]',
    Content: TrayBubbleContent,
    Aside: BoatMascot,
  },
  Star: PaddleStar,
  starCounter: 'paddle-counter items-center gap-[10px] px-[26px] font-heading text-[40px] font-bold text-card',
  // Every Step change is the two banana leaves.
  stepChange: { covers: () => true, coverMs: LEAVES_COVER_MS, ms: LEAVES_MS, Cover: LeafSweep },
  tap: rippleTap,
}
