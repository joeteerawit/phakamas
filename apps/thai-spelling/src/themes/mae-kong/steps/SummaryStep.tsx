import { Link } from '@tanstack/react-router'
import { ChevronRight, RotateCcw, Star } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useLessonSession } from '../../../session/lessonSession'
import { lessonStars, MAX_STARS } from '../../../session/stars'
import { orangeButton, pressable } from '../../../ui/clay/buttonClass'
import { ConfirmDialog } from '../../../ui/clay/ConfirmDialog'
import { popIn } from '../../../ui/motion/PopIn'
import { Confetti, JumpingMascot } from '../../../ui/Stars'
import type { StepProps } from '../../../steps/stepProps'
import { useRestartLesson } from '../../../session/useRestartLesson'

/**
 * A row of Star slots, the first `stars` filled and popping in one by one (a fade with reduced motion).
 * An empty slot is an ink-outlined Star on white, so it reads on the cream and white rows and stays unlike a gold ⭐.
 */
function StarRow({ stars, slots, size }: { stars: number; slots: number; size: string }) {
  const still = useReducedMotion()
  return (
    <span aria-hidden="true" className={`flex leading-none ${size}`}>
      {Array.from({ length: slots }, (_, i) =>
        i < stars ? (
          <motion.span key={i} {...popIn(i, !!still)}>
            ⭐
          </motion.span>
        ) : (
          <span key={i} className="flex">
            <Star className="size-[1em] fill-card text-comic-ink" strokeWidth={2.25} />
          </span>
        ),
      )}
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
      {/* The Mascot (380) + 24 gap + the total and list column (800) are centred on x = 960 as one group: 358–1562. */}
      <JumpingMascot className="top-[500px] left-[358px] h-[360px] w-[380px]" />

      {/* The cover's comic sign (1120×730 art) at 467×304; its board is 67–267 px down, so pt-[29px] centres the text on it. */}
      <div
        className="absolute top-[73px] left-[727px] flex h-[304px] w-[467px] items-center justify-center bg-contain bg-center bg-no-repeat pt-[29px]"
        style={{ backgroundImage: 'url(/assets/comic/cover-sign.webp)' }}
      >
        <h2 className="font-heading text-[88px] leading-[1.4] font-bold text-navy">เก่งมาก!</h2>
      </div>

      <p className="absolute top-[386px] left-[762px] flex h-[100px] w-[800px] items-center justify-center gap-[24px] rounded-full border-[6px] border-comic-ink bg-cream font-heading text-[48px] font-bold text-navy shadow-comic">
        ได้ {total}/{max} ดาว
        <StarRow stars={total} slots={max} size="text-[44px]" />
      </p>

      <ul aria-label="ดาวแต่ละกิจกรรม" className="absolute top-[500px] left-[762px] flex w-[800px] flex-col gap-[16px]">
        {activities.map((activity) => {
          const title = lesson.steps[activity.step - 1]?.title
          const result = results?.[activity.id]
          return (
            <li
              key={activity.id}
              className="flex h-[124px] items-center justify-between gap-[16px] rounded-full border-[6px] border-comic-ink bg-card px-[36px] font-heading text-[40px] font-bold text-navy shadow-comic"
            >
              <span>{title}</span>
              {result?.status === 'completed' ? (
                <span className="flex items-center gap-[16px]">
                  <span className="text-[30px] text-muted-foreground">{result.bestScore}/{activity.maxScore}</span>
                  <span className="sr-only">{activity.stars} ดาว</span>
                  <StarRow stars={activity.stars} slots={MAX_STARS} size="text-[52px]" />
                </span>
              ) : (
                <span className="flex items-center gap-[24px]">
                  <span className="text-[34px] text-muted-foreground">ยังไม่ได้ทำ</span>
                  {/* A 124px tap target around a smaller pill, so the pill keeps room inside the row's outline. */}
                  <Link
                    to="/lesson/$lessonId/$step"
                    params={{ lessonId: lesson.id, step: String(activity.step) }}
                    aria-label={`ไปทำ ${title}`}
                    className={`${pressable} -my-[6px] flex h-[124px] items-center rounded-full`}
                  >
                    <span className="flex h-[84px] items-center rounded-full border-[5px] border-comic-ink bg-pill ps-[24px] pe-[12px] text-[34px]">
                      ไปทำ
                      <ChevronRight aria-hidden="true" className="size-[44px]" strokeWidth={2.75} />
                    </span>
                  </Link>
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {/* 26px clear under the list's hard shadow (list ends 904 + 8). */}
      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        className={`${orangeButton} absolute top-[938px] left-[730px] w-[460px]`}
      >
        <RotateCcw aria-hidden="true" className="size-[56px] shrink-0" strokeWidth={2.75} />
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
