import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { VocabularyWord } from '../../../lessons'
import { useLessonSession } from '../../../session/lessonSession'
import { useVocabulary, useVocabularyCard } from '../../../steps/vocabulary/useVocabulary'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { SpeakerButton } from '../../../ui/SpeakerButton'

// Stage pixels. Six 200 px columns (320–1600, 16 px apart) along the bank, clear of the drops falling down the
// window's sides (x < 300 and x > 1620). In each: the taro leaf over the picture's pocket (380–560), the word's
// pebble under it (600–700) and the stalk down to the bank. A closed leaf covers its pocket; a lifted one rises to about 210–375, under the title row and clear of its picture.
const COLUMN = { left: 320, width: 200, gap: 16, top: 300, height: 520 }
const left = (i: number) => COLUMN.left + i * (COLUMN.width + COLUMN.gap)
// The stones to the next stop and ไปต่อ, along the bottom right, clear of the drops (x > 1620) and of Next (from 1740).
const AHEAD = { left: 1376, top: 870, width: 224, height: 124 }
const STONES = [1090, 1160, 1230, 1300]

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 6, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/**
 * แม่กบ Step 2, peek under the leaves (docs/mae-kop-spec.md): six big taro leaves stand on their stalks along the bank,
 * each with a raindrop beaded on top. Tapping a leaf tips its drop off the far edge, up and away from the words, and
 * the leaf lifts to show the picture sheltering underneath in a raincoat pocket, and plays its word (Step 2's shared
 * behaviour). Each word sits on a pebble under its leaf. When all six are lifted, stepping stones rise from the water
 * and ไปต่อ leads on to the next stop. Under reduced motion the leaf simply shows lifted and the stones simply appear.
 */
