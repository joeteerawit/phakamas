import { Check, RotateCcw, X } from 'lucide-react'
import { animate, motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { celebrate } from './Stars'
import { scoreFeedback, useClearFeedbackOnLeave } from '../activities/feedback'
import { lessonActivity, useReportUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { cx } from './clay/buttonClass'
import { useStageScale } from './stage/Stage'
import type { ActivityStepProps } from './stepProps'
import { usePointerDrag } from './usePointerDrag'

/** Card left edges (stage px) from design DAHZj0Nxyxs page 6; cards are 255×374 at top 294. */
const CARD_LEFT = [108, 399, 691, 982, 1273, 1564]

const pill =
  'flex items-center justify-center rounded-full border-4 border-dashed border-cream-border bg-[#fff6b3] font-heading font-bold text-navy'
const control =
  'absolute flex h-[122px] w-[320px] items-center justify-center gap-[12px] whitespace-nowrap rounded-full border-[6px] border-card font-heading text-[40px] font-bold text-navy ' +
  'transition-transform duration-150 ease-out active:scale-95 disabled:opacity-50 motion-reduce:transition-none ' +
  'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring'
const SHAKE = [0, -16, 16, -10, 10, 0]
const SPARKLES = [
  { left: 10, top: 20 },
  { left: 210, top: 40 },
  { left: 30, top: 240 },
  { left: 200, top: 230 },
]

/**
 * Step 6 (design page 6, fill sequence pages 24–28): place each bank word in the slot under its picture.
 * Tap-to-select (mouse, touch, keyboard) is the main path; Pointer-Events drag is a shortcut.
 * Every move flies the word chip from where it was (FLIP, divided by the stage scale).
 */
export function WordFillingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { bank, pictures, instruction } = lesson.wordFilling
  const activity = lessonActivity(lesson, 'wordFilling')
  const [placed, setPlaced] = useState<(string | null)[]>(() => pictures.map(() => null))
  // null = not checked since the blank last changed.
  const [results, setResults] = useState<(boolean | null)[]>(() => pictures.map(() => null))
  const [selected, setSelected] = useState<string | null>(null)
  // Bumped on each check so the shake and sparkles replay.
  const [checks, setChecks] = useState(0)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  const reduceMotion = useReducedMotion()
  const scale = useStageScale()
  // A placed word not checked since it moved; Home asks before throwing it away.
  useReportUncheckedWork(activity, placed.some((word, i) => word !== null && results[i] === null))
  useClearFeedbackOnLeave(onFeedback)

  // The Activity sits on the stage at design coordinates, not in StepLayout's scrolling content area.
  const anchor = useRef<HTMLSpanElement>(null)
  const [stage, setStage] = useState<Element | null>(null)
  useLayoutEffect(() => setStage(anchor.current?.closest('[data-testid="stage"]') ?? null), [])

  // FLIP: chip rects before a move; after the re-render each chip flies from its old spot.
  const root = useRef<HTMLDivElement>(null)
  const before = useRef<Map<string, DOMRect> | null>(null)
  const chips = () => [...(root.current?.querySelectorAll<HTMLElement>('[data-word]') ?? [])]
  const snapshot = () => {
    before.current = new Map(chips().map((el) => [el.dataset.word!, el.getBoundingClientRect()]))
  }
  useLayoutEffect(() => {
    const old = before.current
    before.current = null
    if (!old || reduceMotion) return
    for (const el of chips()) {
      const from = old.get(el.dataset.word!)
      if (!from) continue
      const to = el.getBoundingClientRect()
      const x = (from.left - to.left) / scale
      const y = (from.top - to.top) / scale
      if (Math.abs(x) + Math.abs(y) < 1) continue
      void animate(el, { x: [x, 0], y: [y, 0] }, { type: 'spring', duration: 0.55, bounce: 0.35 })
    }
  }, [placed, reduceMotion, scale])

  const update = (next: (string | null)[]) => {
    snapshot()
    setResults((old) => old.map((result, i) => (next[i] === placed[i] ? result : null)))
    setPlaced(next)
    setSelected(null)
    onFeedback(null)
  }
  const put = (word: string, blank: number) => update(placed.map((w, i) => (i === blank ? word : w === word ? null : w)))
  const takeBack = (word: string) => update(placed.map((w) => (w === word ? null : w)))
  const tapBlank = (blank: number) => {
    const word = placed[blank]
    if (selected) put(selected, blank)
    else if (word) takeBack(word)
  }

  const check = () => {
    const next = pictures.map((picture, i) => placed[i] === picture.answer)
    const score = next.filter(Boolean).length
    setResults(next)
    setChecks((n) => n + 1)
    setSelected(null)
    recordActivityCheck(activity.id, score, activity.maxScore, placed)
    onFeedback(scoreFeedback(score, activity.maxScore, 'กดลองอีกครั้งเพื่อแก้ช่องที่ผิด'))
    celebrate(activity.id)
  }
  const retry = () => {
    snapshot()
    setPlaced(placed.map((w, i) => (results[i] === false ? null : w)))
    setResults(results.map((r) => (r === false ? null : r)))
    setSelected(null)
    onFeedback(null)
  }
  const clearAll = () => {
    setResults(pictures.map(() => null))
    update(pictures.map(() => null))
  }

  const drag = usePointerDrag((word, x, y) => {
    const hit = (el: Element) => {
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    const blank = [...document.querySelectorAll<HTMLElement>('[data-blank]')].find(hit)
    if (blank) put(word, Number(blank.dataset.blank))
    else if (placed.includes(word) && [...document.querySelectorAll('[data-bank]')].some(hit)) takeBack(word)
  })
  // The dragged word follows the pointer.
  const dragProps = (word: string) => {
    const d = drag.dragging?.id === word ? drag.dragging : null
    return {
      ...drag.handlers(word),
      style: d ? { transform: `translate(${d.dx}px, ${d.dy}px)`, zIndex: 40, transition: 'none' } : undefined,
    }
  }

  const bankWords = bank.filter((word) => !placed.includes(word))

  const content = (
    <div ref={root} className="contents">
      <p className="absolute top-[165px] left-[946px] -translate-x-1/2 whitespace-nowrap font-heading text-[60px] leading-[1.4] font-bold text-navy">
        {instruction}
      </p>

      <ul>
        {pictures.map((picture, i) => {
          const word = placed[i]
          const result = results[i]
          const resultText = result === true ? ' ถูก' : result === false ? ' ผิด' : ''
          return (
            <motion.li
              key={picture.answer}
              data-blank={i}
              className="absolute top-[294px] h-[374px] w-[255px]"
              style={{ left: CARD_LEFT[i] }}
              initial={reduceMotion ? false : { opacity: 0, y: 60, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', duration: 0.5, bounce: 0.4 }}
            >
              <motion.div
                key={checks}
                initial={false}
                animate={result === false && !reduceMotion ? { x: SHAKE } : undefined}
                transition={{ duration: 0.5 }}
                className={cx(
                  'relative size-full rounded-[28px] border-4 border-dashed border-cream-border bg-cream',
                  'transition-shadow duration-300 motion-reduce:transition-none',
                  result === true && 'border-solid border-correct shadow-[0_0_0_6px_#4ade80,0_0_48px_12px_#86efac]',
                  result === false && 'border-solid border-wrong shadow-[0_0_0_6px_#f87171]',
                )}
              >
                <img
                  src={picture.image}
                  alt={`ภาพที่ ${i + 1}`}
                  width={256}
                  height={256}
                  draggable={false}
                  className="pointer-events-none absolute top-[16px] left-[16px] h-[250px] w-[215px] object-contain select-none"
                />
                <div
                  className={cx(
                    'absolute inset-x-[-4px] bottom-[-4px] h-[97px] rounded-[20px] border-4 border-dashed bg-card',
                    selected && !word ? 'border-pill' : 'border-cream-border',
                  )}
                />
                <button
                  type="button"
                  aria-label={`ช่องที่ ${i + 1}: ${word ?? 'ว่าง'}${resultText}`}
                  onClick={drag.click(() => tapBlank(i))}
                  {...(word ? dragProps(word) : {})}
                  className={cx(
                    'absolute inset-0 flex cursor-pointer items-end rounded-[28px] select-none',
                    'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
                    word && 'touch-none',
                  )}
                >
                  {word && (
                    <span data-word={word} className={cx(pill, 'relative h-[97px] w-full text-[60px] leading-[1.4]')}>
                      {word}
                    </span>
                  )}
                </button>
                {result !== null && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      'absolute -top-[22px] -right-[22px] flex size-[64px] items-center justify-center rounded-full border-4 border-card text-card',
                      result ? 'bg-correct' : 'bg-wrong',
                    )}
                  >
                    {result ? <Check className="size-10" strokeWidth={4} /> : <X className="size-10" strokeWidth={4} />}
                  </span>
                )}
                {result === true &&
                  !reduceMotion &&
                  SPARKLES.map((at, n) => (
                    <motion.span
                      key={n}
                      aria-hidden="true"
                      className="pointer-events-none absolute text-[48px] text-sun"
                      style={at}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0.6], rotate: [0, 90] }}
                      transition={{ duration: 0.9, delay: n * 0.08 }}
                    >
                      ✦
                    </motion.span>
                  ))}
              </motion.div>
            </motion.li>
          )
        })}
      </ul>

      <div
        role="group"
        aria-label="คลังคำ"
        data-bank
        className="absolute top-[790px] left-[542px] flex h-[250px] w-[836px] flex-wrap content-start justify-center gap-x-[35px] gap-y-[4px]"
      >
        {bankWords.length === 0 && (
          <p className="self-center font-heading text-[48px] font-bold text-navy">วางคำครบแล้ว</p>
        )}
        {bankWords.map((word) => (
          <button
            key={word}
            type="button"
            aria-pressed={selected === word}
            onClick={drag.click(() => setSelected(selected === word ? null : word))}
            {...dragProps(word)}
            className="relative flex h-[122px] w-[255px] touch-none items-center rounded-full select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span
              data-word={word}
              className={cx(
                pill,
                'h-[87px] w-full text-[60px] leading-[1.4] transition-[translate,box-shadow] duration-150 motion-reduce:transition-none',
                selected === word && '-translate-y-[10px] border-solid border-pill shadow-[0_10px_0_#8a3a13]',
              )}
            >
              {word}
            </span>
          </button>
        ))}
      </div>

      <button type="button" onClick={retry} disabled={!results.includes(false)} className={cx(control, 'top-[790px] left-[205px] bg-cream')}>
        <RotateCcw aria-hidden="true" className="size-[44px]" strokeWidth={3} />
        ลองอีกครั้ง
      </button>
      <button type="button" onClick={clearAll} className={cx(control, 'top-[916px] left-[205px] bg-cream')}>
        <X aria-hidden="true" className="size-[44px]" strokeWidth={3} />
        ล้างคำตอบ
      </button>
      <button type="button" onClick={check} className={cx(control, 'top-[790px] left-[1400px] bg-pill')}>
        <Check aria-hidden="true" className="size-[48px]" strokeWidth={3.5} />
        ตรวจคำตอบ
      </button>
    </div>
  )

  return (
    <>
      <span ref={anchor} hidden />
      {stage && createPortal(content, stage)}
    </>
  )
}
