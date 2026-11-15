import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { VocabularyWord } from '../../../lessons'
import { useLessonSession } from '../../../session/lessonSession'
import { useVocabulary, useVocabularyCard } from '../../../steps/vocabulary/useVocabulary'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { ink } from '../kit/ink'

// Stage pixels. Six 200 px columns (320–1600, 16 px apart) along the terrace, clear of the leaves swaying at the
// window's sides (x < 300 and x > 1620). In each: the seed packet that grows (340–630) over its soil plot (630–740).
// น้องนก flies in the lane above the row (160–330), so her can and its water never pass over a word.
const COLUMN = { left: 320, width: 200, gap: 16, top: 340, height: 420 }
const left = (i: number) => COLUMN.left + i * (COLUMN.width + COLUMN.gap)
const LANE = { top: 168, width: 150, height: 160 }
// The gate on the path to the next stop and ไปต่อ, at the bottom right, clear of the leaves and of Next (from 1740).
const AHEAD = { left: 1376, top: 880, width: 224, height: 124 }
/** How long น้องนก waters a plot before its packet grows. */
const WATER_MS = 800

/**
 * แม่กก Step 2, water the plots (docs/mae-kok-spec.md): six bare soil plots sit in a row on the terrace. Tapping a plot
 * sends น้องนก along the lane above the row to tip her watering can over it, never over a word; then a seed-packet
 * card rises from the soil with the picture and word, and the word plays (Step 2's shared behaviour). Tapping a grown
 * card plays it again. Once all six have grown, the gate on the path opens and ไปต่อ leads on to the next stop. Under
 * reduced motion the card appears at once, น้องนก is simply there and the can does not tip.
 */
