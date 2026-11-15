import { Check, RotateCcw, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import { lessonActivity, useReportUncheckedWork } from '../../../session/activities'
import { useLessonSession } from '../../../session/lessonSession'
import { scoreFeedback, useClearFeedbackOnLeave } from '../../../steps/feedback'
import type { ActivityStepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import type { Feedback } from '../../../ui/clay/FeedbackToast'
import { useKit } from '../../../ui/kit'
import { celebrate } from '../../../ui/Stars'
import { usePointerDrag } from '../../../ui/usePointerDrag'
import { ink } from '../kit/ink'

// Stage pixels. Six boats tied at the mooring in two rows of three (300 wide, 24 apart, 330–1278 × 270–890), the pier
// post with the Word Bank's name boards at the right (1300–1610), and the three action planks along the bottom
// (926–1050). All clear of the lotus pads down the window's sides. The check toast shows at the top (146–256), where
// the instruction steps aside meanwhile.
const BOAT = { left: 330, top: 270, width: 300, height: 300, gapX: 24, gapY: 20 }
const boatAt = (i: number) => ({ left: BOAT.left + (i % 3) * (BOAT.width + BOAT.gapX), top: BOAT.top + Math.floor(i / 3) * (BOAT.height + BOAT.gapY) })
const SHAKE = [0, -14, 14, -8, 8, 0]
const control = 'absolute top-[926px] flex h-[124px] w-[296px] items-center justify-center gap-[10px] px-[28px] font-heading text-[36px] font-bold whitespace-nowrap'

/**
 * แม่กน Step 6, name the boats (docs/mae-kon-spec.md): six boats are tied at the mooring, each carrying one picture as
 * cargo in a bamboo-tray hull with a blank name board across it. The Word Bank is a bundle of wooden name boards
 * lashed to a pier post. Drag a board to a boat, or tap a board then a boat, to name it; naming a boat that already
 * has a name sends its old board back to the post, and tapping a named boat sends its board back. ตรวจคำตอบ checks
 * all six at once, one point per boat out of 6 with the shared Activity scoring and Stars, and raises a little coral
 * flag on each boat named right; ลองอีกครั้ง clears the wrong boats, ล้างคำตอบ all of them.
 */
export function WordFillingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { bank, pictures, instruction } = lesson.wordFilling
  const activity = lessonActivity(lesson, 'wordFilling')
  const { Button } = useKit()
  const reduceMotion = !!useReducedMotion()
  const [named, setNamed] = useState<(string | null)[]>(() => pictures.map(() => null))
  // null = not checked since the boat last changed.
  const [results, setResults] = useState<(boolean | null)[]>(() => pictures.map(() => null))
  const [selected, setSelected] = useState<string | null>(null)
  const [checks, setChecks] = useState(0)
  const [toastShown, setToastShown] = useState(false)
  const say = (feedback: Feedback | null) => {
    setToastShown(feedback !== null)
    onFeedback(feedback)
  }
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  useReportUncheckedWork(activity, named.some((word, i) => word !== null && results[i] === null))
  useClearFeedbackOnLeave(onFeedback)

  const update = (next: (string | null)[]) => {
    setResults((old) => old.map((result, i) => (next[i] === named[i] ? result : null)))
    setNamed(next)
    setSelected(null)
    say(null)
  }
  const name = (word: string, boat: number) => update(named.map((w, i) => (i === boat ? word : w === word ? null : w)))
  const sendBack = (word: string) => update(named.map((w) => (w === word ? null : w)))
  const tapBoat = (boat: number) => {
    const word = named[boat]
    if (selected) name(selected, boat)
    else if (word) sendBack(word)
  }

  const check = () => {
    const next = pictures.map((picture, i) => named[i] === picture.answer)
    const score = next.filter(Boolean).length
    setResults(next)
    setChecks((n) => n + 1)
    setSelected(null)
    recordActivityCheck(activity.id, score, activity.maxScore, named)
    say(scoreFeedback(score, activity.maxScore, 'กดลองอีกครั้งเพื่อแก้เรือที่ผิด', ['ลองอีกครั้ง']))
    celebrate(activity.id)
  }
  const retry = () => {
    setNamed(named.map((w, i) => (results[i] === false ? null : w)))
    setResults(results.map((r) => (r === false ? null : r)))
    setSelected(null)
    say(null)
  }
  const clearAll = () => {
    setResults(pictures.map(() => null))
    update(pictures.map(() => null))
  }

  const root = useRef<HTMLElement>(null)
  const drag = usePointerDrag((word, x, y) => {
    const hit = (el: Element) => {
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    // Boats are hit-tested by their still places at the mooring, never by the board being carried.
    const boat = [...(root.current?.querySelectorAll<HTMLElement>('[data-boat]') ?? [])].find(hit)
    if (boat) name(word, Number(boat.dataset.boat))
    else if (named.includes(word) && [...(root.current?.querySelectorAll('[data-bank]') ?? [])].some(hit)) sendBack(word)
  })
  // The dragged board follows the pointer; under reduced motion boards only ever jump.
  const dragProps = (word: string) => {
    const d = drag.dragging?.id === word ? drag.dragging : null
    return {
      ...drag.handlers(word),
      style: d ? { transform: `translate(${d.dx}px, ${d.dy}px)`, zIndex: 40, transition: 'none' } : undefined,
    }
  }
  const bankWords = bank.filter((word) => !named.includes(word))

  return (
    <section ref={root} data-full-stage className="relative size-full font-heading text-kon-ink">
      <p
        className={cx(
          toastShown && 'invisible',
          'bamboo-label absolute top-[160px] left-1/2 flex h-[80px] -translate-x-1/2 items-center px-[36px] text-[40px] font-bold whitespace-nowrap',
        )}
      >
        {instruction}
      </p>

      <ul>
        {pictures.map((picture, i) => {
          const word = named[i]
          const result = results[i] ?? null
          const resultText = result === true ? ' ถูก' : result === false ? ' ผิด' : ''
          return (
            <li key={picture.answer} data-boat={i} className="absolute" style={{ ...boatAt(i), width: BOAT.width, height: BOAT.height }}>
              <motion.div
                key={checks}
                className="relative size-full"
                initial={false}
                animate={result === false && !reduceMotion ? { x: SHAKE } : undefined}
                transition={{ duration: 0.5 }}
              >
                <button
                  type="button"
                  aria-label={`เรือลำที่ ${i + 1}: ${word ?? 'ยังไม่มีชื่อ'}${resultText}`}
                  onClick={drag.click(() => tapBoat(i))}
                  className="pointer-events-auto absolute inset-0 cursor-pointer rounded-[40px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <MooredBoat image={picture.image} index={i} waiting={!!selected && !word} result={result} />
                  {word && (
                    // The board itself is what a drag picks up and carries to another boat or back to the post.
                    <span data-testid="boat-name" {...dragProps(word)} className="absolute top-[166px] left-[45px] touch-none">
                      <NameBoard word={word} />
                    </span>
                  )}
                </button>
                {result === true && <CoralFlag still={reduceMotion} />}
                {result !== null && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      'pointer-events-none absolute top-[6px] left-[6px] flex size-[60px] items-center justify-center rounded-full border-4 border-kon-ink text-card',
                      result ? 'bg-canal' : 'bg-wrong',
                    )}
                  >
                    {result ? <Check className="size-9" strokeWidth={4} /> : <X className="size-9" strokeWidth={4} />}
                  </span>
                )}
              </motion.div>
            </li>
          )
        })}
      </ul>

      {/* The pier post with the Word Bank's name boards lashed to it, two by three. */}
      <span aria-hidden="true" data-testid="pier-post" className="pointer-events-none absolute top-[250px] left-[1438px] h-[660px] w-[34px] rounded-[10px] border-[5px] border-kon-ink bg-teak-deep" />
      <div
        role="group"
        aria-label="คลังคำ"
        data-bank
        className="absolute top-[290px] left-[1300px] grid h-[420px] w-[310px] grid-cols-2 content-start gap-x-[30px] gap-y-[14px]"
      >
        {bankWords.length === 0 && <p className="bamboo-label col-span-2 mt-[140px] px-[16px] text-center text-[34px] font-bold">ตั้งชื่อเรือครบแล้ว</p>}
        {bankWords.map((word) => (
          <button
            key={word}
            type="button"
            aria-pressed={selected === word}
            onClick={drag.click(() => setSelected(selected === word ? null : word))}
            {...dragProps(word)}
            className={cx(
              'pointer-events-auto relative h-[124px] w-[140px] touch-none rounded-[20px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
              'transition-transform duration-150 motion-reduce:transition-none',
              selected === word && '-translate-y-[10px]',
            )}
          >
            <NameBoard word={word} lifted={selected === word} compact />
          </button>
        ))}
      </div>

      <Button onClick={retry} disabled={!results.includes(false)} className={cx(control, 'left-[330px]')}>
        <RotateCcw aria-hidden="true" className="relative size-[40px] shrink-0" strokeWidth={3} />
        <span className="relative">ลองอีกครั้ง</span>
      </Button>
      <Button onClick={clearAll} className={cx(control, 'left-[646px]')}>
        <X aria-hidden="true" className="relative size-[40px] shrink-0" strokeWidth={3} />
        <span className="relative">ล้างคำตอบ</span>
      </Button>
      <Button onClick={check} className={cx(control, 'left-[962px] w-[316px]')}>
        <Check aria-hidden="true" className="relative size-[48px] shrink-0" strokeWidth={3.5} />
        <span className="relative">ตรวจคำตอบ</span>
      </Button>
    </section>
  )
}

