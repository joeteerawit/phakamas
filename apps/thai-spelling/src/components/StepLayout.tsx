import { Link, useNavigate } from '@tanstack/react-router'
import { Volume2, VolumeX } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { stopAudio, toggleMute, useAudio } from '../audio/audioManager'
import type { Lesson } from '../lessons'
import { lessonActivities, useUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { ConfirmDialog } from './clay/ConfirmDialog'
import { FeedbackToast, type Feedback } from './clay/FeedbackToast'
import { Stage, type Scene } from './stage/Stage'

/** Shared chrome exported from Canva (docs/canva-assets.md). */
const CHROME = '/assets/canva/chrome'

type StepLayoutProps = {
  lesson: Lesson
  stepNumber: number
  /** Activity feedback shown in the toast; placeholder Steps pass none. */
  feedback?: Feedback | null
  /** Stage background; a Step may pick the pond scene. */
  scene?: Scene
  /** The Step lays itself out in stage pixels over the whole stage instead of the scrolling content area. */
  fullStage?: boolean
  children: ReactNode
}

const chromeImage = 'pointer-events-none size-full select-none object-contain'
const pressable =
  'absolute block transition-transform duration-150 ease-out active:scale-95 motion-reduce:transition-none ' +
  'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring'

/**
 * Shared Step layout (spec §1.3, MASTER.md "Canva garden"): every Step sits on the 1920×1080 stage
 * with the title sign, Home, mute, Back and Next from the Canva design. Positions are stage pixels
 * copied from design DAHZj0Nxyxs page 2.
 */
export function StepLayout({ lesson, stepNumber, feedback = null, scene = 'garden', fullStage = false, children }: StepLayoutProps) {
  const totalSteps = lesson.steps.length
  const isFirst = stepNumber === 1
  const isLast = stepNumber === totalSteps
  const title = lesson.steps[stepNumber - 1]?.title
  const stepParams = (step: number) => ({ lessonId: lesson.id, step: String(step) })

  const direction = useStepDirection(stepNumber)
  const reduceMotion = useReducedMotion()
  const muted = useAudio((state) => state.muted)
  // AUD-004: leaving a Step stops its sound.
  useEffect(() => stopAudio, [stepNumber])

  // Spec §4: ถัดไป completes a plain Step; on an Activity it saves partial work or, untouched, marks it skipped.
  // Back and Home never do either.
  const activity = lessonActivities(lesson).find((a) => a.step === stepNumber)
  const leaveViaNext = () => {
    const { completeStep, recordActivityCheck, skipActivity } = useLessonSession.getState()
    if (!activity) return completeStep(stepNumber)
    const { partial } = useUncheckedWork.getState()
    if (partial) recordActivityCheck(activity.id, partial.score, activity.maxScore, partial.answers)
    else skipActivity(activity.id, activity.maxScore)
  }

  // TC-019: Home asks first while the Activity has unchecked answers. Home keeps Session progress.
  const unchecked = useUncheckedWork((state) => state.unchecked)
  const [confirmHome, setConfirmHome] = useState(false)
  const navigate = useNavigate()

  return (
    <Stage scene={scene}>
      {isFirst ? (
        // The cover's visible heading is the Lesson title; the Step title stays the h1.
        <h1 className="sr-only">{title}</h1>
      ) : (
        <div
          className="absolute top-[29px] left-[47px] flex h-[115px] w-[382px] items-center justify-center bg-contain bg-center bg-no-repeat px-[24px]"
          style={{ backgroundImage: `url(${CHROME}/title-sign.webp)` }}
        >
          <h1 className="truncate font-heading text-[38px] leading-[1.4] font-bold text-navy">{title}</h1>
        </div>
      )}

      <p className="absolute top-[52px] left-1/2 -translate-x-1/2 rounded-full border-4 border-card bg-pill px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-navy">
        ขั้น {stepNumber}/{totalSteps}
      </p>

      <button
        type="button"
        aria-label="ปิดเสียง"
        aria-pressed={muted}
        onClick={toggleMute}
        className={`${pressable} top-[32px] left-[1620px] flex size-[122px] items-center justify-center rounded-full border-[6px] border-card bg-pill text-navy`}
      >
        {muted ? (
          <VolumeX aria-hidden="true" className="size-16" strokeWidth={2.5} />
        ) : (
          <Volume2 aria-hidden="true" className="size-16" strokeWidth={2.5} />
        )}
      </button>

      {!isFirst && (
        <Link
          to="/lesson/$lessonId/$step"
          params={stepParams(1)}
          aria-label="กลับไปขั้นแรก"
          className={`${pressable} top-[23px] left-[1765px] h-[140px] w-[135px]`}
          onClick={(event) => {
            if (!unchecked) return
            event.preventDefault()
            setConfirmHome(true)
          }}
        >
          <img src={`${CHROME}/home-button.webp`} alt="" draggable={false} className={chromeImage} />
        </Link>
      )}

      {/* shortcut: old Step content keeps its rem sizes and scrolls inside the stage; each Step's reskin ticket lays it out in stage pixels. */}
      <main
        className={
          fullStage
            ? 'pointer-events-none absolute inset-0 flex flex-col'
            : 'absolute inset-x-[200px] top-[180px] bottom-[24px] flex flex-col overflow-x-clip overflow-y-auto'
        }
      >
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

      <nav aria-label="เปลี่ยนขั้น">
        {!isFirst && (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(stepNumber - 1)}
            aria-label="ย้อนกลับ"
            className={`${pressable} top-[904px] left-[29px] h-[163px] w-[158px]`}
          >
            <img src={`${CHROME}/back-button.webp`} alt="" draggable={false} className={chromeImage} />
          </Link>
        )}
        <Link
          to="/lesson/$lessonId/$step"
          params={stepParams(isLast ? 1 : stepNumber + 1)}
          aria-label={isLast ? 'กลับหน้าแรก' : 'ถัดไป'}
          onClick={isLast ? undefined : leaveViaNext}
          className={`${pressable} top-[915px] left-[1738px] h-[152px] w-[148px]`}
        >
          <img src={`${CHROME}/next-button.webp`} alt="" draggable={false} className={chromeImage} />
        </Link>
      </nav>

      <ConfirmDialog
        open={confirmHome}
        message="ยังไม่ได้ตรวจคำตอบ จะออกจากขั้นนี้ไหม?"
        confirmLabel="ออกจากขั้นนี้"
        cancelLabel="ทำต่อ"
        onCancel={() => setConfirmHome(false)}
        onConfirm={() => {
          setConfirmHome(false)
          void navigate({ to: '/lesson/$lessonId/$step', params: stepParams(1) })
        }}
      />

      <FeedbackToast feedback={feedback} className="absolute inset-x-0 bottom-[48px] z-30 flex justify-center" />
    </Stage>
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
