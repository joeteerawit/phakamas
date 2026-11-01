import { Link } from '@tanstack/react-router'
import { Check, Eye, RotateCcw, Square, Volume2, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState, type ComponentType } from 'react'
import { playClip, stopAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { AudioClip, SpottingWord } from '../lessons'
import { activitySteps } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { cardClass, toneAt, type CardTone } from './clay/Card'
import { Mascot } from './Mascot'
import { WordFillingStep } from './WordFillingStep'
import { WordSelectionStep } from './WordSelectionStep'
import { RhymeMatchingStep } from './RhymeMatchingStep'
import { RhymeStep } from './RhymeStep'
import { SummaryStep } from './SummaryStep'
import { SentenceStep } from './SentenceStep'
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

const cardLabels: Record<AudioStatus | 'visited', { icon: LucideIcon; text: string }> = {
  idle: { icon: Volume2, text: 'แตะฟังเสียง' },
  visited: { icon: Check, text: 'ฟังแล้ว' },
  loading: { icon: Volume2, text: 'กำลังโหลด' },
  playing: { icon: Volume2, text: 'กำลังเล่น' },
  error: { icon: RotateCcw, text: 'ลองอีกครั้ง' },
}


/** Step 4: tap a card (or แสดงตัวสะกด for all) to highlight each final ง at its data position. */
function SpottingStep({ lesson }: StepProps) {
  const { heading, explanation, sets } = lesson.spotting
  const words = sets.flat()
  const [showAll, setShowAll] = useState(false)
  const [tapped, setTapped] = useState<ReadonlySet<string>>(() => new Set())
  const toggleAll = () => {
    setShowAll((on) => !on)
    setTapped(new Set())
  }

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-xl)">
      <div className="flex flex-col items-center gap-(--space-sm) text-center sm:flex-row sm:text-start">
        <Mascot size="sm" />
        <h2 className="font-heading text-heading font-semibold">{heading}</h2>
      </div>
      <ul className="grid w-full max-w-2xl grid-cols-2 gap-(--space-md)">
        {words.map((item, i) => (
          <li key={item.audio.id}>
            <SpottingCard
              item={item}
              tone={toneAt(i)}
              highlighted={showAll || tapped.has(item.audio.id)}
              onPlay={() => {
                setTapped((old) => new Set(old).add(item.audio.id))
                playClip(item.audio)
              }}
            />
          </li>
        ))}
      </ul>
      <div className="flex w-full flex-col items-stretch gap-(--space-md) sm:w-auto sm:flex-row sm:items-center">
        <ClipButton clip={explanation} label="ฟังคำอธิบาย" />
        <Button variant={showAll ? 'primary' : 'ghost'} size="lg" aria-pressed={showAll} onClick={toggleAll}>
          <Eye aria-hidden="true" className="size-7" strokeWidth={2.5} />
          แสดงตัวสะกด
        </Button>
      </div>
    </section>
  )
}

type SpottingCardProps = {
  item: SpottingWord
  tone: CardTone
  highlighted: boolean
  onPlay: () => void
}

function SpottingCard({ item, tone, highlighted, onPlay }: SpottingCardProps) {
  const status = useClipStatus(item.audio.id)
  const active = status === 'loading' || status === 'playing'
  const { icon: Icon, text } = cardLabels[status]

  return (
    <button
      type="button"
      onClick={onPlay}
      className={cx(
        cardClass({ tone, selected: highlighted, playing: status === 'playing' }),
        'flex w-full cursor-pointer select-none flex-col items-center gap-(--space-xs) p-(--space-sm) sm:p-(--space-md)',
        'transition-[transform,box-shadow] duration-150 ease-out active:translate-y-1 active:shadow-clay-pressed motion-reduce:transition-none',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <span className="whitespace-nowrap font-heading text-vocab font-bold lg:text-vocab-lg">
        {item.syllables.map(({ text: syllable, final }, i) =>
          highlighted ? (
            // Pink fill plus a thick underline, so the mark is not shown by colour alone.
            <span key={i}>
              {syllable.slice(0, final)}
              <mark className="rounded-md bg-highlight px-0.5 text-on-primary underline decoration-4 underline-offset-8 transition-colors duration-200 ease-out starting:bg-transparent starting:text-foreground motion-reduce:transition-none">
                {syllable[final]}
              </mark>
              {syllable.slice(final + 1)}
            </span>
          ) : (
            <span key={i}>{syllable}</span>
          ),
        )}
      </span>
      <span className="flex items-center gap-(--space-xs) font-semibold">
        <Icon
          aria-hidden="true"
          className={cx('size-6 shrink-0', active && 'motion-safe:animate-pulse')}
          strokeWidth={2.5}
        />
        {text}
      </span>
    </button>
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
