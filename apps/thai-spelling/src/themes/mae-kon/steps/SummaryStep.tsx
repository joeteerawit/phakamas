import { Link } from '@tanstack/react-router'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useLessonSession } from '../../../session/lessonSession'
import { lessonStars, MAX_STARS } from '../../../session/stars'
import { useRestartLesson } from '../../../session/useRestartLesson'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'

// Stage pixels. เก่งมาก! and the total under the title row (150–330); the Activities on bamboo-tray rows at the left
// (330–930 × 360–770) and the review words at the right (990–1590); the nine lotus buds across the canal (330–1590 ×
// 790–910); เรียนอีกครั้ง at the bottom between Back and Next. น้องส้ม cheers from her boat at the left edge.
const LOTUS = { left: 330, top: 784, width: 140, height: 130 }

/**
 * แม่กน Step 10, lotus at dusk (docs/mae-kon-spec.md), over the canal at dusk. Nine lotus buds float on the water, one
 * for each Star the Lesson can give: one opens for each Star the Lesson gave, left to right, so the open lotuses are
 * exactly the Lesson's Stars. เก่งมาก! with the total in paddle Stars, each Activity's Stars on a bamboo-tray row (an
 * Activity not done yet is a ไปทำ back to it), the review words (the six words and the two rhyming pairs), and
 * เรียนอีกครั้ง, which asks first, then clears the Session and starts again. Under reduced motion the earned lotuses are
 * simply open.
 */
