import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { stopAudio } from '../audio/audioManager'
import { toggleMusic } from '../audio/music'
import type { Lesson } from '../lessons'
import { lessonActivities, useUncheckedWork, type ActivityId } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { cx, pressable as pressFeedback } from './clay/buttonClass'
import { FeedbackToast, type Feedback } from './clay/FeedbackToast'
import { useKit, type UiKit } from './kit'
import { Stage, useStageBleed, type Scene } from './stage/Stage'
import { Celebration, endCelebration, StarCounter } from './Stars'

type StepLayoutProps = {
  lesson: Lesson
  stepNumber: number
  /** Activity feedback shown in the toast; placeholder Steps pass none. */
  feedback?: Feedback | null
  /** Stage background, from the Lesson's Theme. */
  scene?: Scene
  /** The Lesson has a Map: Home goes back to it and keeps the Session. */
  map?: boolean
  children: ReactNode
}

// Home, Back and Next share one size; each keeps its window-corner offset. The Kit gives each its shape and art.
const cornerButton = 'h-[150px] w-[146px]'
const pressable = cx(pressFeedback, 'absolute block')
/**
 * Where each Activity's feedback toast sits, clear of every card, chip and control. Step 5: bottom centre,
 * between ตรวจคำตอบ and เริ่มใหม่ and under the cards. Steps 6 and 8 fill their bottom row (word bank, เริ่มใหม่),
 * so their toast sits on one line at the top (146–256), under the Step badge and above the cards (Step 6
 * from 290) and buzzers (Step 8 from 264 at the top of a bounce), and left of the music button (1620).
 * Step 6's instruction pill steps aside while it shows.
 */
const TOAST: Record<ActivityId, { placement: 'top' | 'bottom'; maxWidth: number }> = {
  wordSelection: { placement: 'bottom', maxWidth: 580 },
  wordFilling: { placement: 'top', maxWidth: 1280 },
  rhymeMatching: { placement: 'top', maxWidth: 1280 },
}
const toastClass = { top: 'top-[146px]', bottom: 'bottom-[40px]' }

/**
 * Shared Step layout (spec §1.3, MASTER.md "Canva garden"): every Step sits on the 1920×1080 stage
 * with the title sign, Home, music, Back and Next from the Canva design. Positions are stage pixels
 * copied from design DAHZj0Nxyxs page 2; how each looks comes from the Theme's UI Kit.
 */
