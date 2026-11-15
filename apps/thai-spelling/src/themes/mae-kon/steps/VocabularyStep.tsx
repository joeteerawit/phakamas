import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { VocabularyWord } from '../../../lessons'
import { useVocabulary, useVocabularyCard } from '../../../steps/vocabulary/useVocabulary'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { ink } from '../kit/ink'
import { StallKeeper } from './StallKeeper'

// Stage pixels. The stall's woven tray (390–1530 × 190–860) holds six parcels, three by two, each 340×300 with a
// 30 px gap, all clear of the lotus pads drifting down the window's sides (x < 300 and x > 1620). The status sits
// under the tray; the stall-keeper stands at its right and น้องส้ม's boat comes in at its left once all are open,
// both above the corner controls.
const PARCEL = { left: 420, top: 210, width: 340, height: 300, gap: 30 }
const at = (i: number) => ({ left: PARCEL.left + (i % 3) * (PARCEL.width + PARCEL.gap), top: PARCEL.top + Math.floor(i / 3) * (PARCEL.height + PARCEL.gap) })

/**
 * แม่กน Step 2, unwrap the leaf parcels (docs/mae-kon-spec.md): six banana-leaf parcels (ห่อใบตอง) sit three by two on
 * the stall's woven tray, each pinned shut with a bamboo stick. Tapping a parcel unfolds its leaf: the pin pops out,
 * the four flaps fold back, the picture and word show on the leaf inside and the word plays (Step 2's shared
 * behaviour). Open parcels stay open and play again when tapped. Once all six are open the stall-keeper waves and
 * น้องส้ม cheers from her boat. Under reduced motion the leaf is simply open and nothing moves.
 */
