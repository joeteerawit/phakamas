import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { playClip, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { VocabularyWord } from '../lessons'
import { creamCard, cx } from './clay/buttonClass'
import { popIn } from './motion/PopIn'
import { SpeakerButton } from './SpeakerButton'
import type { StepProps } from './stepProps'

/** Card lefts in stage pixels, from design DAHZj0Nxyxs page 2. */
const cardLefts = [137, 429, 720, 1011, 1302, 1594]

// Visually hidden; keeps the card's state in its accessible name.
const statusText: Record<AudioStatus | 'visited', string> = {
  idle: 'แตะฟังเสียง',
  visited: 'ฟังแล้ว',
  loading: 'กำลังโหลด',
  playing: 'กำลังเล่น',
  error: 'ลองอีกครั้ง',
}

/** Step 2 (design page 2): six picture cards; tapping one plays its word. */
export function VocabularyStep({ lesson }: StepProps) {
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set())
  const reduceMotion = useReducedMotion()

  return (
    <section data-full-stage className="relative size-full">
      {/* Design puts the pill at left 1387; it ends at 1600 here to clear the shared mute button at 1620. */}
      <p className="absolute top-[58px] right-[320px] flex h-[71px] items-center rounded-full border-4 border-card bg-pill px-[28px] font-heading text-[38px] font-bold whitespace-nowrap text-navy">
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
            <VocabularyCard
              item={item}
              visited={visited.has(item.audio.id)}
              onPlay={() => {
                setVisited((old) => new Set(old).add(item.audio.id))
                playClip(item.audio)
              }}
            />
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

type VocabularyCardProps = { item: VocabularyWord; visited: boolean; onPlay: () => void }

function VocabularyCard({ item, visited, onPlay }: VocabularyCardProps) {
  const status = useClipStatus(item.audio.id)
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
      className={cx(
        'pointer-events-auto relative block size-full cursor-pointer select-none',
        creamCard,
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
        status === 'playing' && 'ring-8 ring-pill',
      )}
    >
      <img
        src={item.image}
        alt=""
        draggable={false}
        className="pointer-events-none absolute top-[22px] left-[8px] h-[249px] w-[239px] object-contain"
      />
      <span className="absolute top-[266px] left-[124px] w-[127px] text-center font-heading text-[56px] leading-[1.4] font-bold text-navy">
        {item.word}
      </span>
      <span className="sr-only"> {statusText[status === 'idle' && visited ? 'visited' : status]}</span>
      <SpeakerButton className="top-[271px] left-[43px] size-[71px]" playing={status === 'playing'} loading={status === 'loading'} />
    </button>
  )
}