export function StepLayout({ lesson, stepNumber, feedback = null, scene = 'garden', map = false, children }: StepLayoutProps) {
  const totalSteps = lesson.steps.length
  const isFirst = stepNumber === 1
  const isLast = stepNumber === totalSteps
  const title = lesson.steps[stepNumber - 1]?.title
  const stepParams = (step: number) => ({ lessonId: lesson.id, step: String(step) })

  const kit = useKit()
  const reduceMotion = useReducedMotion()
  const { direction, moved, panel, panelChange, stageScene } = useStepChange(stepNumber, scene, !!reduceMotion, kit.stepChange)
  // Step 5's full marks shake the Step (#35).
  const mainRef = useRef<HTMLElement>(null)
  const musicOn = useLessonSession((state) => state.musicOn)
  // AUD-004: leaving a Step stops its sound; the cover's intro (started by ▶) carries on into Step 2.
  useEffect(() => (isFirst ? undefined : stopAudio), [stepNumber, isFirst])
  useEffect(() => endCelebration, [stepNumber])

  // Spec §4: ถัดไป completes a plain Step; on an Activity it saves partial work or, untouched, marks it skipped.
  // Back never does either; Home clears the Session, or goes back to the Lesson's Map and keeps it.
  const activity = lessonActivities(lesson).find((a) => a.step === stepNumber)
  const leaveViaNext = () => {
    const { completeStep, savePartialActivity, skipActivity } = useLessonSession.getState()
    if (!activity) return completeStep(stepNumber)
    const { partial } = useUncheckedWork.getState()
    if (partial) savePartialActivity(activity.id, partial.score, activity.maxScore, partial.answers)
    else skipActivity(activity.id, activity.maxScore)
  }

  const resetSession = useLessonSession((state) => state.resetSession)
  const toast = activity ? TOAST[activity.id] : TOAST.wordSelection

  return (
    <Stage scene={stageScene}>
      <WindowEdges>
        {isFirst ? (
          // The cover's visible heading is the Lesson title; the Step title stays the h1.
          <h1 className="sr-only">{title}</h1>
        ) : (
          <kit.TitleSign>
            <h1 className="truncate">{title}</h1>
          </kit.TitleSign>
        )}

        {(activity || isLast) && <StarCounter lesson={lesson} />}

        {/* Design page 1 has no Step badge; the cover keeps it for screen readers. */}
        <p className={isFirst ? 'sr-only' : cx('absolute top-[52px] left-1/2 -translate-x-1/2', kit.stepBadge)}>
          ขั้น {stepNumber}/{totalSteps}
        </p>

        {/* The cover has its own music speaker. */}
        {!isFirst && (
          <button
            type="button"
            aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
            aria-pressed={musicOn}
            onClick={toggleMusic}
            className={cx(pressable, 'z-10 top-[32px] right-[178px] size-[122px]', kit.music.className)}
          >
            <kit.music.Art on={musicOn} />
          </button>
        )}

        {!isFirst &&
          (map ? (
            <Link
              to="/lesson/$lessonId/map"
              params={{ lessonId: lesson.id }}
              aria-label="กลับไปแผนที่"
              className={cx(pressable, 'top-[23px] right-[20px]', cornerButton, kit.home.className)}
            >
              <kit.home.Art />
            </Link>
          ) : (
            <Link
              to="/lesson/$lessonId/$step"
              params={stepParams(1)}
              aria-label="กลับไปขั้นแรก"
              className={cx(pressable, 'top-[23px] right-[20px]', cornerButton, kit.home.className)}
              onClick={resetSession}
            >
              <kit.home.Art />
            </Link>
          ))}
      </WindowEdges>

      {/* Every Step marks its root data-full-stage and is laid out over the whole stage in design pixels (Step 6 portals onto the stage). */}
      <main ref={mainRef} className={`absolute inset-x-[200px] top-[180px] bottom-[24px] flex flex-col overflow-x-clip overflow-y-auto has-[[data-full-stage]]:pointer-events-none has-[[data-full-stage]]:inset-0 ${isFirst ? 'has-[[data-full-stage]]:overflow-visible' : 'has-[[data-full-stage]]:overflow-hidden'}`}>
        {/* #18: the old Step slides out and the next slides in, in the travel direction; a fade with reduced motion. */}
        {/* When the Kit's Step change covers the window (แม่กง #36: into or out of Step 1 or 5), the Steps swap under it. */}
        {/* No AnimatePresence initial={false}: it would also freeze every looping animation inside the first Step. */}
        <AnimatePresence mode="wait" custom={{ direction, reduceMotion, panel: panelChange, coverMs: kit.stepChange.coverMs }}>
          <StepSlide key={stepNumber} travel={{ direction, reduceMotion, panel: panelChange, coverMs: kit.stepChange.coverMs }} enter={moved}>
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
            className={cx(pressable, 'bottom-[13px] left-[29px]', cornerButton, kit.back.className)}
          >
            <kit.back.Art />
          </Link>
        )}
        {/* The cover's own ▶ replaces Next. */}
        {!isFirst && (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(isLast ? 1 : stepNumber + 1)}
            aria-label={isLast ? 'กลับหน้าแรก' : 'ถัดไป'}
            onClick={isLast ? undefined : leaveViaNext}
            className={cx(pressable, 'right-[34px] bottom-[13px]', cornerButton, kit.next.className)}
          >
            <kit.next.Art />
          </Link>
        )}
      </WindowEdges>

      <Celebration lesson={lesson} shakeTarget={mainRef} />
      <FeedbackToast
        feedback={feedback}
        placement={toast.placement}
        maxWidth={toast.maxWidth}
        className={`absolute inset-x-0 z-30 ${toastClass[toast.placement]}`}
      />
      {panel && <kit.stepChange.Cover key={panel.key} direction={panel.direction} />}
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