/** A boat tied at the mooring: its cargo picture in a bamboo-tray hull and the blank name board across its side. */
function MooredBoat({ image, index, waiting, result }: { image: string; index: number; waiting: boolean; result: boolean | null }) {
  const { card } = useKit()
  return (
    <span data-testid="moored-boat" className="pointer-events-none absolute inset-0 block">
      {/* The mooring rope to the pier post above. */}
      <svg aria-hidden="true" viewBox="0 0 300 300" className="absolute inset-0 size-full overflow-visible">
        <path d="M150 -14 Q170 10 150 30" fill="none" stroke="var(--color-kon-ink)" strokeWidth={4} strokeLinecap="round" />
        <path d="M6 160 Q150 196 294 160 L262 286 Q150 304 38 286 Z" fill="var(--color-teak)" {...ink} />
      </svg>
      <span
        className={cx(
          'absolute inset-x-[34px] top-[6px] h-[170px]',
          card,
          result === true ? 'outline-[7px] outline-canal' : result === false ? 'outline-[7px] outline-wrong' : waiting && 'outline-[7px] outline-dashed outline-marigold',
        )}
      >
        <img src={image} alt={`ภาพที่ ${index + 1}`} draggable={false} className="absolute top-[2px] left-1/2 size-[134px] -translate-x-1/2 object-contain" />
      </span>
      {/* The blank name board across the hull, waiting for its name. */}
      <span
        className={cx(
          'absolute top-[180px] left-[45px] h-[90px] w-[210px] rounded-[16px] border-[5px] border-dashed',
          waiting ? 'border-marigold bg-marigold/20' : 'border-honey-light/80 bg-teak-deep/30',
        )}
      />
    </span>
  )
}

