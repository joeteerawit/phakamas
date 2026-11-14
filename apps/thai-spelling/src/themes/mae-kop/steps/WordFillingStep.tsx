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

// Stage pixels. Six puddles along the path (200 wide, 24 apart, 300–1620), clear of the drops down the window's sides;
// the bank of boats in the middle of the bottom row, ลองอีกครั้ง and ล้างคำตอบ on its left, ตรวจคำตอบ on its right.
// The check toast shows at the top (146–256), where the instruction steps aside meanwhile.
const PUDDLE = { left: 300, step: 224, width: 200, top: 290, height: 420 }
const SHAKE = [0, -14, 14, -8, 8, 0]
const control = 'absolute flex items-center justify-center gap-[10px] font-heading font-bold whitespace-nowrap'

/**
 * แม่กบ Step 6, paper boats to the puddles (docs/mae-kop-spec.md): six puddles on the path each show a picture reflected
 * in them, and the words ride on six paper boats at the bank (the Word Bank). Drag a boat, or tap a boat then a puddle,
 * to float it in the puddle with the matching picture; on tap-tap the boat leaves the bank and appears in the puddle
 * without travelling. Tapping a floating boat sends it back. Checked by ตรวจคำตอบ only, one point per puddle out of 6,
 * with the shared Activity scoring and Stars; ลองอีกครั้ง clears the wrong puddles, ล้างคำตอบ all of them.
 */
