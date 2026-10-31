import { Check, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { scoreFeedback, useClearFeedbackOnLeave } from '../activities/feedback'
import { lessonActivity, useReportUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { cardClass, toneAt } from './clay/Card'
import { WoodenSign } from './clay/WoodenSign'
import type { ActivityStepProps } from './stepProps'
import { usePointerDrag } from './usePointerDrag'

/**
 * Step 6: place each bank word in the blank under its picture.
 * Tap-to-select (mouse, touch, keyboard) is the main path; Pointer-Events drag is a shortcut.
 */
export function WordFillingStep({ lesson, title, onFeedback }: ActivityStepProps) {
  const { bank, pictures } = lesson.wordFilling
  const activity = lessonActivity(lesson, 'wordFilling')
  const [placed, setPlaced] = useState<(string | null)[]>(() => pictures.map(() => null))
  // null = not checked since the blank last changed.
  const [results, setResults] = useState<(boolean | null)[]>(() => pictures.map(() => null))
  const [selected, setSelected] = useState<string | null>(null)
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  // A placed word not checked since it moved; Home asks before throwing it away.
  useReportUncheckedWork(activity, placed.some((word, i) => word !== null && results[i] === null))
  useClearFeedbackOnLeave(onFeedback)

  const update = (next: (string | null)[]) => {
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
    setSelected(null)
    recordActivityCheck(activity.id, score, activity.maxScore, placed)
    onFeedback(scoreFeedback(score, activity.maxScore, 'กดลองอีกครั้งเพื่อแก้ช่องที่ผิด'))
  }
  const retry = () => {
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
      style: d ? { transform: `translate(${d.dx}px, ${d.dy}px)`, position: 'relative' as const, zIndex: 40, transition: 'none' } : undefined,
    }
  }

  const bankWords = bank.filter((word) => !placed.includes(word))

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-md)">
      <WoodenSign>{title}</WoodenSign>
      <p className="text-center text-muted-foreground">แตะคำ แล้วแตะช่องใต้ภาพ หรือลากคำไปวาง</p>

      <div
        role="group"
        aria-label="คลังคำ"
        data-bank
        className={cx(
          cardClass(),
          'flex min-h-24 w-full max-w-3xl flex-wrap items-center justify-center gap-(--space-sm) p-(--space-sm)',
        )}
      >
        {bankWords.length === 0 && <p className="text-muted-foreground">วางคำครบแล้ว</p>}
        {bankWords.map((word) => (
          <button
            key={word}
            type="button"
            aria-pressed={selected === word}
            onClick={drag.click(() => setSelected(selected === word ? null : word))}
            {...dragProps(word)}
            className={cx(
              buttonClass('ghost'),
              'touch-none font-heading text-heading font-bold',
              selected === word && 'border-highlight bg-tint-pink -translate-y-1',
            )}
          >
            {word}
          </button>
        ))}
      </div>

      <ul className="grid w-full max-w-3xl grid-cols-2 gap-(--space-sm) sm:gap-(--space-md) md:grid-cols-3">
        {pictures.map((picture, i) => {
          const word = placed[i]
          const result = results[i]
          const resultText = result === true ? ' ถูก' : result === false ? ' ผิด' : ''
          return (
            <li
              key={picture.answer}
              data-blank={i}
              className={cx(
                cardClass({ tone: toneAt(i) }),
                'flex flex-col items-center gap-(--space-xs) p-(--space-sm)',
                result === true && 'border-correct',
                result === false && 'border-wrong',
              )}
            >
              <img
                src={picture.image}
                alt={`ภาพที่ ${i + 1}`}
                width={256}
                height={256}
                draggable={false}
                className="pointer-events-none size-20 object-contain sm:size-28"
              />
              <button
                type="button"
                aria-label={`ช่องที่ ${i + 1}: ${word ?? 'ว่าง'}${resultText}`}
                onClick={drag.click(() => tapBlank(i))}
                {...(word ? dragProps(word) : {})}
                className={cx(
                  'flex min-h-14 w-full cursor-pointer select-none items-center justify-center rounded-full border-[3px] px-(--space-xs)',
                  'font-heading text-heading font-bold transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none',
                  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  word
                    ? 'touch-none border-border bg-card shadow-clay active:translate-y-1 active:shadow-clay-pressed'
                    : 'border-dashed bg-card/60 text-muted-foreground',
                  !word && (selected ? 'border-highlight' : 'border-border'),
                )}
              >
                {word ?? <span aria-hidden="true">…</span>}
              </button>
              {result !== null && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'flex items-center gap-(--space-xs) font-semibold',
                    result ? 'text-correct' : 'text-wrong',
                  )}
                >
                  {result ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
                  {resultText.trim()}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex w-full flex-col items-stretch gap-(--space-sm) sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
        <Button onClick={check}>
          <Check aria-hidden="true" className="size-6" strokeWidth={2.75} />
          ตรวจคำตอบ
        </Button>
        <Button variant="ghost" onClick={retry} disabled={!results.includes(false)}>
          <RotateCcw aria-hidden="true" className="size-6" strokeWidth={2.5} />
          ลองอีกครั้ง
        </Button>
        <Button variant="ghost" onClick={clearAll}>
          <X aria-hidden="true" className="size-6" strokeWidth={2.75} />
          ล้างคำตอบ
        </Button>
      </div>
    </section>
  )
}
