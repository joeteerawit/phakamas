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

// Stage pixels. The potting shelf holds six pots in two rows of three (330–1220 × 270–900), the seed tray stands at its
// right (1270–1620 × 270–800), and the buttons run along the bottom (920–1044), all clear of the leaves at the window's
// sides. The check toast shows at the top (146–256), where the instruction steps aside meanwhile.
const POT = { width: 270, height: 300, columns: [330, 640, 950], rows: [270, 590] }
const SHAKE = [0, -14, 14, -8, 8, 0]
const control = 'absolute flex items-center justify-center gap-[10px] font-heading font-bold whitespace-nowrap'

/**
 * แม่กก Step 6, pot the seedlings (docs/mae-kok-spec.md): six terracotta pots on a potting shelf each wear a seed-packet
 * tag with a picture, and the six words ride on seedlings in a seed tray (the Word Bank). Drag a seedling onto a pot, or
 * tap it and then a pot, to pot it under the matching picture; a potted seedling opens a second leaf, and a full pot
 * sends its old seedling back to the tray. Tapping a potted seedling sends it back. Checked by ตรวจคำตอบ only, one
 * point per pot out of 6, with the shared Activity scoring and Stars; ลองอีกครั้ง clears the wrong pots and ล้างคำตอบ
 * all of them, as on แม่กง.
 */
