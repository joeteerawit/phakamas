import { Link } from '@tanstack/react-router'
import { Check, Circle, ClipboardCheck, RotateCcw, Square, Volume2, X, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState, type ComponentType } from 'react'
import { playClip, stopAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { AudioClip } from '../lessons'
import { scoreFeedback, useClearFeedbackOnLeave } from '../activities/feedback'
import { checkWordSelection } from '../activities/wordSelection'
import { activitySteps, lessonActivity, useReportUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { cardClass, toneAt, type CardTone } from './clay/Card'
import { Mascot } from './Mascot'
import { WordFillingStep } from './WordFillingStep'
import { RhymeMatchingStep } from './RhymeMatchingStep'
import { RhymeStep } from './RhymeStep'
import { SummaryStep } from './SummaryStep'
import { SentenceStep } from './SentenceStep'
import { SpottingStep } from './SpottingStep'
import { VocabularyStep } from './VocabularyStep'
import { ListenRepeatStep } from './ListenRepeatStep'
import type { ActivityStepProps, StepProps } from './stepProps'
import { useRestartLesson } from './useRestartLesson'

type StepContentProps = ActivityStepProps & { stepNumber: number }

/** Each Step's component, in Step order; Activity Steps are numbered in session/activities. */
const stepComponents: Record<number, ComponentType<ActivityStepProps>> = {
  1: CoverStep,
  2: VocabularyStep,
  3: ListenRepeatStep,
  4: SpottingStep,
  [activitySteps.wordSelection]: WordSelectionStep,
  [activitySteps.wordFilling]: WordFillingStep,
  7: RhymeStep,
  [activitySteps.rhymeMatching]: RhymeMatchingStep,
  9: SentenceStep,
  10: SummaryStep,
}

/** Content area for one Step. */
export function StepContent({ lesson, stepNumber, onFeedback }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  const Step = stepComponents[stepNumber]
  if (!step || !Step) return null
  return <Step lesson={lesson} onFeedback={onFeedback} />
}

function CoverStep({ lesson }: StepProps) {
  // Bumped on each tap; the Mascot waves once per bump.
  const [waveCount, setWaveCount] = useState(0)
  const wave = () => setWaveCount((count) => count + 1)
  const restart = useRestartLesson(lesson.id)
  const resumeStep = useLessonSession(({ session }) =>
    session?.lessonId === lesson.id && session.currentStep > 1 ? session.currentStep : null,
  )

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-(--space-md) text-center lg:flex-row lg:gap-(--space-xl) lg:text-start">
      <WavingMascot waveCount={waveCount} onTap={wave} />

      <div className="flex flex-col items-center gap-(--space-sm) lg:items-start">
        <h2 className="font-heading text-vocab font-bold text-primary lg:text-heading-lg">{lesson.title}</h2>
        <p className="rounded-full border-[3px] border-border bg-tint-pink px-(--space-md) font-heading text-heading font-semibold text-foreground shadow-clay">
          {lesson.subtitle}
        </p>
        <p className="text-muted-foreground">{lesson.course}</p>

        <div className="mt-(--space-md) flex w-full flex-col items-stretch gap-(--space-md) sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {resumeStep ? (
            <>
              <Link
                to="/lesson/$lessonId/$step"
                params={{ lessonId: lesson.id, step: String(resumeStep) }}
                className={buttonClass('primary', 'lg')}
              >
                เรียนต่อ (ขั้น {resumeStep})
              </Link>
              <Button variant="ghost" size="lg" onClick={restart}>
                <RotateCcw aria-hidden="true" className="size-7" strokeWidth={2.5} />
                เริ่มใหม่
              </Button>
            </>
          ) : (
            <Link to="/lesson/$lessonId/$step" params={{ lessonId: lesson.id, step: '2' }} className={buttonClass('primary', 'lg')}>
              เริ่มเรียน
            </Link>
          )}
          <ClipButton clip={lesson.intro} label="ฟังคำแนะนำ" />
        </div>
      </div>
    </section>
  )
}

const clipLabels: Record<Exclude<AudioStatus, 'idle'>, { icon: LucideIcon; text: string }> = {
  loading: { icon: Square, text: 'กำลังโหลดเสียง' },
  playing: { icon: Square, text: 'หยุดเสียง' },
  error: { icon: RotateCcw, text: 'ลองฟังอีกครั้ง' },
}

/** Plays a narration clip labelled `label`; pressing again while it loads or plays stops it. */
function ClipButton({ clip, label }: { clip: AudioClip; label: string }) {
  const status = useClipStatus(clip.id)
  const { icon: Icon, text } = status === 'idle' ? { icon: Volume2, text: label } : clipLabels[status]
  const busy = status === 'loading' || status === 'playing'

  return (
    <Button variant="secondary" size="lg" onClick={() => (busy ? stopAudio() : playClip(clip))}>
      <Icon aria-hidden="true" className={cx('size-7', status === 'loading' && 'motion-safe:animate-pulse')} strokeWidth={2.5} />
      {text}
    </Button>
  )
}


