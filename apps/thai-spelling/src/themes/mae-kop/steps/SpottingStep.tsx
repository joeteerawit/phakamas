import { RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip, useClipStatus } from '../../../audio/audioManager'
import { spottingPicture } from '../../../steps/spotting/useSpotting'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { stonesOf } from './stones'

/** How long a found word stays before the next one surfaces, so its clip can play. */
const NEXT_WORD_MS = 1200
// Stage pixels: the stream across the middle (300–1620 × 520–800), its stones 200 wide, 40 apart, centred on x = 960.
const STONE = { width: 200, height: 170, gap: 40, top: 580 }
const stoneLeft = (i: number, count: number) => 960 - (count * STONE.width + (count - 1) * STONE.gap) / 2 + i * (STONE.width + STONE.gap)
const label = 'drop-label px-[28px] font-heading text-[38px] leading-[1.4] font-bold whitespace-nowrap text-pond-deep'

type Hint = { word: string; message: string }

/**
 * แม่กบ Step 4, tap the last stone (docs/mae-kop-spec.md), over the kop-drizzle Scene. The six words cross the stream one
 * at a time, each laid on stepping stones one letter per stone. Tapping the final consonant's stone plays the word,
 * turns the stone raincoat yellow and dips it with a ripple; then the next word's stones surface. A wrong stone wobbles
 * and plays a hint: the word's slow spelling, or for the teaching-point word (ภาพ, whose final is not บ) the Step's
 * explanation that its พ sounds like บ. The snail speaker plays the explanation at any time. No timer; under reduced
 * motion nothing dips, ripples, wobbles or slides.
 */
