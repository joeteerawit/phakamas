import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { VocabularyWord } from '../../../lessons'
import { useLessonSession } from '../../../session/lessonSession'
import { useVocabulary, useVocabularyCard } from '../../../steps/vocabulary/useVocabulary'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { popIn } from '../../../ui/motion/PopIn'
import { SpeakerButton } from '../../../ui/SpeakerButton'

// Stage pixels. Six 192 px shops side by side (310–1462), each with one window, standing on the Scene's street
// (y = 1030); the street ahead (1474–1630) is barred until every window is lit. All of it stays clear of the leaves
// and snowflakes falling down the window's sides (x < 300 and x > 1640).
const SHOP = { left: 310, width: 192, bottom: 1030 }
const shops = [
  { top: 276, wall: 'bg-purple', awning: 'var(--color-final)' },
  { top: 306, wall: 'bg-sky-top', awning: 'var(--color-sign-blue)' },
  { top: 262, wall: 'bg-tint-lilac', awning: 'var(--color-banner)' },
  { top: 296, wall: 'bg-orange', awning: 'var(--color-final)' },
  { top: 270, wall: 'bg-tint-sky', awning: 'var(--color-sign-blue)' },
  { top: 300, wall: 'bg-banner', awning: 'var(--color-orange)' },
]
const WINDOW = { inset: 13, top: 384, width: 166, height: 350 }
const AHEAD = { left: 1474, width: 156, top: 912, height: 132 }
// น้องส้ม's greeting pose (487×800) at 170 px tall, her feet on the street in front of the shop doors; she starts
// left of the first shop, clear of the Back button.
const HER = { width: 103, height: 170, foot: 1062, start: 252 }
const shopCentre = (i: number) => SHOP.left + i * SHOP.width + SHOP.width / 2

/**
 * แม่กม Step 2, window shopping (docs/mae-kom-spec.md): a street of six shops drawn in CSS, their windows dark. Tapping
 * a shop's window, in the Kit's frosted frame, lights it, shows its picture and plays its word (Step 2's shared
 * behaviour), and น้องส้ม walks along the street to stand outside it. Once all six are lit the barrier across the
 * street ahead lifts and ไปต่อ leads on to the next stop. Under reduced motion she is simply there, the windows light
 * and the barrier goes without moving.
 */
export function VocabularyStep({ lesson }: StepProps) {
  const vocabulary = useVocabulary()
  const reduceMotion = !!useReducedMotion()
  const [at, setAt] = useState<number | null>(null)
  const lit = lesson.vocabulary.filter((item) => vocabulary.visited(item)).length
  const open = lit === lesson.vocabulary.length

  const choose = (item: VocabularyWord, i: number) => {
    vocabulary.play(item)
    setAt(i)
  }

  return (
    <section data-full-stage className="relative size-full">
      <p
        role="status"
        className="frost-label absolute top-[166px] left-[960px] flex h-[71px] -translate-x-1/2 items-center px-[28px] font-heading text-[38px] font-bold whitespace-nowrap text-navy"
      >
        {open ? `ไฟติดครบ ${lit} ร้านแล้ว ไปต่อกันเลย` : `แตะหน้าต่างร้านให้ไฟติด (${lit}/${lesson.vocabulary.length})`}
      </p>

      <Barrier open={open} />

      <div aria-hidden="true" data-testid="shop-row" className="pointer-events-none absolute inset-0">
        {shops.map((shop, i) => (
          <div
            key={shop.top + i}
            className={`absolute border-[6px] border-comic-ink ${shop.wall}`}
            style={{ left: SHOP.left + i * SHOP.width, top: shop.top, width: SHOP.width, height: SHOP.bottom - shop.top }}
          >
            {/* Snow on the roof, the awning over the window, the door and the step under it. */}
            <div className="absolute -top-[22px] -inset-x-[10px] h-[40px] rounded-full border-[5px] border-comic-ink bg-card" />
            <div
              className="absolute inset-x-[6px] h-[44px] rounded-b-[22px] border-[5px] border-comic-ink"
              style={{ top: WINDOW.top - shop.top - 58, background: `repeating-linear-gradient(90deg, ${shop.awning} 0 26px, var(--color-card) 26px 52px)` }}
            />
            <div className="absolute bottom-[34px] left-1/2 h-[150px] w-[70px] -translate-x-1/2 rounded-t-[34px] border-[5px] border-comic-ink bg-navy" />
            <div className="absolute inset-x-[10px] bottom-0 h-[34px] border-x-[5px] border-t-[5px] border-comic-ink bg-ice-deep" />
          </div>
        ))}
      </div>

      <ul>
        {lesson.vocabulary.map((item, i) => (
          <motion.li
            key={item.audio.id}
            className="absolute"
            style={{ left: SHOP.left + i * SHOP.width + WINDOW.inset, top: WINDOW.top, width: WINDOW.width, height: WINDOW.height }}
            {...popIn(i, reduceMotion)}
          >
            <ShopWindow item={item} lit={vocabulary.visited(item)} onPlay={() => choose(item, i)} />
          </motion.li>
        ))}
      </ul>

      <Walker x={at === null ? HER.start : shopCentre(at)} still={reduceMotion} />

      {open && (
        <Link
          to="/lesson/$lessonId/$step"
          params={{ lessonId: lesson.id, step: '3' }}
          onClick={() => useLessonSession.getState().completeStep(2)}
          className="ice-block pointer-events-auto absolute flex cursor-pointer items-center justify-center font-heading text-[40px] font-bold whitespace-nowrap select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
          style={{ left: AHEAD.left, top: AHEAD.top, width: AHEAD.width, height: AHEAD.height }}
        >
          ไปต่อ
          <ChevronRight aria-hidden="true" className="-me-[6px] size-[38px] shrink-0" strokeWidth={3.5} />
        </Link>
      )}
    </section>
  )
}

