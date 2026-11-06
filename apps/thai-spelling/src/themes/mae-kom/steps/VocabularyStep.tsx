import { motion, useReducedMotion } from 'motion/react'
import type { VocabularyWord } from '../../../lessons'
import { useVocabulary, useVocabularyCard } from '../../../steps/vocabulary/useVocabulary'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { popIn } from '../../../ui/motion/PopIn'
import { SpeakerButton } from '../../../ui/SpeakerButton'

// Stage pixels. Three 430px buildings (315–1605, centred on x = 960), each with one lit window per floor:
// the first three words upstairs, the rest on the ground floor under an awning.
const buildings = [
  { left: 315, wall: 'bg-purple', trim: 'bg-tint-lilac' },
  { left: 745, wall: 'bg-sky-top', trim: 'bg-tint-sky' },
  { left: 1175, wall: 'bg-tint-lilac', trim: 'bg-purple' },
]
const WINDOW = { width: 290, height: 300, inset: 70 }
const floorTops = [306, 710]

/**
 * แม่กม Step 2 (docs/mae-kom-spec.md): the six picture cards as lit shop windows on two floors of a building row,
 * drawn in CSS in the comic style, each in the Kit's frosted window frame. Tapping a window plays its word; it
 * glows while it plays.
 */
export function VocabularyStep({ lesson }: StepProps) {
  const vocabulary = useVocabulary()
  const reduceMotion = useReducedMotion()

  return (
    <section data-full-stage className="relative size-full">
      <p className="frost-label absolute top-[166px] left-[960px] flex -translate-x-1/2 h-[71px] items-center px-[28px] font-heading text-[38px] font-bold whitespace-nowrap text-navy">
        คลิกที่ภาพเพื่อฟังเสียง
      </p>

      <div aria-hidden="true" data-testid="building-row" className="pointer-events-none absolute inset-0">
        {buildings.map((building) => (
          <div
            key={building.left}
            className={`absolute top-[262px] h-[778px] w-[430px] border-[6px] border-comic-ink shadow-comic ${building.wall}`}
            style={{ left: building.left }}
          >
            {/* Snow on the roof, the band between the floors, and the shop awning. */}
            <div className="absolute -top-[22px] -inset-x-[16px] h-[44px] rounded-full border-[5px] border-comic-ink bg-card" />
            <div className={`absolute top-[358px] -inset-x-[6px] h-[22px] border-y-[5px] border-comic-ink ${building.trim}`} />
            <div className="absolute top-[388px] left-[50px] h-[52px] w-[318px] rounded-b-[26px] border-[5px] border-comic-ink bg-[repeating-linear-gradient(90deg,var(--color-final)_0_32px,var(--color-card)_32px_64px)]" />
          </div>
        ))}
      </div>

      <ul>
        {lesson.vocabulary.map((item, i) => (
          <motion.li
            key={item.audio.id}
            className="absolute"
            style={{
              left: (buildings[i % 3]?.left ?? 0) + WINDOW.inset,
              top: floorTops[Math.floor(i / 3)],
              width: WINDOW.width,
              height: WINDOW.height,
            }}
            {...popIn(i, !!reduceMotion)}
          >
            <ShopWindow item={item} visited={vocabulary.visited(item)} onPlay={() => vocabulary.play(item)} />
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

type ShopWindowProps = { item: VocabularyWord; visited: boolean; onPlay: () => void }

function ShopWindow({ item, visited, onPlay }: ShopWindowProps) {
  const { status, statusText } = useVocabularyCard(item, visited)
  const { card } = useKit()

  return (
    <button
      type="button"
      onClick={onPlay}
      data-highlight={status === 'playing' || undefined}
      className={cx(
        'pointer-events-auto relative block size-full cursor-pointer overflow-hidden select-none',
        card,
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
      )}
    >
      {/* Warm light inside the glass. */}
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-cream-light),var(--color-cover-cream)_75%)]" />
      <img src={item.image} alt="" draggable={false} className="pointer-events-none absolute top-[14px] left-[30px] h-[190px] w-[218px] object-contain" />
      {/* The sill, with the word and its speaker. */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[84px] border-t-[5px] border-comic-ink bg-cream" />
      <span className="absolute bottom-[4px] left-[104px] w-[150px] text-center font-heading text-[56px] leading-[1.4] font-bold text-navy">
        {item.word}
      </span>
      <span className="sr-only"> {statusText}</span>
      <SpeakerButton className="bottom-[8px] left-[28px] size-[66px]" playing={status === 'playing'} loading={status === 'loading'} />
    </button>
  )
}
