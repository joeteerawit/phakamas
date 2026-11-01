import { Link } from '@tanstack/react-router'
import { Check, ChevronRight, Circle, ClipboardCheck, Eye, RotateCcw, Square, Star, Volume2, X, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useState, type ComponentType } from 'react'
import { playClip, stopAudio, useAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { AudioClip, SpottingWord, VocabularyWord } from '../lessons'
import { scoreFeedback, useClearFeedbackOnLeave } from '../activities/feedback'
import { checkWordSelection } from '../activities/wordSelection'
import { activitySteps, lessonActivity, useReportUncheckedWork } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { Card, cardClass, toneAt, type CardTone } from './clay/Card'
import { Mascot } from './Mascot'
import { WordFillingStep } from './WordFillingStep'
import { RhymeMatchingStep } from './RhymeMatchingStep'
import { RhymeStep } from './RhymeStep'
import { SummaryStep } from './SummaryStep'
import { SentenceStep } from './SentenceStep'
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

/** Step 2: picture cards; tapping a card highlights it and plays its word. */
function VocabularyStep({ lesson }: StepProps) {
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set())

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-xl)">
      <ul className="grid w-full max-w-3xl grid-cols-2 gap-(--space-md) md:grid-cols-3">
        {lesson.vocabulary.map((item, i) => (
          <li key={item.audio.id}>
            <VocabularyCard
              item={item}
              tone={toneAt(i)}
              visited={visited.has(item.audio.id)}
              onPlay={() => {
                setVisited((old) => new Set(old).add(item.audio.id))
                playClip(item.audio)
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

type VocabularyCardProps = {
  item: VocabularyWord
  tone: CardTone
  visited: boolean
  onPlay: () => void
}

function VocabularyCard({ item, tone, visited, onPlay }: VocabularyCardProps) {
  const status = useClipStatus(item.audio.id)
  const active = status === 'loading' || status === 'playing'
  const { icon: Icon, text } = cardLabels[status === 'idle' && visited ? 'visited' : status]

  return (
    <button
      type="button"
      onClick={onPlay}
      className={cx(
        cardClass({ tone, selected: active, playing: status === 'playing' }),
        'flex w-full cursor-pointer select-none flex-col items-center gap-(--space-xs) p-(--space-sm) sm:p-(--space-md)',
        'transition-[transform,box-shadow] duration-150 ease-out active:translate-y-1 active:shadow-clay-pressed motion-reduce:transition-none',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <img
        src={item.image}
        alt=""
        width={256}
        height={256}
        draggable={false}
        className="pointer-events-none size-20 object-contain sm:size-28"
      />
      <span className="font-heading text-vocab font-bold lg:text-vocab-lg">{item.word}</span>
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

const wordStatusText: Partial<Record<AudioStatus, string>> = {
  loading: 'กำลังโหลด',
  playing: 'กำลังเล่น',
  error: 'เล่นเสียงไม่ได้ ลองอีกครั้ง',
}

/**
 * Step 3: one big word at a time, played only on demand. When its sound
 * ends the Mascot says ถึงตาหนูอ่านแล้ว; hearing every word earns a star.
 */
function ListenRepeatStep({ lesson }: StepProps) {
  const words = lesson.listenAndRepeat
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [heard, setHeard] = useState<ReadonlySet<string>>(() => new Set())
  const [endedId, setEndedId] = useState<string | null>(null)
  const current = words[index] ?? words[0]!
  const status = useClipStatus(current.audio.id)
  const complete = words.every((item) => heard.has(item.audio.id))

  // A clip ended on its own (playing → idle, same clip); stopAudio clears clipId instead.
  useEffect(
    () =>
      useAudio.subscribe((next, prev) => {
        if (prev.status !== 'playing' || next.status !== 'idle' || !next.clipId || next.clipId !== prev.clipId) return
        const id = next.clipId
        setHeard((old) => new Set(old).add(id))
        setEndedId(id)
      }),
    [],
  )

  const goTo = (i: number) => {
    stopAudio()
    setEndedId(null)
    setIndex(i)
  }
  const yourTurn = endedId === current.audio.id && status === 'idle'
  const statusText = wordStatusText[status]

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-md)">

      <nav aria-label="ลำดับคำ" className="flex w-full max-w-xl flex-col items-center gap-(--space-xs)">
        <p className="font-semibold text-muted-foreground">
          คำที่ {index + 1}/{words.length}
        </p>
        <ol className="flex flex-wrap justify-center gap-(--space-sm)">
          {words.map((item, i) => (
            <li key={item.audio.id}>
              <button
                type="button"
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
                className={cx(
                  buttonClass(i === index ? 'primary' : 'ghost'),
                  'min-h-12 px-(--space-sm) sm:px-(--space-md)',
                )}
              >
                {item.word}
                {heard.has(item.audio.id) && (
                  <>
                    <Check aria-hidden="true" className="size-5" strokeWidth={3} />
                    <span className="sr-only"> (ฟังแล้ว)</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.audio.id}
          data-testid="listen-word"
          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -40, transition: { duration: 0.15 } }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cx(
            cardClass({ tone: toneAt(index), selected: status !== 'idle' && status !== 'error', playing: status === 'playing' }),
            'flex w-full max-w-md flex-col items-center gap-(--space-xs)',
          )}
        >
          <img
            src={current.image}
            alt=""
            width={256}
            height={256}
            draggable={false}
            className="size-36 object-contain sm:size-48"
          />
          <h2 className="font-heading text-vocab-lg font-bold">{current.word}</h2>
          <p className="min-h-8 font-semibold">{statusText}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex w-full flex-col items-stretch gap-(--space-sm) sm:w-auto sm:flex-row sm:justify-center">
        <Button variant="secondary" size="lg" onClick={() => playClip(current.audio)}>
          <Volume2
            aria-hidden="true"
            className={cx('size-7', status !== 'idle' && status !== 'error' && 'motion-safe:animate-pulse')}
            strokeWidth={2.5}
          />
          {heard.has(current.audio.id) ? 'ฟังอีกครั้ง' : 'ฟังเสียง'}
        </Button>
        <Button variant="ghost" size="lg" disabled={index === words.length - 1} onClick={() => goTo(index + 1)}>
          คำถัดไป
          <ChevronRight aria-hidden="true" className="size-7" strokeWidth={2.5} />
        </Button>
      </div>

      <div role="status" aria-live="polite" className="flex w-full max-w-md flex-col items-center gap-(--space-sm)">
        {yourTurn && (
          <p className="flex items-center gap-(--space-sm) rounded-clay border-[3px] border-border bg-card p-(--space-xs) pe-(--space-md) font-heading text-heading font-bold shadow-clay">
            <Mascot size="sm" decorative />
            ถึงตาหนูอ่านแล้ว
          </p>
        )}
        {complete && (
          <Card tone="yellow" className="flex w-full flex-col items-center gap-(--space-sm) text-center">
            <motion.span
              initial={reduceMotion ? false : { scale: 0.4, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.5 }}
            >
              <Star aria-hidden="true" className="size-14 fill-accent text-on-accent" strokeWidth={2} />
            </motion.span>
            <p className="font-heading text-heading font-bold">ฟังครบ {words.length} คำแล้ว เก่งมาก!</p>
            <Button variant="ghost" onClick={() => goTo(0)}>
              <RotateCcw aria-hidden="true" className="size-6" strokeWidth={2.5} />
              ฝึกอีกรอบ
            </Button>
          </Card>
        )}
      </div>
    </section>
  )
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