export function VocabularyStep({ lesson }: StepProps) {
  const vocabulary = useVocabulary()
  const reduceMotion = !!useReducedMotion()
  const { poses } = useMascot()
  const [watering, setWatering] = useState<number | null>(null)
  const [over, setOver] = useState(0)
  const grown = lesson.vocabulary.filter((item) => vocabulary.visited(item)).length
  const open = grown === lesson.vocabulary.length

  const { play } = vocabulary
  // The packet grows once the watering is done; the latest `play` is read then.
  const latestPlay = useRef(play)
  useEffect(() => {
    latestPlay.current = play
  })
  useEffect(() => {
    if (watering === null) return
    const item = lesson.vocabulary[watering]!
    const timer = setTimeout(() => {
      setWatering(null)
      latestPlay.current(item)
    }, WATER_MS)
    return () => clearTimeout(timer)
  }, [watering, lesson.vocabulary])

  const tap = (i: number) => {
    const item = lesson.vocabulary[i]!
    setOver(i)
    if (vocabulary.visited(item)) return play(item)
    if (watering !== null) return
    if (reduceMotion) return play(item)
    setWatering(i)
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-soil-deep">
      {/* น้องนก in the lane above the row, her watering can tipping over the plot she is watering. */}
      <motion.div
        data-testid="watering-mascot"
        data-over={over}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ top: LANE.top, width: LANE.width, height: LANE.height }}
        initial={false}
        animate={{ left: left(over) + COLUMN.width / 2 - LANE.width / 2 - 30 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 20 }}
      >
        <img src={poses.greet} alt="" draggable={false} className="absolute top-0 left-0 h-[150px] w-[130px] object-contain select-none" />
        <motion.svg
          data-testid="watering-can"
          data-tipping={watering !== null || undefined}
          viewBox="0 0 90 70"
          className="absolute top-[70px] left-[110px] w-[90px] origin-[20px_40px] overflow-visible"
          initial={false}
          animate={{ rotate: watering !== null && !reduceMotion ? 38 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <path d="M10 22 H56 V62 H10 Z" fill="var(--color-ridge)" {...ink} />
          <path d="M56 32 L86 14 L88 22 L60 46" fill="var(--color-ridge)" {...ink} strokeWidth={4} />
          <path d="M14 22 Q33 0 52 22" fill="none" {...ink} />
        </motion.svg>
      </motion.div>
      <AnimatePresence>
        {watering !== null && !reduceMotion && (
          <motion.div
            key={watering}
            data-testid="water"
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ left: left(watering) + 60, top: 290, width: 90, height: 340 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2, 3].map((d) => (
              <motion.span
                key={d}
                className="absolute top-0 h-[26px] w-[14px] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-[3px] border-soil-deep bg-[#7cc8f0]"
                style={{ left: d * 22 }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 320, opacity: [1, 1, 0] }}
                transition={{ duration: 0.6, delay: d * 0.08, repeat: 1 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ul>
        {lesson.vocabulary.map((item, i) => (
          <li key={item.audio.id} className="absolute" style={{ left: left(i), top: COLUMN.top, width: COLUMN.width, height: COLUMN.height }}>
            <Plot item={item} index={i} grown={vocabulary.visited(item)} watering={watering === i} still={reduceMotion} onTap={() => tap(i)} />
          </li>
        ))}
      </ul>

      <p
        role="status"
        className="kraft-label absolute top-[880px] left-[330px] flex h-[90px] items-center px-[32px] text-[40px] font-bold whitespace-nowrap"
      >
        {open ? `ผักขึ้นครบ ${grown} แปลงแล้ว ประตูเปิดแล้ว` : `แตะแปลงดินให้น้องนกรดน้ำ (${grown}/${lesson.vocabulary.length})`}
      </p>

      <Gate open={open} still={reduceMotion} />
      {open && (
        <Link
          to="/lesson/$lessonId/$step"
          params={{ lessonId: lesson.id, step: '3' }}
          onClick={() => useLessonSession.getState().completeStep(2)}
          data-main
          className="pot-button pointer-events-auto absolute flex cursor-pointer items-center justify-center font-heading text-[44px] font-bold whitespace-nowrap select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
          style={AHEAD}
        >
          <span className="relative mt-[10px]">ไปต่อ</span>
          <ChevronRight aria-hidden="true" className="relative -me-[6px] mt-[10px] size-[42px] shrink-0" strokeWidth={3.5} />
        </Link>
      )}
    </section>
  )
}

type PlotProps = { item: VocabularyWord; index: number; grown: boolean; watering: boolean; still: boolean; onTap: () => void }

/** One soil plot and the seed packet that grows from it; the whole column is the button. */
function Plot({ item, index, grown, watering, still, onTap }: PlotProps) {
  const { card } = useKit()
  const { status, statusText } = useVocabularyCard(item, grown)
  const playing = status === 'playing'

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={grown ? `${item.word} ${statusText}` : `แปลงที่ ${index + 1} ${watering ? 'กำลังรดน้ำ' : 'แตะรดน้ำ'}`}
      data-grown={grown || undefined}
      className="pointer-events-auto relative block size-full cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {/* The packet rises out of the soil: it is clipped at the plot's top edge. */}
      <span className="pointer-events-none absolute inset-x-[-12px] top-[-12px] block h-[312px] overflow-hidden">
        <AnimatePresence>
          {grown && (
            <motion.span
              data-testid="plot-card"
              data-highlight={playing || undefined}
              className={cx('absolute top-[12px] left-[12px] block h-[290px] w-[200px]', card)}
              initial={still ? false : { y: 300 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 170, damping: 18 }}
            >
              <img src={item.image} alt="" draggable={false} className="absolute top-[30px] left-[25px] size-[150px] object-contain" />
              <span className="absolute inset-x-0 bottom-[14px] text-center text-[60px] leading-[1.3] font-bold">{item.word}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {/* The plot: a mound of turned soil, darker once watered. */}
      <span
        data-testid="plot-soil"
        className={cx(
          'pointer-events-none absolute inset-x-0 top-[290px] h-[110px] rounded-[50%_50%_24px_24px/60%_60%_24px_24px] border-[6px] border-soil-deep shadow-[0_8px_0_rgb(58_34_16/0.4)] transition-colors duration-300 motion-reduce:transition-none',
          grown || watering ? 'bg-soil' : 'bg-[#a77a50]',
        )}
      >
        <span className="absolute inset-x-[24px] top-[30px] h-[6px] rounded-full bg-soil-deep/40" />
        <span className="absolute inset-x-[34px] top-[56px] h-[6px] rounded-full bg-soil-deep/40" />
      </span>
      {grown && <SpeakerButton className="top-[318px] left-[136px] size-[60px]" playing={playing} loading={status === 'loading'} />}
    </button>
  )
}

/** The wooden garden gate on the path ahead: shut until every plot has grown, then its two doors swing open. */
function Gate({ open, still }: { open: boolean; still: boolean }) {
  const door = (side: 'left' | 'right') => (
    <motion.span
      className={cx('absolute top-[20px] h-[110px] w-[120px] border-[5px] border-soil-deep bg-[repeating-linear-gradient(90deg,var(--color-plank)_0_20px,#8c5c2c_20px_24px)]', side === 'left' ? 'left-[-10px] origin-left' : 'right-[-10px] origin-right')}
      initial={false}
      animate={{ rotateY: open ? (side === 'left' ? -75 : 75) : 0 }}
      transition={still ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
    />
  )
  return (
    <div aria-hidden="true" data-testid="gate" data-open={open || undefined} className="pointer-events-none absolute top-[862px] left-[1376px] h-[150px] w-[224px] [perspective:600px]">
      {door('left')}
      {door('right')}
      <span className="absolute top-0 left-[-24px] h-[150px] w-[24px] rounded-t-[8px] border-[5px] border-soil-deep bg-plank" />
      <span className="absolute top-0 right-[-24px] h-[150px] w-[24px] rounded-t-[8px] border-[5px] border-soil-deep bg-plank" />
    </div>
  )
}
