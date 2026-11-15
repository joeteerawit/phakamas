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
import { JumpingMascot } from '../../../ui/Stars'
import { ink } from '../kit/ink'

// Stage pixels. The nine terraces climb the hillside from the bottom (y = 980) to the top (356), each narrower than the
// one below; the bamboo hut stands on the top one. The summary sign stands in front of them in the middle
// (610–1310 × 400–900), so each terrace shows at both its ends, and เรียนอีกครั้ง sits under the sign.
const TERRACE = { bottom: 980, step: 78, height: 70, left: 300, right: 1620, inset: 40 }
const terraceBox = (i: number) => ({
  left: TERRACE.left + i * TERRACE.inset,
  width: TERRACE.right - TERRACE.left - 2 * i * TERRACE.inset,
  top: TERRACE.bottom - i * TERRACE.step,
})

/**
 * แม่กก Step 10, the bamboo hut (docs/mae-kok-spec.md), over the kok-sunset Scene: น้องนก is home at the bamboo hut at the
 * top of the hillside, and its nine terraces, one for each Star the Lesson can give, ripen from bare soil to a green
 * crop one at a time, one per Star earned, from the bottom up; the rest stay bare, so the ripe terraces are exactly the
 * Lesson's Stars. In front of them a kraft seed-packet sign says เก่งมาก! with the total in seed-stars and each
 * Activity's Stars on its row (a row not done yet is a terracotta ไปทำ stake back to it), and the terracotta pot
 * เรียนอีกครั้ง asks first, then clears the Session and starts again. Under reduced motion the earned terraces simply
 * stand ripe.
 */
