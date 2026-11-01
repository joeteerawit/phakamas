import { Link } from '@tanstack/react-router'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useLessonSession } from '../session/lessonSession'
import { lessonStars, MAX_STARS } from '../session/stars'
import { pressable } from './clay/buttonClass'
import { ConfirmDialog } from './clay/ConfirmDialog'
import { popIn } from './motion/PopIn'
import { Confetti, JumpingMascot } from './Stars'
import type { StepProps } from './stepProps'
import { useRestartLesson } from './useRestartLesson'

/** A row of Star slots, the first `stars` filled and popping in one by one (a fade with reduced motion). */
function StarRow({ stars, slots, size }: { stars: number; slots: number; size: string }) {
  const still = useReducedMotion()
  return (
    <span aria-hidden="true" className={`flex leading-none ${size}`}>
      {Array.from({ length: slots }, (_, i) => (
        <motion.span
          key={i}
          className={i < stars ? '' : 'opacity-25 grayscale'}
          {...(i < stars ? popIn(i, !!still) : {})}
        >
          ⭐
        </motion.span>
      ))}
    </span>
  )
}

/** Step 10 on the cover background: เก่งมาก! sign, total Stars, each Activity's Stars and เรียนอีกครั้ง. */
export function SummaryStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const results = useLessonSession((state) => state.session?.activities)
  const { activities, total, max } = lessonStars(lesson, results)
  const restart = useRestartLesson(lesson.id)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      {!still && <Confetti loop />}
      <JumpingMascot className="top-[470px] left-[60px] h-[480px] w-[507px]" />

      <div className="absolute top-[135px] left-[640px] flex h-[245px] w-[640px] items-center justify-center bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/canva/cover/sign.webp)' }}
      >
        <h2 className="-mt-[36px] rotate-[1.66deg] font-heading text-[100px] leading-[1.4] font-bold text-navy">เก่งมาก!</h2>
      </div>

      <p className="absolute top-[392px] left-[560px] flex h-[100px] w-[800px] items-center justify-center gap-[24px] rounded-full border-[6px] border-card bg-cream font-heading text-[48px] font-bold text-navy">
        ได้ {total}/{max} ดาว
        <StarRow stars={total} slots={max} size="text-[44px]" />
      </p>

      <ul aria-label="ดาวแต่ละกิจกรรม" className="absolute top-[506px] left-[560px] flex w-[800px] flex-col gap-[10px]">
        {activities.map((activity) => {
          const title = lesson.steps[activity.step - 1]?.title
          const result = results?.[activity.id]
          return (
            <li
              key={activity.id}
              className="flex h-[124px] items-center justify-between gap-[16px] rounded-full border-[6px] border-cream-border bg-card px-[36px] font-heading text-[40px] font-bold text-navy"
            >
              <span>{title}</span>
              {result?.status === 'completed' ? (
                <span className="flex items-center gap-[16px]">
                  <span className="text-[30px] text-muted-foreground">{result.bestScore}/{activity.maxScore}</span>
                  <span className="sr-only">{activity.stars} ดาว</span>
                  <StarRow stars={activity.stars} slots={MAX_STARS} size="text-[52px]" />
                </span>
              ) : (
                <span className="flex items-center gap-[16px]">
                  <span className="text-[30px] text-muted-foreground">ยังไม่ได้ทำ</span>
                  <Link
                    to="/lesson/$lessonId/$step"
                    params={{ lessonId: lesson.id, step: String(activity.step) }}
                    aria-label={`ไปทำ ${title}`}
                    className={`${pressable} -my-[6px] flex h-[124px] items-center rounded-full border-4 border-card bg-pill ps-[24px] pe-[12px] text-[34px]`}
                  >
                    ไปทำ
                    <ChevronRight aria-hidden="true" className="size-[44px]" strokeWidth={2.75} />
                  </Link>
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        className={`${pressable} absolute top-[926px] left-[760px] flex h-[124px] w-[400px] items-center justify-center gap-[16px] rounded-full border-[6px] border-card bg-orange font-heading text-[48px] font-bold text-white shadow-orange-button active:translate-y-[6px] active:shadow-orange-button-pressed`}
      >
        <RotateCcw aria-hidden="true" className="size-[56px]" strokeWidth={2.75} />
        เรียนอีกครั้ง
      </button>

      {/* The modal sits in the top layer but would still inherit the section's pointer-events: none. */}
      <div className="pointer-events-auto">
        <ConfirmDialog
          open={confirmReset}
          message="ล้างความคืบหน้าและคะแนนทั้งหมด แล้วเริ่มเรียนใหม่ไหม?"
          confirmLabel="ล้างและเริ่มใหม่"
          cancelLabel="ยกเลิก"
          onCancel={() => setConfirmReset(false)}
          onConfirm={restart}
        />
      </div>
    </section>
  )
}
