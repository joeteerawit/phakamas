import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { SpottingWord } from '../../../lessons'
import { spottingPicture, useSpellingPlaying, useSpotting } from '../../../steps/spotting/useSpotting'
import { creamCard, cx, pressable } from '../../../ui/clay/buttonClass'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import type { StepProps } from '../../../steps/stepProps'

const CARD_LEFTS = [251, 744, 1237]

/**
 * Step 4 (design DAHZj0Nxyxs pages 3–4): one set of three words at a time on the pond. Tapping a card plays
 * the word, sweeps its spelling pill part by part and makes the red final ง glow.
 */
export function SpottingStep({ lesson }: StepProps) {
  const { sets, setIndex, direction, words, explaining, explain, showSet, play, activePart } = useSpotting(lesson)
  const reduceMotion = useReducedMotion()

  return (
    <section data-full-stage aria-label={`คำในมาตรา${lesson.finalGroup}`} className="relative size-full">
      {/* Set buttons left of the Step pill (844–1076, centre 960) and the explanation speaker right of it, both 48px away and level with it. */}
      <div role="group" aria-label="เลือกชุดคำ" className="absolute top-[27px] right-[1124px] flex gap-[24px]">
        {sets.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`ชุดคำที่ ${i + 1}`}
            aria-pressed={i === setIndex}
            onClick={() => showSet(i)}
            className={cx(
              pressable,
              'flex size-[124px] items-center justify-center rounded-full border-[6px] border-comic-ink font-heading text-[56px] font-bold shadow-comic',
              i === setIndex ? 'bg-navy text-card' : 'bg-pill text-navy',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="absolute top-[27px] left-[1124px] size-[124px]">
        <SpeakerButton label="ฟังคำอธิบาย" onClick={explain} playing={explaining} className="inset-0 size-full" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={setIndex}
          className="absolute inset-0"
          initial={reduceMotion ? false : { x: direction * 240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { x: direction * -240, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {words.map((word, i) => (
            <li key={word.audio.id}>
              <SpottingCard
                word={word}
                left={CARD_LEFTS[i] ?? 0}
                activePart={activePart(word)}
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
  const playing = useSpellingPlaying(word)
  const glowing = activePart !== null
  const text = word.audio.text

  return (
    <>
      <button
        type="button"
        aria-label={`ฟังคำว่า ${text}`}
        data-glowing={glowing}
        data-highlight={glowing || undefined}
        onClick={onPlay}
        style={{ left }}
        className={cx(pressable, creamCard, 'absolute top-[165px] h-[639px] w-[432px]')}
      >
        <img
          src={spottingPicture(word)}
          alt=""
          draggable={false}
          className="absolute top-[40px] left-[40px] h-[380px] w-[352px] object-contain"
        />
        {/* Speaker and word centred as a group, so a wide word (ช้าง) keeps room from the card's edges. */}
        <span className="absolute inset-x-0 top-[444px] flex items-center justify-center gap-[24px]">
          <span className="relative size-[120px] shrink-0">
            <SpeakerButton className="inset-0 size-full" playing={playing} />
          </span>
          <span className="font-heading text-[108px] leading-[1.2] font-bold whitespace-nowrap text-navy">
            {word.syllables.map(({ text: syllable, final }, i) => (
              <span key={i}>
                {syllable.slice(0, final)}
                <motion.span
                  className="text-final"
                  animate={
                    glowing && !reduceMotion
                      ? { textShadow: ['0 0 0px currentColor', '0 0 28px currentColor', '0 0 0px currentColor'] }
                      : { textShadow: '0 0 0px currentColor' }
                  }
                  transition={glowing && !reduceMotion ? { duration: 0.9, repeat: Infinity } : { duration: 0 }}
                >
                  {syllable[final]}
                </motion.span>
                {syllable.slice(final + 1)}
              </span>
            ))}
          </span>
        </span>
      </button>
      <p
        data-testid={`spelling-${text}`}
        style={{ left }}
        className="absolute top-[845px] flex min-h-[119px] w-[432px] flex-wrap items-center justify-center rounded-[48px] border-[5px] border-comic-ink bg-cream px-[36px] py-[10px] shadow-comic font-heading text-[46px] leading-[1.4] font-bold text-foreground"
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
