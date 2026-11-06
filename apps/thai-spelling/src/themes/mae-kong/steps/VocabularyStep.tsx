import { motion, useAnimate, useReducedMotion } from 'motion/react'
import type { VocabularyWord } from '../../../lessons'
import { useVocabulary, useVocabularyCard } from '../../../steps/vocabulary/useVocabulary'
import { creamCard, cx } from '../../../ui/clay/buttonClass'
import { popIn } from '../../../ui/motion/PopIn'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import type { StepProps } from '../../../steps/stepProps'

/** Card lefts in stage pixels: design DAHZj0Nxyxs page 2's spacing, moved 33px left so the row (104–1816) is centred on x = 960. */
const cardLefts = [104, 396, 687, 978, 1269, 1561]

/** Step 2 (design page 2): six picture cards; tapping one plays its word. */
export function VocabularyStep({ lesson }: StepProps) {
  const vocabulary = useVocabulary()
  const reduceMotion = useReducedMotion()

  return (
    <section data-full-stage className="relative size-full">
      {/* Centred over the card row on x = 960, clear of the top chrome, instead of the design's top right. */}
      <p className="absolute top-[236px] left-[960px] flex -translate-x-1/2 h-[71px] items-center rounded-full border-[5px] border-comic-ink bg-pill px-[28px] font-heading text-[38px] font-bold whitespace-nowrap text-navy shadow-comic">
        คลิกที่ภาพเพื่อฟังเสียง
      </p>
      <ul>
        {lesson.vocabulary.map((item, i) => (
          <motion.li
            key={item.audio.id}
            className="absolute top-[335px] h-[378px] w-[255px]"
            style={{ left: cardLefts[i] }}
            {...popIn(i, !!reduceMotion)}
          >
            <VocabularyCard item={item} visited={vocabulary.visited(item)} onPlay={() => vocabulary.play(item)} />
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

type VocabularyCardProps = { item: VocabularyWord; visited: boolean; onPlay: () => void }

function VocabularyCard({ item, visited, onPlay }: VocabularyCardProps) {
  const { status, statusText } = useVocabularyCard(item, visited)
  const [scope, animate] = useAnimate<HTMLButtonElement>()
  const reduceMotion = useReducedMotion()

  const tap = () => {
    onPlay()
    if (reduceMotion) return
    void animate(scope.current, { scale: [1, 1.08, 1] }, { duration: 0.35 })
    void animate('img', { rotate: [0, -8, 8, -4, 0] }, { duration: 0.5 })
  }

  return (
    <button
      ref={scope}
      type="button"
      onClick={tap}
      data-highlight={status === 'playing' || undefined}
      className={cx(
        'pointer-events-auto relative block size-full cursor-pointer select-none',
        creamCard,
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
      )}
    >
      <img
        src={item.image}
        alt=""
        draggable={false}
        className="pointer-events-none absolute top-[22px] left-[8px] h-[249px] w-[239px] object-contain"
      />
      <span className="absolute top-[266px] left-[114px] w-[117px] text-center font-heading text-[56px] leading-[1.4] font-bold text-navy">
        {item.word}
      </span>
      <span className="sr-only"> {statusText}</span>
      <SpeakerButton className="top-[271px] left-[43px] size-[71px]" playing={status === 'playing'} loading={status === 'loading'} />
    </button>
  )
}
