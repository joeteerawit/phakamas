import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, House, Volume2, VolumeX } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { stopAudio, toggleMute, useAudio } from '../audio/audioManager'
import type { Lesson } from '../lessons'
import { lessonActivities, useUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { buttonClass, iconButtonClass } from './clay/buttonClass'
import { ConfirmDialog } from './clay/ConfirmDialog'
import { FeedbackToast, type Feedback } from './clay/FeedbackToast'
import { IconButton } from './clay/IconButton'
import { GardenBackdrop } from './GardenBackdrop'

type StepLayoutProps = {
  lesson: Lesson
  stepNumber: number
  /** Activity feedback shown in the toast; placeholder Steps pass none. */
  feedback?: Feedback | null
  children: ReactNode
}

/**
 * Shared Step layout (spec §1.3, MASTER.md "Responsive Layout").
 * < 1024px: compact header, progress bar, single column, Back/Next fixed to the bottom.
 * ≥ 1024px: everything inside a centred storybook panel on the garden.
 */
export function StepLayout({ lesson, stepNumber, feedback = null, children }: StepLayoutProps) {
  const totalSteps = lesson.steps.length
  const isFirst = stepNumber === 1
  const isLast = stepNumber === totalSteps
  const stepParams = (step: number) => ({ lessonId: lesson.id, step: String(step) })

  const direction = useStepDirection(stepNumber)
  const reduceMotion = useReducedMotion()
  const muted = useAudio((state) => state.muted)
  // AUD-004: leaving a Step stops its sound.
  useEffect(() => stopAudio, [stepNumber])

  // Spec §4: only ถัดไป without checking marks this Step's Activity skipped; Back and Home never do.
  const activity = lessonActivities(lesson).find((a) => a.step === stepNumber)
  const skipActivity = useLessonSession((state) => state.skipActivity)
  const skip = () => activity && skipActivity(activity.id, activity.maxScore)

  // TC-019: Home asks first while the Activity has unchecked answers.
  const unchecked = useUncheckedWork((state) => state.unchecked)
  const [confirmHome, setConfirmHome] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <GardenBackdrop />

      <div className="mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col lg:px-(--space-lg) lg:py-(--space-xl)">
        <div className="flex flex-1 flex-col lg:rounded-storybook lg:border-[6px] lg:border-sun lg:bg-card lg:shadow-clay">
          <header className="flex items-center gap-(--space-sm) px-(--space-md) pt-(--space-md) lg:px-(--space-xl) lg:pt-(--space-lg)">
            <Link
              to="/lesson/$lessonId/$step"
              params={stepParams(1)}
              aria-label="กลับไปหน้าปก"
              className={iconButtonClass()}
              onClick={(event) => {
                if (!unchecked) return
                event.preventDefault()
                setConfirmHome(true)
              }}
            >
              <House aria-hidden="true" className="size-7" strokeWidth={2.5} />
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-(--space-md) lg:justify-between lg:ps-(--space-sm)">
              <p className="hidden min-w-0 truncate font-heading text-heading font-semibold lg:block">{lesson.title}</p>
              <p className="flex min-h-12 shrink-0 items-center rounded-full border-[3px] border-border bg-sun px-(--space-md) font-semibold whitespace-nowrap shadow-clay">
                ขั้น {stepNumber}/{totalSteps}
              </p>
            </div>

            <IconButton
              icon={muted ? VolumeX : Volume2}
              label="ปิดเสียง"
              aria-pressed={muted}
              onClick={toggleMute}
            />
          </header>

          <div className="px-(--space-md) pt-(--space-md) lg:px-(--space-xl)">
            <div
              role="progressbar"
              aria-label="ความคืบหน้าบทเรียน"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={stepNumber}
              aria-valuetext={`ขั้น ${stepNumber} จาก ${totalSteps}`}
              className="h-4 w-full overflow-hidden rounded-full border-2 border-border bg-card"
            >
              <div
                className="h-full w-full origin-left rounded-full bg-linear-to-r from-red via-sun to-hill-deep transition-transform duration-250 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${stepNumber / totalSteps})` }}
              />
            </div>
          </div>

          <main className="flex flex-1 flex-col overflow-x-clip px-(--space-md) pt-(--space-lg) pb-bottom-bar lg:px-(--space-xl) lg:pb-(--space-lg)">
            <motion.div
              key={stepNumber}
              className="flex flex-1 flex-col"
              initial={reduceMotion ? false : { opacity: 0, x: direction * 48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>

          <nav
            aria-label="เปลี่ยนขั้น"
            className="fixed inset-x-0 bottom-0 z-20 border-t-[3px] border-border bg-card/95 px-(--space-md) pt-(--space-sm) pb-safe-area backdrop-blur-sm lg:static lg:z-auto lg:rounded-b-storybook lg:bg-transparent lg:px-(--space-xl) lg:py-(--space-md) lg:backdrop-blur-none"
          >
            {/* Phones: two equal columns, Next always on the right. Desktop: pills at either end. */}
            <div className="mx-auto grid max-w-[1100px] grid-cols-2 items-center gap-(--space-sm) lg:flex lg:justify-between">
              {!isFirst && (
                <Link
                  to="/lesson/$lessonId/$step"
                  params={stepParams(stepNumber - 1)}
                  className={`${buttonClass('ghost', 'bar')} col-start-1`}
                >
                  <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2.75} />
                  ย้อนกลับ
                </Link>
              )}
              {isLast ? (
                <Link
                  to="/lesson/$lessonId/$step"
                  params={stepParams(1)}
                  className={`${buttonClass('primary', 'bar')} col-start-2 lg:ms-auto`}
                >
                  <House aria-hidden="true" className="hidden size-6 sm:block" strokeWidth={2.5} />
                  กลับหน้าแรก
                </Link>
              ) : (
                <Link
                  to="/lesson/$lessonId/$step"
                  params={stepParams(stepNumber + 1)}
                  onClick={skip}
                  className={`${buttonClass('primary', 'bar')} col-start-2 lg:ms-auto`}
                >
                  ถัดไป
                  <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2.75} />
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>

      <ConfirmDialog
        open={confirmHome}
        message="ยังไม่ได้ตรวจคำตอบ จะออกจากหน้านี้ไหม?"
        confirmLabel="ออกจากหน้านี้"
        cancelLabel="ทำต่อ"
        onCancel={() => setConfirmHome(false)}
        onConfirm={() => {
          setConfirmHome(false)
          void navigate({ to: '/lesson/$lessonId/$step', params: stepParams(1) })
        }}
      />

      <FeedbackToast
        feedback={feedback}
        className="fixed inset-x-0 bottom-above-bar z-30 flex justify-center px-(--space-md) lg:bottom-(--space-xl)"
      />
    </div>
  )
}

/** +1 when moving to a later Step, -1 when going back; drives the slide direction. */
function useStepDirection(stepNumber: number) {
  const [previousStep, setPreviousStep] = useState(stepNumber)
  const [direction, setDirection] = useState(1)
  if (stepNumber !== previousStep) {
    setDirection(stepNumber > previousStep ? 1 : -1)
    setPreviousStep(stepNumber)
  }
  return direction
}
