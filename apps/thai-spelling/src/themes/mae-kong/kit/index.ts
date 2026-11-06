import { Button } from '../../../ui/clay/Button'
import { creamCard, cx } from '../../../ui/clay/buttonClass'
import type { UiKit } from '../../../ui/kit'
import { PANEL_COVER_MS, PANEL_MS, PANEL_STEPS, PanelTransition } from './PanelTransition'
import { BackArt, ComicSpeaker, GoldStar, HomeArt, MusicIcon, NextArt, PlankSign, ToastContent } from './parts'
import { comicTap } from './tap'

// Round, so the focus ring follows the art.
const round = { className: 'rounded-full' }

/** แม่กง's UI Kit: the comic garden controls (docs/comic-art.md, MASTER.md). */
export const maeKongKit: UiKit = {
  Button,
  home: { ...round, Art: HomeArt },
  back: { ...round, Art: BackArt },
  next: { ...round, Art: NextArt },
  music: {
    className: 'flex items-center justify-center rounded-full border-[6px] border-comic-ink bg-pill text-navy shadow-comic',
    Art: MusicIcon,
  },
  Speaker: ComicSpeaker,
  card: creamCard,
  TitleSign: PlankSign,
  stepBadge: 'rounded-full border-[5px] border-comic-ink bg-pill px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-navy shadow-comic',
  feedback: {
    // Ink outline and hard shadow; an inner ring in the result colour.
    className: (kind) =>
      cx(
        'flex items-center gap-[10px] rounded-[32px] border-[5px] border-comic-ink bg-cream py-[10px] ps-[12px] pe-[20px] shadow-comic ring-[5px] ring-inset',
        kind === 'correct' ? 'ring-correct' : 'ring-wrong',
      ),
    Content: ToastContent,
  },
  Star: GoldStar,
  // A small wooden pill (MASTER.md wood) in ink.
  starCounter: 'items-center gap-[8px] rounded-full border-[5px] border-comic-ink bg-wood px-[24px] font-heading text-[40px] font-bold text-on-wood shadow-comic',
  // #36: into or out of Step 1 or 5 a comic panel sweeps over; other changes slide.
  stepChange: {
    covers: (from, to) => PANEL_STEPS.has(from) || PANEL_STEPS.has(to),
    coverMs: PANEL_COVER_MS,
    ms: PANEL_MS,
    Cover: PanelTransition,
  },
  tap: comicTap,
}