export function VocabularyStep({ lesson }: StepProps) {
  const vocabulary = useVocabulary()
  const reduceMotion = !!useReducedMotion()
  const { card } = useKit()
  const lifted = lesson.vocabulary.filter((item) => vocabulary.visited(item)).length
  const open = lifted === lesson.vocabulary.length

  return (
    <section data-full-stage className="relative size-full">
      <ul>
        {lesson.vocabulary.map((item, i) => (
          <li key={item.audio.id} className="absolute" style={{ left: left(i), top: COLUMN.top, width: COLUMN.width, height: COLUMN.height }}>
            <Leaf item={item} lifted={vocabulary.visited(item)} still={reduceMotion} card={card} onPlay={() => vocabulary.play(item)} />
          </li>
        ))}
      </ul>

      <p
        role="status"
        className="drop-label absolute top-[870px] left-[330px] flex h-[90px] items-center px-[32px] font-heading text-[40px] font-bold whitespace-nowrap text-pond-deep"
      >
        {open ? `เปิดใบบอนครบ ${lifted} ใบแล้ว ข้ามก้อนหินไปต่อกันเลย` : `แตะใบบอนเพื่อดูภาพข้างใต้ (${lifted}/${lesson.vocabulary.length})`}
      </p>

      <div aria-hidden="true" data-testid="ahead-stones" className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {open &&
            STONES.map((x, i) => (
              <motion.span
                key={x}
                data-testid="ahead-stone"
                className="absolute top-[976px] h-[40px] w-[60px] rounded-[50%] border-[5px] border-rubber-deep bg-[#c9d3dc]"
                style={{ left: x }}
                initial={reduceMotion ? false : { y: 40, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: reduceMotion ? 0 : i * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
              />
            ))}
        </AnimatePresence>
      </div>

      {open && (
        <Link
          to="/lesson/$lessonId/$step"
          params={{ lessonId: lesson.id, step: '3' }}
          onClick={() => useLessonSession.getState().completeStep(2)}
          className="vinyl-button pointer-events-auto absolute flex cursor-pointer items-center justify-center font-heading text-[44px] font-bold whitespace-nowrap select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
          style={AHEAD}
        >
          <span className="relative">ไปต่อ</span>
          <ChevronRight aria-hidden="true" className="relative -me-[6px] size-[42px] shrink-0" strokeWidth={3.5} />
        </Link>
      )}
    </section>
  )
}

type LeafProps = { item: VocabularyWord; lifted: boolean; still: boolean; card: string; onPlay: () => void }

/** One taro leaf over its picture, the word on a pebble under it; the whole column is the button. */
function Leaf({ item, lifted, still, card, onPlay }: LeafProps) {
  const { status, statusText } = useVocabularyCard(item, lifted)
  const playing = status === 'playing'

  return (
    <button
      type="button"
      onClick={onPlay}
      data-lifted={lifted || undefined}
      className="pointer-events-auto relative block size-full cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {/* The stalk, from the leaf down to the bank. */}
      <span aria-hidden="true" className="pointer-events-none absolute top-[200px] left-[92px] h-[320px] w-[16px] rounded-full border-[4px] border-rubber-deep bg-lily-deep" />

      {/* The picture's pocket, sheltering under the leaf. */}
      <span
        data-testid="leaf-pocket"
        data-highlight={playing || undefined}
        className={cx('pointer-events-none absolute top-[80px] left-[10px] block h-[180px] w-[180px] overflow-hidden', card)}
      >
        {lifted && (
          <motion.img
            src={item.image}
            alt=""
            draggable={false}
            className="absolute inset-[14px] size-[140px] object-contain"
            initial={still ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.4 }}
          />
        )}
      </span>

      {/* The leaf: closed over the pocket, or lifted up and back off it. Its drop sits on top until it tips off. */}
      <motion.span
        data-testid="taro-leaf"
        aria-hidden="true"
        className="pointer-events-none absolute -top-[10px] -left-[10px] block h-[280px] w-[220px] origin-[110px_260px]"
        initial={false}
        animate={lifted ? { y: -190, rotate: -16, scaleY: 0.6 } : { y: 0, rotate: 0, scaleY: 1 }}
        transition={still ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 16 }}
      >
        <svg viewBox="0 0 220 230" preserveAspectRatio="none" className="size-full overflow-visible">
          <path d="M110 220 C-10 214 -20 80 40 40 C80 14 140 14 180 40 C240 80 230 214 110 220 Z" fill="var(--color-lily)" {...ink} />
          <path d="M110 220 V40 M110 140 L44 72 M110 140 L176 72 M110 190 L40 150 M110 190 L180 150" fill="none" stroke="#b8e6a0" strokeWidth={7} strokeLinecap="round" />
        </svg>
      </motion.span>
      <AnimatePresence>
        {!lifted && (
          <motion.span
            data-testid="leaf-drop"
            aria-hidden="true"
            className="pointer-events-none absolute top-[40px] left-[132px] block h-[44px] w-[34px]"
            // It rolls off the leaf's far (top-right) edge, up and away from the pebble and its word.
            exit={still ? { opacity: 0, transition: { duration: 0 } } : { x: 70, y: -90, opacity: 0, transition: { duration: 0.45, ease: 'easeIn' } }}
          >
            <svg viewBox="0 0 34 44" className="size-full overflow-visible">
              <path d="M17 2 C24 16 32 24 32 31 C32 38 25 42 17 42 C9 42 2 38 2 31 C2 24 10 16 17 2 Z" fill="var(--color-pond-light)" stroke="var(--color-rubber-deep)" strokeWidth={4} />
              <path d="M10 28 Q12 22 16 20" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>

      {/* The word on its pebble, with the snail speaker beside it while the word plays. */}
      <span className="pointer-events-none absolute top-[300px] left-0 flex h-[110px] w-[200px] items-center justify-center rounded-[50%] border-[5px] border-rubber-deep bg-[#c9d3dc] shadow-[0_8px_0_rgb(51_63_75/0.4)]">
        <span className="font-heading text-[60px] leading-[1.4] font-bold text-rubber-deep">{item.word}</span>
      </span>
      <span className="sr-only"> {statusText}</span>
      <SpeakerButton className="top-[420px] left-[64px] size-[72px]" playing={playing} loading={status === 'loading'} />
    </button>
  )
}