export function SpottingStep({ lesson }: StepProps) {
  const { heading, explanation, sets } = lesson.spotting
  const words = sets.flat()
  const reduceMotion = !!useReducedMotion()
  const { card, Button } = useKit()
  const [index, setIndex] = useState(0)
  const [found, setFound] = useState<ReadonlySet<number>>(() => new Set())
  const [wobble, setWobble] = useState<{ stone: number; round: number } | null>(null)
  const [hint, setHint] = useState<Hint | null>(null)
  const explaining = useClipStatus(explanation.id) === 'playing'
  const done = index >= words.length
  const word = words[Math.min(index, words.length - 1)]!
  const stones = stonesOf(word)
  const wordFound = stones.every((stone, i) => !stone.final || found.has(i))

  // Once every final of the word is found, the next word surfaces on its own.
  useEffect(() => {
    if (done || !wordFound) return
    const timer = setTimeout(() => {
      setIndex((i) => i + 1)
      setFound(new Set())
      setWobble(null)
      setHint(null)
    }, NEXT_WORD_MS)
    return () => clearTimeout(timer)
  }, [done, wordFound])

  const tap = (i: number) => {
    if (wordFound) return
    if (stones[i]!.final) {
      setFound((old) => new Set(old).add(i))
      setHint(null)
      return playClip(word.audio)
    }
    setWobble((old) => ({ stone: i, round: (old?.round ?? 0) + 1 }))
    // The teaching point: a final that is not บ still sounds like บ.
    const odd = word.syllables.map(({ text, final }) => text[final]!).find((letter) => letter !== 'บ')
    if (odd) {
      playClip(explanation)
      setHint({ word: word.audio.text, message: `ตัว ${odd} ในคำว่า ${word.audio.text} ออกเสียงเหมือน บ ลองหาตัวสะกดอีกครั้งนะ` })
    } else {
      playClip(word.spellingAudio)
      setHint({ word: word.audio.text, message: `ยังไม่ใช่ ฟังการสะกดคำว่า ${word.audio.text} แล้วแตะตัวสะกดนะ` })
    }
  }

  const again = () => {
    setIndex(0)
    setFound(new Set())
    setWobble(null)
    setHint(null)
  }

  return (
    <section data-full-stage aria-label={`คำในมาตรา${lesson.finalGroup}`} className="relative size-full font-heading text-pond-deep">
      <h2 className={cx(label, 'absolute top-[166px] left-1/2 -translate-x-1/2')}>{heading}</h2>

      <div className="absolute top-[262px] left-[330px] flex w-[200px] flex-col items-center gap-[10px]">
        <div className="relative h-[150px] w-[170px]">
          <SpeakerButton label="ฟังคำอธิบาย" onClick={() => playClip(explanation)} playing={explaining} className="inset-0 size-full" />
        </div>
        <p aria-hidden="true" className={cx(label, 'px-[18px] text-[30px]')}>
          ฟังคำอธิบาย
        </p>
      </div>

      {/* The stream, still, so nothing moving runs under the letters. */}
      <div
        aria-hidden="true"
        data-testid="stream"
        className="pointer-events-none absolute top-[520px] left-[300px] h-[280px] w-[1320px] rounded-[140px] border-[6px] border-pond-deep bg-[repeating-linear-gradient(170deg,var(--color-pond)_0_60px,#1a8f89_60px_70px)]"
      />

      <AnimatePresence mode="wait" initial={false}>
        {!done && (
          <motion.div
            key={word.audio.id}
            data-testid="stone-word"
            data-word={word.audio.text}
            className="absolute inset-0"
            initial={reduceMotion ? { opacity: 0 } : { y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { y: 70, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 18 }}
          >
            {/* The word's picture in a raincoat pocket on the bank above the stream. */}
            <span data-testid="stone-picture" className={cx('pointer-events-none absolute top-[262px] left-[860px] block size-[200px]', card)}>
              <img src={spottingPicture(word)} alt="" draggable={false} className="absolute inset-[16px] size-[156px] object-contain" />
            </span>
            <ol aria-label={`คำว่า ${word.audio.text}`}>
              {stones.map((stone, i) => (
                <li key={i}>
                  <StoneButton
                    text={stone.text}
                    position={i + 1}
                    found={found.has(i)}
                    wobble={wobble?.stone === i ? wobble.round : 0}
                    left={stoneLeft(i, stones.length)}
                    still={reduceMotion}
                    onTap={() => tap(i)}
                  />
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={cx(label, 'absolute top-[860px] left-[330px]')}>
        {done ? `ครบ ${words.length} คำ` : `คำที่ ${index + 1}/${words.length}`}
      </p>
      <div role="status" aria-live="polite" data-testid="stone-messages" className="absolute top-[850px] left-[640px] flex w-[880px] justify-center text-center">
        {done ? (
          <p className={cx(label, 'text-[40px]')}>เก่งมาก! หาตัวสะกดครบ {words.length} คำแล้ว</p>
        ) : wordFound ? (
          <p className={cx(label, 'text-[40px]')}>ถูกต้อง! {word.audio.text}</p>
        ) : (
          hint && <p className={cx(label, 'text-[32px] whitespace-normal text-balance')}>{hint.message}</p>
        )}
      </div>
      {done && (
        <Button onClick={again} className="absolute top-[580px] left-[810px] flex h-[124px] w-[300px] items-center justify-center gap-[12px] text-[40px] font-bold">
          <RotateCcw aria-hidden="true" className="relative size-[48px]" strokeWidth={3} />
          <span className="relative">ฝึกอีกรอบ</span>
        </Button>
      )}
    </section>
  )
}

type StoneButtonProps = {
  text: string
  position: number
  found: boolean
  /** Bumped on each wrong tap of this stone, so the wobble replays; 0 = still. */
  wobble: number
  left: number
  still: boolean
  onTap: () => void
}

/** One stepping stone with its letters: it wobbles when wrong; the final turns raincoat yellow and dips with a ripple. */
function StoneButton({ text, position, found, wobble, left, still, onTap }: StoneButtonProps) {
  return (
    <button
      type="button"
      aria-label={found ? `${text} ตัวสะกด` : `${text} ตัวที่ ${position}`}
      aria-pressed={found}
      data-found={found || undefined}
      onClick={onTap}
      className="pointer-events-auto absolute cursor-pointer rounded-[50%] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      style={{ left, top: STONE.top, width: STONE.width, height: STONE.height }}
    >
      {found && !still && (
        <motion.span
          data-testid="stone-ripple"
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[20px] rounded-[50%] border-[6px] border-pond-light"
          initial={{ scale: 0.7, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
      <motion.span
        key={wobble}
        data-testid="stone"
        className={cx(
          'absolute inset-0 flex items-center justify-center rounded-[50%] border-[6px] border-rubber-deep shadow-[0_10px_0_rgb(51_63_75/0.45)] transition-colors duration-200 motion-reduce:transition-none',
          found ? 'bg-raincoat' : 'bg-[radial-gradient(ellipse_at_40%_30%,#e1e7ec,#a7b4c0)]',
        )}
        initial={false}
        animate={still ? undefined : found ? { y: [0, 18, 10] } : wobble ? { rotate: [0, -9, 9, -6, 6, 0] } : undefined}
        transition={{ duration: found ? 0.5 : 0.45 }}
      >
        <span className="font-heading text-[110px] leading-[1.3] font-bold text-rubber-deep">{text}</span>
      </motion.span>
    </button>
  )
}