/** The barrier across the street ahead, which lifts once it opens. */
function Barrier({ open }: { open: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {!open && (
          <motion.div
            data-testid="street-barrier"
            className="absolute origin-[12px_60px]"
            style={{ left: AHEAD.left, top: AHEAD.top, width: AHEAD.width, height: AHEAD.height }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { rotate: -80, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
          >
            {/* A red and white road barrier on its post. */}
            <span className="absolute top-[42px] left-0 h-[36px] w-full rounded-full border-[5px] border-comic-ink bg-[repeating-linear-gradient(90deg,var(--color-final)_0_26px,var(--color-card)_26px_52px)]" />
            <span className="absolute top-[30px] left-0 h-[102px] w-[24px] rounded-t-[10px] border-[5px] border-comic-ink bg-sign-blue" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** น้องส้ม on the street, walking to `x` with a little hop at each step; under reduced motion she is simply there. */
function Walker({ x, still }: { x: number; still: boolean }) {
  const { poses } = useMascot()
  const [walking, setWalking] = useState(false)
  return (
    <motion.div
      data-testid="shop-mascot"
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0"
      style={{ width: HER.width, height: HER.height, y: HER.foot - HER.height }}
      initial={false}
      animate={{ x: x - HER.width / 2 }}
      transition={still ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' }}
      onAnimationStart={() => !still && setWalking(true)}
      onAnimationComplete={() => setWalking(false)}
    >
      <motion.img
        src={poses.greet}
        alt=""
        draggable={false}
        className="size-full object-contain select-none"
        animate={walking ? { y: [0, -14, 0] } : { y: 0 }}
        transition={walking ? { duration: 0.32, repeat: Infinity } : { duration: 0 }}
      />
    </motion.div>
  )
}

type ShopWindowProps = { item: VocabularyWord; lit: boolean; onPlay: () => void }

/** One shop window in the Kit's frosted frame: dark glass until tapped, then warm light with the picture in it. */
function ShopWindow({ item, lit, onPlay }: ShopWindowProps) {
  const { status, statusText } = useVocabularyCard(item, lit)
  const { card } = useKit()
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      onClick={onPlay}
      data-lit={lit || undefined}
      data-highlight={status === 'playing' || undefined}
      className={cx(
        'pointer-events-auto relative block size-full cursor-pointer overflow-hidden select-none',
        card,
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
      )}
    >
      {/* Dark glass with a cold sheen; the light comes on with a glow. */}
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,var(--color-sign-blue),var(--color-navy))]" />
      <span
        data-testid="window-light"
        className={cx(
          'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-cream-light),var(--color-cover-cream)_75%)] transition-opacity duration-300 motion-reduce:transition-none',
          lit ? 'opacity-100' : 'opacity-0',
        )}
      />
      {lit && (
        <motion.img
          src={item.image}
          alt=""
          draggable={false}
          className="pointer-events-none absolute top-[46px] left-[6px] h-[130px] w-[130px] object-contain"
          initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.4 }}
        />
      )}
      {/* The sill, with the word. */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[100px] border-t-[5px] border-comic-ink bg-cream" />
      <span className="absolute inset-x-0 bottom-[10px] text-center font-heading text-[56px] leading-[1.4] font-bold text-navy">{item.word}</span>
      <span className="sr-only"> {statusText}</span>
      <SpeakerButton className="top-[4px] left-[4px] size-[50px]" playing={status === 'playing'} loading={status === 'loading'} />
    </button>
  )
}