export function SummaryStep({ lesson }: StepProps) {
  const { Button, card } = useKit()
  const { poses } = useMascot()
  const still = !!useReducedMotion()
  const results = useLessonSession((state) => state.session?.activities)
  const { activities, total, max } = lessonStars(lesson, results)
  const restart = useRestartLesson(lesson.id)
  const [confirming, setConfirming] = useState(false)

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0 font-heading text-kon-ink">
      <h2 className="bamboo-label absolute top-[150px] left-1/2 flex h-[96px] -translate-x-1/2 items-center px-[48px] text-[64px] leading-[1.3] font-bold">เก่งมาก!</h2>
      <p className="absolute top-[258px] left-1/2 flex h-[74px] -translate-x-1/2 items-center gap-[14px] rounded-full border-[5px] border-kon-ink bg-honey-light px-[28px] text-[38px] font-bold whitespace-nowrap">
        ได้ {total}/{max} ดาว
        <StarRow stars={total} slots={max} />
      </p>

      {/* Each Activity on a bamboo-tray row; one not done yet is itself the way back to it. */}
      <ul aria-label="ดาวแต่ละกิจกรรม" className="absolute top-[360px] left-[330px] flex w-[600px] flex-col gap-[14px]">
        {activities.map((activity) => {
          const title = lesson.steps[activity.step - 1]?.title
          const result = results?.[activity.id]
          const row = cx('relative flex h-[128px] w-full items-center justify-between gap-[12px] px-[24px]', card)
          return (
            <li key={activity.id}>
              {result?.status === 'completed' ? (
                <div className={row}>
                  <span className="text-[34px] leading-[1.3] font-bold whitespace-nowrap">{title}</span>
                  <span className="flex items-center gap-[12px]">
                    <span className="text-[28px] text-teak-deep">
                      {result.bestScore}/{activity.maxScore}
                    </span>
                    <span className="sr-only">{activity.stars} ดาว</span>
                    <StarRow stars={activity.stars} slots={MAX_STARS} />
                  </span>
                </div>
              ) : (
                <Link
                  to="/lesson/$lessonId/$step"
                  params={{ lessonId: lesson.id, step: String(activity.step) }}
                  aria-label={`ไปทำ ${title}`}
                  className={cx(row, 'pointer-events-auto cursor-pointer focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring')}
                >
                  <span className="text-[34px] leading-[1.3] font-bold whitespace-nowrap">{title}</span>
                  <span aria-hidden="true" className="flex items-center gap-[10px]">
                    <span className="text-[26px] text-teak-deep">ยังไม่ได้ทำ</span>
                    <span className="flex items-center rounded-[16px] border-[4px] border-kon-ink bg-coral ps-[16px] pe-[6px] text-[28px] font-bold text-card">
                      ไปทำ
                      <ChevronRight className="size-[32px]" strokeWidth={3} />
                    </span>
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      <ReviewWords lesson={lesson} />

      <LotusPond open={total} of={max} still={still} />

      {/* น้องส้ม cheering from her boat at the left edge, above Back. */}
      <motion.img
        data-testid="summary-mascot"
        src={poses.cheer}
        alt=""
        draggable={false}
        className="pointer-events-none absolute top-[560px] left-[120px] h-[230px] w-[167px] object-contain select-none"
        animate={still ? undefined : { y: [0, -16, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Button onClick={() => setConfirming(true)} className="absolute top-[936px] left-[760px] flex h-[124px] w-[400px] items-center justify-center gap-[14px] px-[36px] text-[40px] font-bold whitespace-nowrap">
        <RotateCcw aria-hidden="true" className="relative size-[50px] shrink-0" strokeWidth={3} />
        <span className="relative">เรียนอีกครั้ง</span>
      </Button>

      <div className="pointer-events-auto">
        <CanalConfirm open={confirming} onCancel={() => setConfirming(false)} onConfirm={restart} />
      </div>
    </section>
  )
}

/** The review words: the six words of the Lesson (Section A) and its two rhyming pairs (Section B). */
function ReviewWords({ lesson }: StepProps) {
  const { card } = useKit()
  return (
    <section aria-label="ทบทวนคำ" className={cx('absolute top-[360px] left-[990px] flex h-[412px] w-[600px] flex-col gap-[10px] px-[24px] py-[12px]', card)}>
      <h3 className="text-[30px] leading-[1.3] font-bold">คำใน{lesson.finalGroup}</h3>
      <ul aria-label="คำในบทเรียน" className="flex flex-wrap gap-[10px]">
        {lesson.vocabulary.map(({ word }) => (
          <li key={word} className="wooden-tile px-[14px] text-[36px] leading-[1.5] font-bold">
            {word}
          </li>
        ))}
      </ul>
      <h3 className="mt-[4px] text-[30px] leading-[1.3] font-bold">คำคล้องจอง</h3>
      <ul aria-label="คู่คำคล้องจอง" className="flex gap-[14px]">
        {lesson.rhymeMatching.pairs.map(({ left, right }) => (
          <li key={left} className="rounded-[18px] border-[4px] border-kon-ink bg-honey-light px-[16px] text-[34px] leading-[1.5] font-bold whitespace-nowrap">
            {left} – {right}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A row of paddle Star slots, the first `stars` filled; an empty slot is faded. */
function StarRow({ stars, slots }: { stars: number; slots: number }) {
  const { Star } = useKit()
  return (
    <span aria-hidden="true" className="flex gap-[4px] text-[40px] leading-none">
      {Array.from({ length: slots }, (_, i) => (
        <span key={i} data-earned={i < stars || undefined} className={i < stars ? undefined : 'opacity-30 grayscale'}>
          <Star />
        </span>
      ))}
    </span>
  )
}

/** The nine lotus buds on their pads across the canal: lotus `i` (left first) is open once `open > i`. */
function LotusPond({ open, of, still }: { open: number; of: number; still: boolean }) {
  return (
    <svg
      data-testid="lotus-pond"
      role="img"
      aria-label={`บัวบาน ${open} จาก ${of} ดอก`}
      viewBox={`0 0 ${LOTUS.width * of} ${LOTUS.height}`}
      className="pointer-events-none absolute overflow-visible"
      style={{ left: LOTUS.left, top: LOTUS.top, width: LOTUS.width * of, height: LOTUS.height }}
    >
      {Array.from({ length: of }, (_, i) => (
        <g key={i} data-testid="lotus" data-open={i < open || undefined} transform={`translate(${i * LOTUS.width + LOTUS.width / 2} 0)`}>
          <ellipse cx="0" cy="112" rx="62" ry="16" fill="var(--color-banana-deep)" stroke="var(--color-kon-ink)" strokeWidth={4} />
          {i < open ? <Bloom index={i} still={still} /> : <Bud />}
        </g>
      ))}
    </svg>
  )
}

/** A closed lotus bud, pale pink, standing on its pad. */
function Bud() {
  return (
    <g data-testid="lotus-bud">
      <path d="M0 108 V92" stroke="var(--color-banana-deep)" strokeWidth={6} />
      <path d="M0 30 C22 52 22 80 0 96 C-22 80 -22 52 0 30 Z" fill="#f8d3e0" stroke="var(--color-kon-ink)" strokeWidth={4} strokeLinejoin="round" />
      <path d="M0 40 V90" stroke="var(--color-lotus)" strokeWidth={3} />
    </g>
  )
}

/** An open lotus, its petals spread round a golden heart; it opens in turn, or stands open under reduced motion. */
function Bloom({ index, still }: { index: number; still: boolean }) {
  const petals = [-70, -40, -14, 14, 40, 70]
  return (
    <motion.g
      data-testid="lotus-bloom"
      style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
      initial={still ? false : { scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: still ? 0 : 0.3 + index * 0.18, ease: 'easeOut' }}
    >
      {petals.map((deg) => (
        <path
          key={deg}
          d="M0 100 C18 80 20 50 0 26 C-20 50 -18 80 0 100 Z"
          transform={`rotate(${deg} 0 100)`}
          fill="var(--color-lotus)"
          stroke="var(--color-lotus-deep)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
      <path d="M0 100 C18 80 20 50 0 26 C-20 50 -18 80 0 100 Z" fill="#fbc2d4" stroke="var(--color-lotus-deep)" strokeWidth={3} />
      <ellipse cx="0" cy="88" rx="16" ry="9" fill="var(--color-marigold)" stroke="var(--color-kon-ink)" strokeWidth={3} />
    </motion.g>
  )
}

/** เรียนอีกครั้ง asks first, on a native modal dialog: focus trapped, Esc cancels, the safe choice focused. */
function CanalConfirm({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { Button } = useKit()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby="canal-confirm"
      onClose={onCancel}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-[28px] border-[5px] border-kon-ink bg-honey-light p-6 text-center font-heading text-kon-ink backdrop:bg-kon-ink/50"
    >
      <p id="canal-confirm" className="mb-5 text-[1.4rem] leading-[1.5] font-bold">
        ล้างความคืบหน้าและคะแนนทั้งหมด แล้วเริ่มเรียนใหม่ไหม?
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Safe choice first in focus order: showModal focuses it. */}
        <Button autoFocus onClick={onCancel} className="relative min-h-14 px-8 text-[1.2rem] font-bold">
          <span className="relative">ยกเลิก</span>
        </Button>
        <Button onClick={onConfirm} className="relative min-h-14 px-8 text-[1.2rem] font-bold">
          <span className="relative">ล้างและเริ่มใหม่</span>
        </Button>
      </div>
    </dialog>
  )
}