export function VocabularyStep({ lesson }: StepProps) {
  const vocabulary = useVocabulary()
  const still = !!useReducedMotion()
  const { poses } = useMascot()
  const opened = lesson.vocabulary.filter((item) => vocabulary.visited(item)).length
  const all = opened === lesson.vocabulary.length

  return (
    <section data-full-stage className="relative size-full">
      {/* The stall's woven bamboo tray under the parcels. */}
      <span
        aria-hidden="true"
        data-testid="parcel-tray"
        className="pointer-events-none absolute top-[184px] left-[390px] h-[682px] w-[1140px] rounded-[48px] border-[6px] border-kon-ink bg-[repeating-linear-gradient(45deg,var(--color-bamboo)_0_14px,var(--color-bamboo-deep)_14px_18px),repeating-linear-gradient(-45deg,var(--color-bamboo)_0_14px,var(--color-bamboo-deep)_14px_18px)] bg-blend-multiply shadow-[0_12px_0_rgb(43_29_18/0.4)]"
      />
      <ul>
        {lesson.vocabulary.map((item, i) => (
          <li key={item.audio.id} className="absolute" style={{ ...at(i), width: PARCEL.width, height: PARCEL.height }}>
            <Parcel n={i + 1} item={item} open={vocabulary.visited(item)} still={still} onPlay={() => vocabulary.play(item)} />
          </li>
        ))}
      </ul>

      <p
        role="status"
        className="bamboo-label absolute top-[888px] left-1/2 flex h-[88px] -translate-x-1/2 items-center px-[36px] font-heading text-[40px] font-bold whitespace-nowrap text-kon-ink"
      >
        {all ? `แกะห่อใบตองครบ ${opened} ห่อแล้ว เก่งมาก!` : `แตะห่อใบตองเพื่อแกะดูภาพ (${opened}/${lesson.vocabulary.length})`}
      </p>

      {/* The stall-keeper behind the tray's right end; she waves once every parcel is open. */}
      <StallKeeper waving={all} className="absolute top-[560px] left-[1560px] h-[300px] w-[200px]" />

      {/* น้องส้ม paddles up to the stall and cheers when all six are open. */}
      <AnimatePresence>
        {all && (
          <motion.img
            key="cheer"
            data-testid="stall-cheer"
            src={poses.cheer}
            alt=""
            draggable={false}
            className="pointer-events-none absolute top-[580px] left-[150px] h-[300px] w-[218px] object-contain select-none"
            initial={still ? false : { x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

// Four flaps of banana leaf meeting in the middle of a 340×300 parcel: top, right, bottom, left, each folding back
// back to its own edge and out of sight.
const FLAPS = [
  { d: 'M0 0 H340 L170 150 Z', origin: '170px 0px', fold: { scaleY: 0 } },
  { d: 'M340 0 V300 L170 150 Z', origin: '340px 150px', fold: { scaleX: 0 } },
  { d: 'M0 300 H340 L170 150 Z', origin: '170px 300px', fold: { scaleY: 0 } },
  { d: 'M0 0 V300 L170 150 Z', origin: '0px 150px', fold: { scaleX: 0 } },
] as const

type ParcelProps = { n: number; item: VocabularyWord; open: boolean; still: boolean; onPlay: () => void }

/** One banana-leaf parcel: closed with its pin, or unfolded to show the picture and word on the leaf; the parcel is the button. */
function Parcel({ n, item, open, still, onPlay }: ParcelProps) {
  const { card } = useKit()
  const { status, statusText } = useVocabularyCard(item, open)
  const playing = status === 'playing'
  const fold = still ? { duration: 0 } : ({ type: 'spring', stiffness: 220, damping: 20 } as const)

  return (
    <button
      type="button"
      onClick={onPlay}
      data-open={open || undefined}
      aria-label={open ? `${item.word} ${statusText}` : `ห่อที่ ${n} แตะเพื่อแกะห่อ`}
      className="pointer-events-auto relative block size-full cursor-pointer rounded-[34px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {/* The leaf inside, the Kit's bamboo-tray card: the picture and the word, shown once unwrapped. */}
      <span data-testid="parcel-leaf" data-highlight={playing || undefined} className={cx('pointer-events-none absolute inset-0 block', card)}>
        {open && (
          <>
            <motion.img
              src={item.image}
              alt=""
              draggable={false}
              className="absolute top-[8px] left-1/2 h-[170px] w-[184px] -translate-x-1/2 object-contain"
              initial={still ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.4 }}
            />
            <span className="absolute inset-x-0 bottom-[6px] text-center font-heading text-[64px] leading-[1.4] font-bold text-kon-ink">{item.word}</span>
          </>
        )}
      </span>
      {open && <SpeakerButton className="bottom-[22px] left-[22px] size-[64px]" playing={playing} loading={status === 'loading'} />}

      {/* The parcel's four flaps, folding back to their edges as it opens, and the bamboo pin holding them shut. */}
      <svg data-testid="parcel-flaps" aria-hidden="true" viewBox="0 0 340 300" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        {FLAPS.map((flap, i) => (
          <motion.path
            key={i}
            d={flap.d}
            fill={i % 2 ? 'var(--color-banana)' : 'var(--color-banana-deep)'}
            {...ink}
            style={{ transformBox: 'view-box', transformOrigin: flap.origin }}
            initial={false}
            animate={open ? { ...flap.fold, opacity: 0 } : { scaleX: 1, scaleY: 1, opacity: 1 }}
            transition={fold}
          />
        ))}
        {!open && <path d="M170 20 V280 M20 150 H320" stroke="var(--color-banana-light)" strokeWidth={5} strokeLinecap="round" opacity={0.6} />}
      </svg>
      <AnimatePresence>
        {!open && (
          <motion.span
            data-testid="parcel-pin"
            aria-hidden="true"
            className="pointer-events-none absolute top-[118px] left-[120px] block h-[64px] w-[100px]"
            exit={still ? { opacity: 0, transition: { duration: 0 } } : { y: -120, rotate: 50, opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
          >
            <svg viewBox="0 0 100 64" className="size-full overflow-visible">
              <path d="M6 54 L94 10" stroke="var(--color-kon-ink)" strokeWidth={14} strokeLinecap="round" />
              <path d="M6 54 L94 10" stroke="var(--color-bamboo)" strokeWidth={7} strokeLinecap="round" />
              <circle cx="50" cy="32" r="16" fill="var(--color-coral)" {...ink} strokeWidth={4} />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