/** A wooden name board with its word; `compact` is the narrow board hung on the pier post. */
function NameBoard({ word, lifted = false, compact = false }: { word: string; lifted?: boolean; compact?: boolean }) {
  return (
    <span
      data-word={word}
      className={cx(
        'wooden-tile pointer-events-none relative flex items-center justify-center text-[52px] leading-[1.2] font-bold text-kon-ink',
        compact ? 'h-[124px] w-[140px]' : 'h-[110px] w-[210px]',
        lifted && 'outline-[6px] outline-marigold',
      )}
    >
      {word}
    </span>
  )
}

/** The little coral flag a boat named right raises on its mast; still under reduced motion. */
function CoralFlag({ still }: { still: boolean }) {
  return (
    <motion.svg
      data-testid="coral-flag"
      aria-hidden="true"
      viewBox="0 0 60 90"
      className="pointer-events-none absolute -top-[40px] right-[30px] h-[90px] w-[60px] origin-bottom overflow-visible"
      initial={still ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
    >
      <path d="M10 88 V6" stroke="var(--color-teak-deep)" strokeWidth={6} strokeLinecap="round" />
      <path d="M12 8 L56 22 L12 38 Z" fill="var(--color-coral)" {...ink} strokeWidth={4} />
    </motion.svg>
  )
}
