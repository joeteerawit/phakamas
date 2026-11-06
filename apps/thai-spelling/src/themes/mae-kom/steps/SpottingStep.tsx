import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { SpottingWord } from '../../../lessons'
import { spottingPicture, useSpellingPlaying, useSpotting } from '../../../steps/spotting/useSpotting'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { SpeakerButton } from '../../../ui/SpeakerButton'

// Stage pixels. kom-bus-stop.webp (425×1200) drawn 400 wide from y = 200, its pole running on past the stage's
// bottom. Its blank panel (32–392 × 59–427 of the art) is the word's button: 339×346 from y = 256, centred on
// x = 520, 960 and 1400, so all three signs sit clear of the leaves and snowflakes falling down the window's sides.
const SIGN_LEFTS = [321, 761, 1201]
const SIGN = { top: 200, width: 400, height: 1129 }
const PANEL = { left: 30, top: 56, width: 339, height: 346 }

/**
 * แม่กม Step 4 (docs/mae-kom-spec.md): one set of three words at a time on three bus-stop signs over the
 * kom-windy Scene, each word's final ม lit red in a black signal head like a traffic light. Tapping a sign
 * plays the word, sweeps its spelling pill part by part and makes the red light glow.
 */
export function SpottingStep({ lesson }: StepProps) {
  const { sets, setIndex, direction, words, explaining, explain, showSet, play, activePart } = useSpotting(lesson)
  const reduceMotion = useReducedMotion()
  const { Button } = useKit()

  return (
    <section data-full-stage aria-label={`คำในมาตรา${lesson.finalGroup}`} className="relative size-full">
      {/* As on แม่กง: set buttons left of the Step badge and the explanation speaker right of it, level with it; the chosen set's ice block is pressed in. */}
      <div role="group" aria-label="เลือกชุดคำ" className="absolute top-[27px] right-[1124px] flex gap-[24px]">
        {sets.map((_, i) => (
          <Button
            key={i}
            aria-label={`ชุดคำที่ ${i + 1}`}
            aria-pressed={i === setIndex}
            onClick={() => showSet(i)}
            className="relative flex size-[124px] items-center justify-center font-heading text-[56px] font-bold"
          >
            {i + 1}
          </Button>
        ))}
      </div>
      <div className="absolute top-[27px] left-[1124px] size-[124px]">
        <SpeakerButton label="ฟังคำอธิบาย" onClick={explain} playing={explaining} className="inset-0 size-full" />
      </div>

      {SIGN_LEFTS.map((left) => (
        <img
          key={left}
          src="/assets/comic/kom-bus-stop.webp"
          alt=""
          draggable={false}
          data-testid="bus-stop"
          className="pointer-events-none absolute select-none"
          style={{ left, top: SIGN.top, width: SIGN.width, height: SIGN.height }}
        />
      ))}

      {/* The signs stay; their words slide to the next set. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={setIndex}
          className="absolute inset-0"
          initial={reduceMotion ? false : { x: direction * 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { x: direction * -120, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {words.map((word, i) => (
            <li key={word.audio.id}>
              <BusStopSign word={word} left={SIGN_LEFTS[i] ?? 0} activePart={activePart(word)} onPlay={() => play(word)} />
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  )
}

type BusStopSignProps = {
  word: SpottingWord
  left: number
  /** Index of the spelling part being read, or null when the word is not playing. */
  activePart: number | null
  onPlay: () => void
}

function BusStopSign({ word, left, activePart, onPlay }: BusStopSignProps) {
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
        onClick={onPlay}
        style={{ left: left + PANEL.left, top: SIGN.top + PANEL.top, width: PANEL.width, height: PANEL.height }}
        className={cx(pressable, 'absolute rounded-[24px]')}
      >
        <img src={spottingPicture(word)} alt="" draggable={false} className="absolute top-[14px] left-[35px] h-[186px] w-[270px] object-contain" />
        <span className="absolute inset-x-0 top-[206px] flex items-center justify-center gap-[16px]">
          <span className="relative size-[96px] shrink-0">
            <SpeakerButton className="inset-0 size-full" playing={playing} />
          </span>
          <span className="font-heading text-[96px] leading-[1.25] font-bold whitespace-nowrap text-navy">
            {word.syllables.map(({ text: syllable, final }, i) => (
              <span key={i}>
                {syllable.slice(0, final)}
                {/* The final consonant as the red light of a signal head; it pulses while the word plays. */}
                <motion.span
                  data-testid="final-light"
                  className="mx-[4px] inline-block rounded-[22px] border-[4px] border-comic-ink bg-comic-ink px-[6px] text-final"
                  animate={
                    glowing && !reduceMotion
                      ? { textShadow: ['0 0 6px currentColor', '0 0 30px currentColor', '0 0 6px currentColor'] }
                      : { textShadow: '0 0 6px currentColor' }
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
      {/* On the pole under the panel. */}
      <p
        data-testid={`spelling-${text}`}
        style={{ left }}
        className="frost-label absolute top-[630px] flex min-h-[110px] w-[400px] items-center justify-center px-[28px] py-[8px] text-center font-heading text-[44px] leading-[1.4] font-bold text-balance text-foreground"
      >
        {/* Inline parts, so a spelling that needs two lines splits evenly. */}
        <span>
          {word.spelling.map((part, i) => (
            <span key={i} className="whitespace-nowrap">
              <span
                data-active={i === activePart || undefined}
                className={cx(
                  'rounded-[12px] px-[2px] transition-colors duration-150 motion-reduce:transition-none',
                  i === activePart && 'bg-ice-deep text-navy',
                )}
              >
                {part}
              </span>
              {i < word.spelling.length - 1 && '-'}
            </span>
          ))}
        </span>
      </p>
    </>
  )
}
