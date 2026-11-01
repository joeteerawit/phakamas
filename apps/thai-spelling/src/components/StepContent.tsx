import { Check, Eye, RotateCcw, Square, Volume2, type LucideIcon } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { playClip, stopAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { AudioClip, SpottingWord } from '../lessons'
import { activitySteps } from '../session/activities'
import { Button } from './clay/Button'
import { cx } from './clay/buttonClass'
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
import { CoverStep } from './CoverStep'

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