export function PottingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { bank, pictures, instruction } = lesson.wordFilling
  const activity = lessonActivity(lesson, 'wordFilling')
  const { Button, card } = useKit()
  const reduceMotion = !!useReducedMotion()
  const [placed, setPlaced] = useState<(string | null)[]>(() => pictures.map(() => null))
  // null = not checked since the pot last changed.
  const [results, setResults] = useState<(boolean | null)[]>(() => pictures.map(() => null))
  const [selected, setSelected] = useState<string | null>(null)
  const [checks, setChecks] = useState(0)
  const [toastShown, setToastShown] = useState(false)
  const say = (feedback: Feedback | null) => {
    setToastShown(feedback !== null)
    onFeedback(feedback)
  }
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  useReportUncheckedWork(activity, placed.some((word, i) => word !== null && results[i] === null))
  useClearFeedbackOnLeave(onFeedback)

  const update = (next: (string | null)[]) => {
    setResults((old) => old.map((result, i) => (next[i] === placed[i] ? result : null)))
    setPlaced(next)
    setSelected(null)
    say(null)
  }
  const pot = (word: string, at: number) => update(placed.map((w, i) => (i === at ? word : w === word ? null : w)))
  const sendBack = (word: string) => update(placed.map((w) => (w === word ? null : w)))
  const tapPot = (at: number) => {
    const word = placed[at]
    if (selected) pot(selected, at)
    else if (word) sendBack(word)
  }

  const check = () => {
    const next = pictures.map((picture, i) => placed[i] === picture.answer)
    const score = next.filter(Boolean).length
    setResults(next)
    setChecks((n) => n + 1)
    setSelected(null)
    recordActivityCheck(activity.id, score, activity.maxScore, placed)
    say(scoreFeedback(score, activity.maxScore, 'กดลองอีกครั้งเพื่อแก้กระถางที่ผิด', ['ลองอีกครั้ง']))
    celebrate(activity.id)
  }
  const retry = () => {
    setPlaced(placed.map((w, i) => (results[i] === false ? null : w)))
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
    // Pots are hit-tested by their still places on the shelf, never by the seedling being carried.
    const target = [...(root.current?.querySelectorAll<HTMLElement>('[data-pot]') ?? [])].find(hit)
    if (target) pot(word, Number(target.dataset.pot))
    else if (placed.includes(word) && [...(root.current?.querySelectorAll('[data-tray]') ?? [])].some(hit)) sendBack(word)
  })
  // The dragged seedling follows the pointer.
  const dragProps = (word: string) => {
    const d = drag.dragging?.id === word ? drag.dragging : null
    return {
      ...drag.handlers(word),
      style: d ? { transform: `translate(${d.dx}px, ${d.dy}px)`, zIndex: 40, transition: 'none' } : undefined,
    }
  }
  const trayWords = bank.filter((word) => !placed.includes(word))

  return (
    <section ref={root} data-full-stage className="relative size-full font-heading text-soil-deep">
      <p
        className={cx(
          toastShown && 'invisible',
          'kraft-label absolute top-[160px] left-1/2 flex h-[80px] -translate-x-1/2 items-center px-[36px] text-[40px] font-bold whitespace-nowrap',
        )}
      >
        {instruction}
      </p>

      {/* The potting shelf's two planks, under each row of pots. */}
      {POT.rows.map((top) => (
        <div
          key={top}
          aria-hidden="true"
          data-testid="shelf"
          className="pointer-events-none absolute left-[310px] h-[34px] w-[930px] rounded-[8px] border-[5px] border-soil-deep bg-plank"
          style={{ top: top + POT.height - 14 }}
        />
      ))}

      <ul>
        {pictures.map((picture, i) => {
          const word = placed[i]
          const result = results[i] ?? null
          const resultText = result === true ? ' ถูก' : result === false ? ' ผิด' : ''
          return (
            <li
              key={picture.answer}
              data-pot={i}
              className="absolute"
              style={{ left: POT.columns[i % 3], top: POT.rows[Math.floor(i / 3)], width: POT.width, height: POT.height }}
            >
              <motion.div
                key={checks}
                className="relative size-full"
                initial={false}
                animate={result === false && !reduceMotion ? { x: SHAKE } : undefined}
                transition={{ duration: 0.5 }}
              >
                <button
                  type="button"
                  aria-label={`กระถางที่ ${i + 1}: ${word ?? 'ว่าง'}${resultText}`}
                  onClick={drag.click(() => tapPot(i))}
                  className="pointer-events-auto absolute inset-0 cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {/* The pot's seed-packet tag with its picture, staked in behind. */}
                  <span data-testid="pot-tag" className={cx('pointer-events-none absolute top-0 left-[45px] block h-[150px] w-[180px]', card)}>
                    <img src={picture.image} alt={`ภาพที่ ${i + 1}`} draggable={false} className="absolute top-[24px] left-[30px] size-[120px] object-contain" />
                  </span>
                  <TerracottaPot waiting={!!selected && !word} result={result} />
                  {word && (
                    // The potted seedling itself is what a drag picks up and carries to another pot or the tray.
                    <span data-testid="potted-seedling" {...dragProps(word)} className="absolute top-[110px] left-[55px] touch-none">
                      <Seedling word={word} potted />
                    </span>
                  )}
                </button>
                {result !== null && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      'pointer-events-none absolute top-[160px] right-[2px] flex size-[60px] items-center justify-center rounded-full border-4 border-soil-deep text-card',
                      result ? 'bg-correct' : 'bg-wrong',
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

      {/* The seed tray where the seedlings wait: three rows of two. */}
      <div
        role="group"
        aria-label="คลังคำ"
        data-tray
        className="absolute top-[270px] left-[1270px] grid h-[530px] w-[350px] grid-cols-2 content-start justify-items-center gap-x-[10px] gap-y-[14px] rounded-[20px] border-[6px] border-soil-deep bg-[repeating-linear-gradient(90deg,var(--color-plank)_0_30px,#8c5c2c_30px_33px)] px-[10px] py-[14px]"
      >
        {trayWords.length === 0 && <p className="col-span-2 self-center rounded-[12px] bg-kraft-light px-[16px] text-[36px] font-bold">ปลูกครบแล้ว</p>}
        {trayWords.map((word) => (
          <button
            key={word}
            type="button"
            aria-pressed={selected === word}
            onClick={drag.click(() => setSelected(selected === word ? null : word))}
            {...dragProps(word)}
            className={cx(
              'pointer-events-auto relative h-[156px] w-[156px] touch-none rounded-[24px] bg-soil select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
              'transition-transform duration-150 motion-reduce:transition-none',
              selected === word && '-translate-y-[10px] outline-6 outline-sprout',
            )}
          >
            <Seedling word={word} />
          </button>
        ))}
      </div>

      <Button onClick={retry} disabled={!results.includes(false)} className={cx(control, 'top-[920px] left-[330px] h-[124px] w-[284px] text-[35px]')}>
        <RotateCcw aria-hidden="true" className="relative mt-[10px] size-[38px]" strokeWidth={3} />
        <span className="relative mt-[10px]">ลองอีกครั้ง</span>
      </Button>
      <Button onClick={clearAll} className={cx(control, 'top-[920px] left-[640px] h-[124px] w-[284px] text-[35px]')}>
        <X aria-hidden="true" className="relative mt-[10px] size-[38px]" strokeWidth={3} />
        <span className="relative mt-[10px]">ล้างคำตอบ</span>
      </Button>
      <Button data-main onClick={check} className={cx(control, 'top-[920px] left-[1270px] h-[124px] w-[350px] text-[40px]')}>
        <Check aria-hidden="true" className="relative mt-[10px] size-[48px]" strokeWidth={3.5} />
        <span className="relative mt-[10px]">ตรวจคำตอบ</span>
      </Button>
    </section>
  )
}

/** The terracotta pot on the shelf, the soil in it where a seedling is potted. */
function TerracottaPot({ waiting, result }: { waiting: boolean; result: boolean | null }) {
  return (
    <svg data-testid="pot" aria-hidden="true" viewBox="0 0 270 150" className="pointer-events-none absolute top-[150px] left-0 h-[150px] w-[270px] overflow-visible">
      <path d="M40 30 H230 L206 146 H64 Z" fill="var(--color-terracotta)" {...ink} strokeWidth={6} />
      <rect x="26" y="6" width="218" height="34" rx="10" fill="#c45f34" {...ink} strokeWidth={6} />
      <ellipse cx="135" cy="12" rx="96" ry="8" fill="var(--color-soil-deep)" />
      <path d="M60 60 L80 130" stroke="var(--color-terracotta-light)" strokeWidth={6} strokeLinecap="round" />
      {(waiting || result !== null) && (
        <rect
          x="20"
          y="0"
          width="230"
          height="150"
          rx="20"
          fill="none"
          stroke={result === true ? 'var(--color-correct)' : result === false ? 'var(--color-wrong)' : 'var(--color-sprout)'}
          strokeWidth={8}
          strokeDasharray={waiting ? '18 12' : undefined}
        />
      )}
    </svg>
  )
}

/** A seedling with its word on a kraft tag; in a pot it has opened its second leaf. */
function Seedling({ word, potted = false }: { word: string; potted?: boolean }) {
  return (
    <span data-word={word} data-leaves={potted ? 2 : 1} className="pointer-events-none relative block h-[156px] w-[160px]">
      <svg aria-hidden="true" viewBox="0 0 160 90" className="absolute top-0 left-0 w-[160px] overflow-visible">
        <path d="M80 90 V40" stroke="var(--color-sprout-deep)" strokeWidth={8} strokeLinecap="round" />
        <path d="M80 44 Q40 44 30 10 Q70 8 80 44 Z" fill="var(--color-sprout)" {...ink} strokeWidth={4} />
        {potted && <path d="M80 40 Q120 40 132 6 Q92 4 80 40 Z" fill="var(--color-sprout)" {...ink} strokeWidth={4} />}
      </svg>
      <span className="absolute inset-x-[8px] top-[78px] flex h-[70px] items-center justify-center rounded-[12px] border-[4px] border-soil-deep bg-kraft-light text-[46px] leading-none font-bold text-soil-deep">
        {word}
      </span>
    </span>
  )
}
