import { Link } from '@tanstack/react-router'
import { Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { stopAudio } from '../audio/audioManager'
import { toggleMusic } from '../audio/music'
import type { Lesson } from '../lessons'
import { lessonActivities, useUncheckedWork, type ActivityId } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { cx, pressable as pressFeedback } from './clay/buttonClass'
import { FeedbackToast, type Feedback } from './clay/FeedbackToast'
import { Stage, useStageBleed, type Scene } from './stage/Stage'
import { Celebration, endCelebration, StarCounter } from './Stars'

/** Shared comic chrome (docs/comic-art.md). */
const COMIC = '/assets/comic'

type StepLayoutProps = {
  lesson: Lesson
  stepNumber: number
  /** Activity feedback shown in the toast; placeholder Steps pass none. */
  feedback?: Feedback | null
  /** Stage background, from the route's per-Step scene map. */
  scene?: Scene
  children: ReactNode
}

const chromeImage = 'pointer-events-none size-full select-none object-contain'
// Home, Back and Next share one size; each keeps its window-corner offset. Round, so the focus ring follows the art.
const cornerButton = 'h-[150px] w-[146px] rounded-full'
const pressable = cx(pressFeedback, 'absolute block')
/**
 * The feedback toast sits bottom centre; its widest, in stage px, keeps it between each Activity's bottom
 * buttons: Step 5's ตรวจคำตอบ and เริ่มใหม่, Step 6's controls either side of the word bank. Step 8 has only
 * a centred เริ่มใหม่, so its one-line messages may use the room between Back and Next.
 */
const TOAST_WIDTH: Record<ActivityId, number> = { wordSelection: 580, wordFilling: 732, rhymeMatching: 960 }

/**
 * Shared Step layout (spec §1.3, MASTER.md "Canva garden"): every Step sits on the 1920×1080 stage
 * with the title sign, Home, music, Back and Next from the Canva design. Positions are stage pixels
 * copied from design DAHZj0Nxyxs page 2.
 */
export function StepLayout({ lesson, stepNumber, feedback = null, scene = 'garden', children }: StepLayoutProps) {
  const totalSteps = lesson.steps.length
  const isFirst = stepNumber === 1
  const isLast = stepNumber === totalSteps
  const title = lesson.steps[stepNumber - 1]?.title
  const stepParams = (step: number) => ({ lessonId: lesson.id, step: String(step) })

  const { direction, moved } = useStepDirection(stepNumber)
  const reduceMotion = useReducedMotion()
  const musicOn = useLessonSession((state) => state.musicOn)
  // AUD-004: leaving a Step stops its sound; the cover's intro (started by ▶) carries on into Step 2.
  useEffect(() => (isFirst ? undefined : stopAudio), [stepNumber, isFirst])
  useEffect(() => endCelebration, [stepNumber])

  // Spec §4: ถัดไป completes a plain Step; on an Activity it saves partial work or, untouched, marks it skipped.
  // Back never does either; Home clears the Session.
  const activity = lessonActivities(lesson).find((a) => a.step === stepNumber)
  const leaveViaNext = () => {
    const { completeStep, savePartialActivity, skipActivity } = useLessonSession.getState()
    if (!activity) return completeStep(stepNumber)
    const { partial } = useUncheckedWork.getState()
    if (partial) savePartialActivity(activity.id, partial.score, activity.maxScore, partial.answers)
    else skipActivity(activity.id, activity.maxScore)
  }

  const resetSession = useLessonSession((state) => state.resetSession)

  return (
    <Stage scene={scene}>
      <WindowEdges>
        {isFirst ? (
          // The cover's visible heading is the Lesson title; the Step title stays the h1.
          <h1 className="sr-only">{title}</h1>
        ) : (
          <div
            className="absolute top-[29px] left-[47px] flex h-[115px] w-[382px] items-center justify-center bg-contain bg-center bg-no-repeat px-[24px]"
            style={{ backgroundImage: `url(${COMIC}/ui-plank.webp)` }}
          >
            <h1 className="truncate font-heading text-[38px] leading-[1.4] font-bold text-navy">{title}</h1>
          </div>
        )}

        {(activity || isLast) && <StarCounter lesson={lesson} />}

        {/* Design page 1 has no Step badge; the cover keeps it for screen readers. */}
        <p className={isFirst ? 'sr-only' : 'absolute top-[52px] left-1/2 -translate-x-1/2 rounded-full border-[5px] border-comic-ink bg-pill px-[32px] font-heading text-[40px] leading-[1.6] font-bold whitespace-nowrap text-navy shadow-comic'}>
          ขั้น {stepNumber}/{totalSteps}
        </p>

        {/* The cover has its own music speaker. */}
        {!isFirst && (
          <button
            type="button"
            aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
            aria-pressed={musicOn}
            onClick={toggleMusic}
            className={`${pressable} z-10 top-[32px] right-[178px] flex size-[122px] items-center justify-center rounded-full border-[6px] border-comic-ink bg-pill text-navy shadow-comic`}
          >
            {musicOn ? (
              <Volume2 aria-hidden="true" className="size-16" strokeWidth={2.5} />
            ) : (
              <VolumeX aria-hidden="true" className="size-16" strokeWidth={2.5} />
            )}
          </button>
        )}

        {!isFirst && (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(1)}
            aria-label="กลับไปขั้นแรก"
            className={`${pressable} top-[23px] right-[20px] ${cornerButton}`}
            onClick={resetSession}
          >
            <img src={`${COMIC}/ui-home.webp`} alt="" draggable={false} className={chromeImage} />
          </Link>
        )}
      </WindowEdges>

      {/* Every Step marks its root data-full-stage and is laid out over the whole stage in design pixels (Step 6 portals onto the stage). */}
      <main className={`absolute inset-x-[200px] top-[180px] bottom-[24px] flex flex-col overflow-x-clip overflow-y-auto has-[[data-full-stage]]:pointer-events-none has-[[data-full-stage]]:inset-0 ${isFirst ? 'has-[[data-full-stage]]:overflow-visible' : 'has-[[data-full-stage]]:overflow-hidden'}`}>
        {/* #18: the old Step slides out and the next slides in, in the travel direction; a fade with reduced motion. */}
        {/* No AnimatePresence initial={false}: it would also freeze every looping animation inside the first Step. */}
        <AnimatePresence mode="wait" custom={{ direction, reduceMotion }}>
          <StepSlide key={stepNumber} travel={{ direction, reduceMotion }} enter={moved}>
            {children}
          </StepSlide>
        </AnimatePresence>
      </main>

      <WindowEdges as="nav" label="เปลี่ยนขั้น">
        {!isFirst && (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(stepNumber - 1)}
            aria-label="ย้อนกลับ"
            className={`${pressable} bottom-[13px] left-[29px] ${cornerButton}`}
          >
            {/* The ▶ button mirrored. */}
            <img src={`${COMIC}/play-button.webp`} alt="" draggable={false} className={`${chromeImage} -scale-x-100`} />
          </Link>
        )}
        {/* The cover's own ▶ replaces Next. */}
        {!isFirst && (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(isLast ? 1 : stepNumber + 1)}
            aria-label={isLast ? 'กลับหน้าแรก' : 'ถัดไป'}
            onClick={isLast ? undefined : leaveViaNext}
            className={`${pressable} right-[34px] bottom-[13px] ${cornerButton}`}
          >
            <img src={`${COMIC}/play-button.webp`} alt="" draggable={false} className={chromeImage} />
          </Link>
        )}
      </WindowEdges>

      <Celebration lesson={lesson} />
      <FeedbackToast
        feedback={feedback}
        maxWidth={activity ? TOAST_WIDTH[activity.id] : TOAST_WIDTH.wordFilling}
        className="absolute inset-x-0 bottom-[40px] z-30 flex justify-center"
      />
    </Stage>
  )
}

