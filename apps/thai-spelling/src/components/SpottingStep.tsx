import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip } from '../audio/audioManager'
import type { SpottingWord } from '../lessons'
import { cx } from './clay/buttonClass'
import type { StepProps } from './stepProps'

/** Each spelling part stays highlighted this long. shortcut: fixed timing, AudioManager exposes no clip duration. */
const PART_MS = 500
const CARD_LEFTS = [251, 744, 1237]
const SPEAKER = '/assets/canva/chrome/speaker-button.webp'
const picture = (word: SpottingWord) => `/assets/canva/vocabulary/${word.audio.id.split('/').pop()}.webp`

const pressable =
  'pointer-events-auto cursor-pointer select-none transition-transform duration-150 ease-out active:scale-95 motion-reduce:transition-none ' +
  'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring'

/**
 * Step 4 (design DAHZj0Nxyxs pages 3–4): one set of three words at a time on the pond. Tapping a card plays
 * the word, sweeps its spelling pill part by part and makes the red final ง glow.
 */
export function SpottingStep({ lesson }: StepProps) {
  const { explanation, sets } = lesson.spotting
  const reduceMotion = useReducedMotion()
  const [setIndex, setSetIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [sweep, setSweep] = useState<{ word: SpottingWord; part: number } | null>(null)

  useEffect(() => {
    if (!sweep) return
    const next = sweep.part + 1
    const timer = setTimeout(() => setSweep(next < sweep.word.spelling.length ? { ...sweep, part: next } : null), PART_MS)
    return () => clearTimeout(timer)
  }, [sweep])

  const showSet = (index: number) => {
    setDirection(index > setIndex ? 1 : -1)
    setSetIndex(index)
    setSweep(null)
  }
  const play = (word: SpottingWord) => {
    playClip(word.audio)
    setSweep({ word, part: 0 })
  }

  return (
    <section data-full-stage aria-label="คำในมาตราแม่กง" className="relative size-full">
      <div role="group" aria-label="เลือกชุดคำ" className="absolute top-[30px] left-[1150px] flex gap-[24px]">
        {sets.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`ชุดคำที่ ${i + 1}`}
            aria-pressed={i === setIndex}
            onClick={() => showSet(i)}
            className={cx(
              pressable,
              'flex size-[124px] items-center justify-center rounded-full border-[6px] border-card font-heading text-[56px] font-bold',
              i === setIndex ? 'bg-navy text-card' : 'bg-pill text-navy',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="ฟังคำอธิบาย"
        onClick={() => playClip(explanation)}
        className={cx(pressable, 'absolute top-[30px] left-[1470px] size-[124px]')}
      >
        <img src={SPEAKER} alt="" draggable={false} className="size-full object-contain" />
      </button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={setIndex}
          className="absolute inset-0"
          initial={reduceMotion ? false : { x: direction * 240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { x: direction * -240, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {sets[setIndex]?.map((word, i) => (
            <li key={word.audio.id}>
              <SpottingCard
                word={word}
                left={CARD_LEFTS[i] ?? 0}
                activePart={sweep?.word === word ? sweep.part : null}
                onPlay={() => play(word)}
              />
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  )
}

type SpottingCardProps = {
  word: SpottingWord
  left: number
  /** Index of the spelling part being read, or null when the word is not playing. */
  activePart: number | null
  onPlay: () => void
}

function SpottingCard({ word, left, activePart, onPlay }: SpottingCardProps) {
  const reduceMotion = useReducedMotion()
  const glowing = activePart !== null
  const text = word.audio.text

  return (
    <>
      <button
        type="button"
        aria-label={`ฟังคำว่า ${text}`}
        data-glowing={glowing}
        onClick={onPlay}
        style={{ left }}
        className={cx(pressable, 'absolute top-[165px] h-[639px] w-[432px] rounded-[48px] border-4 border-dashed border-cream-border bg-cream')}
      >
        <img
          src={picture(word)}
          alt=""
          draggable={false}
          className="absolute top-[40px] left-[40px] h-[380px] w-[352px] object-contain"
        />
        <img src={SPEAKER} alt="" draggable={false} className="absolute top-[458px] left-[73px] size-[120px]" />
        <span className="absolute top-[444px] left-[196px] w-[228px] text-center font-heading text-[108px] leading-[1.2] font-bold text-navy">
          {word.syllables.map(({ text: syllable, final }, i) => (
            <span key={i}>
              {syllable.slice(0, final)}
              <motion.span
                className="text-final"
                animate={
                  glowing && !reduceMotion
                    ? { textShadow: ['0 0 0px #ff3131', '0 0 28px #ff3131', '0 0 0px #ff3131'] }
                    : { textShadow: '0 0 0px #ff3131' }
                }
                transition={glowing && !reduceMotion ? { duration: 0.9, repeat: Infinity } : { duration: 0 }}
              >
                {syllable[final]}
              </motion.span>
              {syllable.slice(final + 1)}
            </span>
          ))}
        </span>
      </button>
      <p
        data-testid={`spelling-${text}`}
        style={{ left }}
        className="absolute top-[845px] flex min-h-[119px] w-[432px] flex-wrap items-center justify-center rounded-[48px] border-4 border-dashed border-foreground bg-card px-[12px] font-heading text-[46px] leading-[1.4] font-bold text-foreground"
      >
        {word.spelling.map((part, i) => (
          <span key={i} className="whitespace-nowrap">
            <span
              data-active={i === activePart || undefined}
              className={cx(
                'rounded-[12px] px-[2px] transition-colors duration-150 motion-reduce:transition-none',
                i === activePart && 'bg-pill text-navy',
              )}
            >
              {part}
            </span>
            {i < word.spelling.length - 1 && '-'}
          </span>
        ))}
      </p>
    </>
  )
}