export function WordFillingStep({ lesson, onFeedback }: ActivityStepProps) {
  const { bank, pictures, instruction } = lesson.wordFilling
  const activity = lessonActivity(lesson, 'wordFilling')
  const { Button } = useKit()
  const reduceMotion = !!useReducedMotion()
  const [placed, setPlaced] = useState<(string | null)[]>(() => pictures.map(() => null))
  // null = not checked since the puddle last changed.
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
  const float = (word: string, puddle: number) => update(placed.map((w, i) => (i === puddle ? word : w === word ? null : w)))
  const sendBack = (word: string) => update(placed.map((w) => (w === word ? null : w)))
  const tapPuddle = (puddle: number) => {
    const word = placed[puddle]
    if (selected) float(selected, puddle)
    else if (word) sendBack(word)
  }

  const check = () => {
    const next = pictures.map((picture, i) => placed[i] === picture.answer)
    const score = next.filter(Boolean).length
    setResults(next)
    setChecks((n) => n + 1)
    setSelected(null)
    recordActivityCheck(activity.id, score, activity.maxScore, placed)
    say(scoreFeedback(score, activity.maxScore, 'กดลองอีกครั้งเพื่อแก้แอ่งที่ผิด', ['ลองอีกครั้ง']))
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
    // Puddles are hit-tested by their still places in the row, never by the boat being carried.
    const puddle = [...(root.current?.querySelectorAll<HTMLElement>('[data-puddle]') ?? [])].find(hit)
    if (puddle) float(word, Number(puddle.dataset.puddle))
    else if (placed.includes(word) && [...(root.current?.querySelectorAll('[data-bank]') ?? [])].some(hit)) sendBack(word)
  })
  // The dragged boat follows the pointer.
  const dragProps = (word: string) => {
    const d = drag.dragging?.id === word ? drag.dragging : null
    return {
      ...drag.handlers(word),
      style: d ? { transform: `translate(${d.dx}px, ${d.dy}px)`, zIndex: 40, transition: 'none' } : undefined,
    }
  }
  const bankWords = bank.filter((word) => !placed.includes(word))

  return (
    <section ref={root} data-full-stage className="relative size-full font-heading text-pond-deep">
      <p
        className={cx(
          toastShown && 'invisible',
          'drop-label absolute top-[160px] left-1/2 flex h-[80px] -translate-x-1/2 items-center px-[36px] text-[42px] font-bold whitespace-nowrap',
        )}
      >
        {instruction}
      </p>

      {/* The path the puddles lie on. */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[330px] left-[290px] h-[340px] w-[1340px] rounded-[170px] border-[6px] border-mud bg-[#b89a72]" />

      <ul>
        {pictures.map((picture, i) => {
          const word = placed[i]
          const result = results[i] ?? null
          const resultText = result === true ? ' ถูก' : result === false ? ' ผิด' : ''
          return (
            <li key={picture.answer} data-puddle={i} className="absolute" style={{ left: PUDDLE.left + i * PUDDLE.step, top: PUDDLE.top, width: PUDDLE.width, height: PUDDLE.height }}>
              <motion.div
                key={checks}
                className="relative size-full"
                initial={false}
                animate={result === false && !reduceMotion ? { x: SHAKE } : undefined}
                transition={{ duration: 0.5 }}
              >
                <button
                  type="button"
                  aria-label={`แอ่งที่ ${i + 1}: ${word ?? 'ว่าง'}${resultText}`}
                  onClick={drag.click(() => tapPuddle(i))}
                  className="pointer-events-auto absolute inset-0 cursor-pointer rounded-[50%/40%] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <Puddle image={picture.image} index={i} waiting={!!selected && !word} result={result} />
                  {word && (
                    // The floating boat itself is what a drag picks up and carries to another puddle or the bank.
                    <span data-testid="floating-boat" {...dragProps(word)} className="absolute top-[270px] left-[-5px] touch-none">
                      <Boat word={word} />
                    </span>
                  )}
                </button>
                {result !== null && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      'pointer-events-none absolute top-[6px] right-[6px] flex size-[60px] items-center justify-center rounded-full border-4 border-pond-deep text-card',
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

      {/* The bank where the boats wait: two rows of three. */}
      <div
        role="group"
        aria-label="คลังคำ"
        data-bank
        className="absolute top-[730px] left-[606px] flex h-[310px] w-[708px] flex-wrap content-start justify-center gap-x-[18px] gap-y-[20px] rounded-[40px] border-[5px] border-lily-deep bg-lily/60 px-[12px] py-[14px]"
      >
        {bankWords.length === 0 && <p className="self-center text-[44px] font-bold">ลอยเรือครบแล้ว</p>}
        {bankWords.map((word) => (
          <button
            key={word}
            type="button"
            aria-pressed={selected === word}
            onClick={drag.click(() => setSelected(selected === word ? null : word))}
            {...dragProps(word)}
            className={cx(
              'pointer-events-auto relative h-[124px] w-[210px] touch-none rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
              'transition-transform duration-150 motion-reduce:transition-none',
              selected === word && '-translate-y-[10px]',
            )}
          >
            <Boat word={word} lifted={selected === word} />
          </button>
        ))}
      </div>

      <Button onClick={retry} disabled={!results.includes(false)} className={cx(control, 'top-[748px] left-[300px] h-[124px] w-[284px] text-[35px]')}>
        <RotateCcw aria-hidden="true" className="relative size-[38px]" strokeWidth={3} />
        <span className="relative">ลองอีกครั้ง</span>
      </Button>
      <Button onClick={clearAll} className={cx(control, 'top-[906px] left-[300px] h-[124px] w-[284px] text-[35px]')}>
        <X aria-hidden="true" className="relative size-[38px]" strokeWidth={3} />
        <span className="relative">ล้างคำตอบ</span>
      </Button>
      <Button onClick={check} className={cx(control, 'top-[748px] left-[1336px] h-[282px] w-[284px] flex-col gap-[4px] rounded-[64px] text-[40px]')}>
        <Check aria-hidden="true" className="relative size-[72px]" strokeWidth={3.5} />
        <span className="relative">ตรวจคำตอบ</span>
      </Button>
    </section>
  )
}

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** A puddle with its picture reflected in the water, and the place a boat floats. */
function Puddle({ image, index, waiting, result }: { image: string; index: number; waiting: boolean; result: boolean | null }) {
  return (
    <span
      data-testid="puddle"
      className={cx(
        'pointer-events-none absolute inset-x-0 top-[30px] h-[360px] overflow-hidden rounded-[50%/42%] border-[6px] bg-[linear-gradient(180deg,#9fd6e8,var(--color-pond)_85%)]',
        result === true ? 'border-correct' : result === false ? 'border-wrong' : waiting ? 'border-raincoat' : 'border-pond-deep',
      )}
    >
      <img src={image} alt={`ภาพที่ ${index + 1}`} draggable={false} className="absolute top-[34px] left-[30px] size-[128px] object-contain" />
      {/* Its reflection, upside down and faint in the water below. */}
      <img src={image} alt="" draggable={false} className="absolute top-[150px] left-[30px] size-[128px] -scale-y-100 object-contain opacity-35" />
      <span className="absolute inset-x-[24px] top-[200px] h-[6px] rounded-full bg-card/60" />
      <span
        className={cx(
          'absolute inset-x-[14px] top-[236px] h-[100px] rounded-[50%] border-[4px] border-dashed',
          waiting ? 'border-raincoat bg-raincoat/20' : 'border-card/70',
        )}
      />
    </span>
  )
}

/** A paper boat with its word on the hull. */
function Boat({ word, lifted = false }: { word: string; lifted?: boolean }) {
  return (
    <span data-word={word} className="pointer-events-none relative block h-[124px] w-[210px]">
      <svg aria-hidden="true" viewBox="0 0 210 124" className="absolute inset-0 size-full overflow-visible">
        <path d="M105 6 L105 56 L58 56 Z M105 6 L152 56 H105 Z" fill={lifted ? 'var(--color-raincoat)' : 'var(--color-raincoat-light)'} {...ink} />
        <path d="M6 56 H204 L172 118 H38 Z" fill="var(--color-card)" {...ink} />
      </svg>
      <span className="absolute inset-x-[30px] top-[54px] text-center text-[52px] leading-[1.2] font-bold text-rubber-deep">{word}</span>
    </span>
  )
}
