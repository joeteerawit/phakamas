import type { UiKit } from '../../../ui/kit'
import {
  BackSign,
  BubbleContent,
  HouseArt,
  IceButton,
  MusicNote,
  NextSign,
  PeekingMascot,
  RadioSpeaker,
  SnowflakeStar,
  StreetNameSign,
} from './parts'
import { FLURRY_COVER_MS, FLURRY_MS, SnowFlurry } from './SnowFlurry'
import { snowTap } from './tap'

/**
 * แม่กม's UI Kit (docs/mae-kom-spec.md): ice-block buttons, a snowy house and street direction signs for Home,
 * Back and Next, a red vintage radio for the speaker, frosted window cards, น้องส้ม's speech bubble, snowflake-stars
 * on a shop banner, a snow flurry between Steps and a bell jingle with a puff of snow on every tap.
 */
export const maeKomKit: UiKit = {
  Button: IceButton,
  home: { className: 'rounded-[28px]', Art: HouseArt },
  back: { className: 'rounded-[28px]', Art: BackSign },
  next: { className: 'rounded-[28px]', Art: NextSign },
  music: { className: 'ice-block flex items-center justify-center', Art: MusicNote },
  Speaker: RadioSpeaker,
  card: 'frost-card',
  TitleSign: StreetNameSign,
  stepBadge: 'frost-label px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-navy',
  feedback: {
    // One white bubble either way; the badge, the text colour and the spoken prefix tell right from wrong.
    className: () =>
      'relative flex items-center gap-[14px] rounded-[48px] border-[5px] border-comic-ink bg-card py-[12px] ps-[16px] pe-[28px] shadow-[0_8px_0_rgb(24_0_173/0.3)]',
    Content: BubbleContent,
    Aside: PeekingMascot,
  },
  Star: SnowflakeStar,
  starCounter: 'shop-banner items-center gap-[10px] px-[26px] font-heading text-[40px] font-bold text-card',
  // Every Step change is a snow flurry.
  stepChange: { covers: () => true, coverMs: FLURRY_COVER_MS, ms: FLURRY_MS, Cover: SnowFlurry },
  tap: snowTap,
}