/** Step 5: select the words of this มาตรา, ตรวจคำตอบ scores every choice, เริ่มใหม่ clears. */
function WordSelectionStep({ lesson, onFeedback }: ActivityStepProps) {
  const { question, choices, praise } = lesson.wordSelection
  const activity = lessonActivity(lesson, 'wordSelection')
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  // Words flagged by the last check; editing a word clears its flag.
  const [wrong, setWrong] = useState<ReadonlySet<string>>(() => new Set())
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)
  // Selections changed since the last check; Home asks before throwing them away.
  const [unchecked, setUnchecked] = useState(false)
  useReportUncheckedWork(activity, unchecked)
  useClearFeedbackOnLeave(onFeedback)

  const toggle = (word: string) => {
    setSelected((old) => {
      const next = new Set(old)
      if (!next.delete(word)) next.add(word)
      return next
    })
    setWrong((old) => {
      const next = new Set(old)
      next.delete(word)
      return next
    })
    setUnchecked(true)
    onFeedback(null)
  }

  const check = () => {
    const result = checkWordSelection(choices, selected)
    setWrong(new Set(result.wrong))
    setUnchecked(false)
    recordActivityCheck(activity.id, result.score, activity.maxScore, [...selected])
    onFeedback(scoreFeedback(result.score, activity.maxScore, 'ลองใหม่นะ'))
    if (result.score === activity.maxScore) playClip(praise)
  }

  const restart = () => {
    setSelected(new Set())
    setWrong(new Set())
    setUnchecked(false)
    onFeedback(null)
  }

  return (
    // max-lg:pb-40 lets the buttons scroll above the fixed feedback toast on phones.
    <section className="flex flex-1 flex-col items-center gap-(--space-lg) max-lg:pb-40">
      <p className="text-center font-heading text-heading font-semibold">{question}</p>
      <ul className="grid w-full max-w-3xl grid-cols-2 gap-(--space-md) sm:grid-cols-3 md:grid-cols-4">
        {choices.map(({ word }, i) => (
          <li key={word}>
            <WordChoiceButton
              word={word}
              tone={toneAt(i)}
              selected={selected.has(word)}
              wrong={wrong.has(word)}
              onToggle={() => toggle(word)}
            />
          </li>
        ))}
      </ul>
      <div className="flex w-full flex-col items-stretch gap-(--space-md) sm:w-auto sm:flex-row">
        <Button onClick={check}>
          <ClipboardCheck aria-hidden="true" className="size-6" strokeWidth={2.5} />
          ตรวจคำตอบ
        </Button>
        <Button variant="ghost" onClick={restart}>
          <RotateCcw aria-hidden="true" className="size-6" strokeWidth={2.5} />
          เริ่มใหม่
        </Button>
      </div>
    </section>
  )
}

type WordChoiceButtonProps = {
  word: string
  tone: CardTone
  selected: boolean
  wrong: boolean
  onToggle: () => void
}

function WordChoiceButton({ word, tone, selected, wrong, onToggle }: WordChoiceButtonProps) {
  const reduceMotion = useReducedMotion()
  // Right/wrong is never colour alone: each state has its own icon and text.
  const { icon: Icon, text } = wrong
    ? { icon: X, text: selected ? 'เลือกผิด' : 'ลืมเลือก' }
    : selected
      ? { icon: Check, text: 'เลือกแล้ว' }
      : { icon: Circle, text: 'แตะเพื่อเลือก' }

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      className={cx(
        cardClass({ tone, selected, wrong }),
        'flex w-full cursor-pointer select-none flex-col items-center gap-(--space-xs) p-(--space-sm) sm:p-(--space-md)',
        'transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <span className="font-heading text-vocab font-bold lg:text-vocab-lg">{word}</span>
      <span className="flex items-center gap-(--space-xs) font-semibold whitespace-nowrap">
        <span
          aria-hidden="true"
          className={cx(
            'flex size-7 shrink-0 items-center justify-center rounded-full',
            wrong ? 'bg-wrong text-on-primary' : selected ? 'bg-highlight text-on-primary' : 'text-foreground',
          )}
        >
          <Icon className="size-5" strokeWidth={3} />
        </span>
        {text}
      </span>
    </motion.button>
  )
}

const mascotVariants: Variants = {
  idle: {
    y: [0, -10, 0],
    rotate: 0,
    transition: {
      y: { duration: 3, ease: 'easeInOut', repeat: Infinity },
      rotate: { duration: 0.2 },
    },
  },
  wave: {
    y: 0,
    rotate: [0, -14, 12, -10, 6, 0],
    transition: { duration: 0.8, ease: 'easeInOut' },
  },
}

/** Large Mascot with a gentle idle float; tapping plays a short wave. Still under reduced motion. */
function WavingMascot({ waveCount, onTap }: { waveCount: number; onTap: () => void }) {
  const reduceMotion = useReducedMotion()
  const [wavedCount, setWavedCount] = useState(0)
  const waving = waveCount > wavedCount

  return (
    <motion.button
      type="button"
      aria-label="ทักทายน้องลิง"
      onClick={onTap}
      className="shrink-0 origin-bottom cursor-pointer rounded-full p-(--space-sm) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      variants={mascotVariants}
      animate={reduceMotion ? undefined : waving ? 'wave' : 'idle'}
      onAnimationComplete={(definition) => {
        if (definition === 'wave') setWavedCount(waveCount)
      }}
    >
      <Mascot size="lg" decorative />
    </motion.button>
  )
}