export function SummaryStep({ lesson }: StepProps) {
  const { Button, card } = useKit()
  const still = !!useReducedMotion()
  const results = useLessonSession((state) => state.session?.activities)
  const { activities, total, max } = lessonStars(lesson, results)
  const restart = useRestartLesson(lesson.id)
  const [confirming, setConfirming] = useState(false)

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0 font-heading text-soil-deep">
      <Terraces count={max} ripe={total} still={still} />
      <BambooHut />
      <JumpingMascot className="top-[200px] left-[1080px] h-[150px] w-[130px]" />

      <div data-testid="summary-sign" className={cx('absolute top-[400px] left-[610px] flex h-[500px] w-[700px] flex-col items-center pt-[34px]', card)}>
        <h2 className="relative text-[64px] leading-[1.3] font-bold">เก่งมาก!</h2>
        <p className="relative mt-[4px] flex h-[70px] items-center gap-[14px] rounded-full border-[5px] border-soil bg-kraft-light px-[28px] text-[38px] font-bold whitespace-nowrap">
          ได้ {total}/{max} ดาว
          <StarRow stars={total} slots={max} />
        </p>
        <ul aria-label="ดาวแต่ละกิจกรรม" className="relative mt-[20px] flex w-[620px] flex-col gap-[10px]">
          {activities.map((activity) => {
            const title = lesson.steps[activity.step - 1]?.title
            const result = results?.[activity.id]
            return (
              <li key={activity.id} className="flex h-[76px] items-center justify-between rounded-[14px] border-[4px] border-soil bg-kraft-light/80 px-[18px]">
                <span className="text-[32px] leading-[1.2] font-bold whitespace-nowrap">{title}</span>
                {result?.status === 'completed' ? (
                  <span className="flex items-center gap-[14px]">
                    <span className="text-[28px] text-soil">
                      {result.bestScore}/{activity.maxScore}
                    </span>
                    <span className="sr-only">{activity.stars} ดาว</span>
                    <StarRow stars={activity.stars} slots={MAX_STARS} />
                  </span>
                ) : (
                  <Link
                    to="/lesson/$lessonId/$step"
                    params={{ lessonId: lesson.id, step: String(activity.step) }}
                    aria-label={`ไปทำ ${title}`}
                    data-testid="todo-stake"
                    className="pointer-events-auto relative -my-[26px] flex h-[124px] items-center rounded-[14px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <span aria-hidden="true" className="flex h-[64px] items-center rounded-[10px] border-[4px] border-soil-deep bg-terracotta ps-[18px] pe-[8px] text-[28px] font-bold text-kraft-light">
                      ไปทำ
                      <ChevronRight className="size-[32px]" strokeWidth={3} />
                    </span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <Button data-main onClick={() => setConfirming(true)} className="absolute top-[930px] left-[770px] flex h-[124px] w-[380px] items-center justify-center gap-[14px] text-[46px] font-bold">
        <RotateCcw aria-hidden="true" className="relative mt-[10px] size-[50px] shrink-0" strokeWidth={3} />
        <span className="relative mt-[10px]">เรียนอีกครั้ง</span>
      </Button>

      <div className="pointer-events-auto">
        <GardenConfirm open={confirming} onCancel={() => setConfirming(false)} onConfirm={restart} />
      </div>
    </section>
  )
}

/** A row of seed-star slots, the first `stars` filled; an empty slot is a pale seed-star. */
function StarRow({ stars, slots }: { stars: number; slots: number }) {
  const { Star } = useKit()
  return (
    <span aria-hidden="true" className="flex gap-[4px] text-[36px] leading-none">
      {Array.from({ length: slots }, (_, i) => (
        <span key={i} data-earned={i < stars || undefined} className={i < stars ? undefined : 'opacity-30 grayscale'}>
          <Star />
        </span>
      ))}
    </span>
  )
}

/** The nine terraces, bottom first: terrace `i` is ripe, its crop green, once `ripe > i`; the rest stay bare soil. */
function Terraces({ count, ripe, still }: { count: number; ripe: number; still: boolean }) {
  return (
    <div data-testid="terraces" role="img" aria-label={`แปลงผักสุก ${ripe} จาก ${count} ขั้น`} className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => {
        const box = terraceBox(i)
        const lit = i < ripe
        return (
          <div
            key={i}
            data-testid="terrace"
            data-ripe={lit || undefined}
            className="absolute rounded-t-[30px] border-[5px] border-soil-deep bg-soil"
            style={{ ...box, height: TERRACE.height + 20 }}
          >
            {/* The furrows of bare soil, and the crop that ripens over them. */}
            <span className="absolute inset-x-[20px] top-[20px] h-[6px] rounded-full bg-soil-deep/40" />
            {lit && (
              <motion.span
                data-testid="terrace-crop"
                className="absolute inset-x-[8px] top-[4px] h-[44px] rounded-[20px] bg-sprout"
                initial={still ? false : { scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                style={{
                  transformOrigin: 'bottom',
                  backgroundImage: 'radial-gradient(circle, var(--color-sprout-light) 0 6px, transparent 7px)',
                  backgroundSize: '40px 40px',
                }}
                transition={{ delay: still ? 0 : 0.3 + i * 0.25, duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** The bamboo hut on the top terrace, where น้องนก is home. */
function BambooHut() {
  const top = terraceBox(8).top
  return (
    <svg aria-hidden="true" data-testid="bamboo-hut" viewBox="0 0 240 180" className="pointer-events-none absolute w-[240px] overflow-visible" style={{ left: 840, top: top - 176 }}>
      <path d="M40 180 V100 M200 180 V100" {...ink} strokeWidth={10} />
      <rect x="40" y="80" width="160" height="90" fill="#d9c27a" {...ink} />
      {[72, 104, 136, 168].map((x) => (
        <path key={x} d={`M${x} 80 V170`} stroke="#a88e46" strokeWidth={5} />
      ))}
      <rect x="100" y="110" width="40" height="60" rx="6" fill="var(--color-soil-deep)" />
      <path d="M10 90 L120 10 L230 90 Z" fill="var(--color-kraft-deep)" {...ink} />
    </svg>
  )
}

/** เรียนอีกครั้ง asks first, on a native modal dialog in the แม่กก Kit: focus trapped, Esc cancels, the safe choice focused. */
function GardenConfirm({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
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
      aria-labelledby="garden-confirm"
      onClose={onCancel}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-[22px] border-[5px] border-soil-deep bg-kraft-light p-6 text-center font-heading text-soil-deep backdrop:bg-soil-deep/50"
    >
      <p id="garden-confirm" className="mb-5 text-[1.4rem] leading-[1.5] font-bold">
        ล้างความคืบหน้าและคะแนนทั้งหมด แล้วเริ่มเรียนใหม่ไหม?
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Safe choice first in focus order: showModal focuses it. */}
        <Button autoFocus onClick={onCancel} className="relative min-h-14 px-6 pt-2 text-[1.2rem] font-bold">
          <span className="relative">ยกเลิก</span>
        </Button>
        <Button onClick={onConfirm} className="relative min-h-14 px-6 pt-2 text-[1.2rem] font-bold">
          <span className="relative">ล้างและเริ่มใหม่</span>
        </Button>
      </div>
    </dialog>
  )
}