type Travel = { direction: number; reduceMotion: boolean | null; panel: boolean; coverMs: number }
const SLIDE_PX = 240
const SLIDE = { duration: 0.22, ease: 'easeOut' } as const
const slide = {
  enter: ({ direction, reduceMotion, panel }: Travel) =>
    reduceMotion ? { opacity: 0 } : panel ? { opacity: 1, x: 0, scale: 1.04 } : { opacity: 0, x: direction * SLIDE_PX },
  center: ({ panel }: Travel) => ({ opacity: 1, x: 0, scale: 1, transition: panel ? ({ duration: 0.4, ease: 'easeOut' } as const) : SLIDE }),
  // A panel change keeps the old Step in place, settling back, until the panel covers it.
  exit: ({ direction, reduceMotion, panel, coverMs }: Travel) =>
    reduceMotion
      ? { opacity: 0, transition: SLIDE }
      : panel
        ? { opacity: 1, x: 0, scale: 0.97, transition: { duration: coverMs / 1000, ease: 'easeIn' as const } }
        : { opacity: 0, x: -direction * SLIDE_PX, transition: SLIDE },
}

/** One Step's content; inert while it leaves so nothing in it can be pressed twice. */
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
      transition={SLIDE}
    >
      {children}
    </motion.div>
  )
}

type StepChange = {
  step: number
  /** The scene of `step`, as last passed in. */
  scene: Scene
  /** +1 when moving to a later Step, -1 when going back (drives the slide and panel direction). */
  direction: number
  /** Once any Step change happened. */
  moved: boolean
  /** Whether the latest change turns a panel. */
  panelChange: boolean
  /** The panel on screen, until its sweep ends; a new panel change replaces it. */
  panel: { key: number; direction: number } | null
  /** The scene kept on screen until the panel covers the window. */
  held: Scene | null
  count: number
}

/**
 * Tracks Step changes. A change the Kit covers (not under reduced motion) shows its cover, the panel,
 * and keeps the old scene until the panel covers the window, so the new scene never pops in in plain view.
 * Rapid changes restart the panel and keep whichever scene is on screen; both timers always run out.
 */
function useStepChange(stepNumber: number, scene: Scene, reduceMotion: boolean, { covers, coverMs, ms }: UiKit['stepChange']) {
  const [change, setChange] = useState<StepChange>(() => ({
    step: stepNumber,
    scene,
    direction: 1,
    moved: false,
    panelChange: false,
    panel: null,
    held: null,
    count: 0,
  }))
  if (stepNumber !== change.step) {
    const panelChange = !reduceMotion && covers(change.step, stepNumber)
    const direction = stepNumber > change.step ? 1 : -1
    const count = change.count + 1
    setChange({
      step: stepNumber,
      scene,
      direction,
      moved: true,
      panelChange,
      panel: panelChange ? { key: count, direction } : change.panel,
      held: panelChange ? (change.held ?? change.scene) : change.held,
      count,
    })
  }

  const panelKey = change.panel?.key
  useEffect(() => {
    if (panelKey === undefined) return
    const uncover = setTimeout(() => setChange((old) => ({ ...old, held: null })), coverMs)
    const done = setTimeout(() => setChange((old) => (old.panel?.key === panelKey ? { ...old, panel: null } : old)), ms + 40)
    return () => {
      clearTimeout(uncover)
      clearTimeout(done)
    }
  }, [panelKey, coverMs, ms])

  return {
    direction: change.direction,
    moved: change.moved,
    panelChange: change.panelChange,
    panel: change.panel,
    stageScene: change.held ?? scene,
  }
}