/** Stretches to the window's edges, so what it holds stays in the window's corners on any device. */
function WindowEdges({ as: Tag = 'div', label, children }: { as?: 'div' | 'nav'; label?: string; children: ReactNode }) {
  const { inset } = useStageBleed()
  return (
    <Tag aria-label={label} className="pointer-events-none absolute" style={{ inset }}>
      {children}
    </Tag>
  )
}

type Travel = { direction: number; reduceMotion: boolean | null }
const SLIDE_PX = 240
const slide = {
  enter: ({ direction, reduceMotion }: Travel) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * SLIDE_PX }),
  center: { opacity: 1, x: 0 },
  exit: ({ direction, reduceMotion }: Travel) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * SLIDE_PX }),
}

/** One Step's content; inert while it slides out so nothing in it can be pressed twice. */
function StepSlide({ travel, enter, children }: { travel: Travel; enter: boolean; children: ReactNode }) {
  const isPresent = useIsPresent()
  return (
    <motion.div
      data-testid="step-content"
      inert={!isPresent}
      className="flex flex-1 flex-col"
      variants={slide}
      custom={travel}
      initial={enter ? 'enter' : false}
      animate="center"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** +1 when moving to a later Step, -1 when going back (drives the slide direction); `moved` once any Step change happened. */
function useStepDirection(stepNumber: number) {
  const [previousStep, setPreviousStep] = useState(stepNumber)
  const [direction, setDirection] = useState(1)
  const [moved, setMoved] = useState(false)
  if (stepNumber !== previousStep) {
    setDirection(stepNumber > previousStep ? 1 : -1)
    setPreviousStep(stepNumber)
    setMoved(true)
  }
  return { direction, moved }
}
