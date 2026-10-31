import { Link, useNavigate } from '@tanstack/react-router'
import { Check, Circle, ClipboardCheck, RotateCcw, Square, Volume2, X, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState } from 'react'
import { playClip, stopAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import { checkWordSelection } from '../activities/wordSelection'
import type { AudioClip, Lesson, LessonStep, VocabularyWord } from '../lessons'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { Card, cardClass, toneAt, type CardTone } from './clay/Card'
import type { Feedback } from './clay/FeedbackToast'
import { WoodenSign } from './clay/WoodenSign'
import { Mascot } from './Mascot'

type StepContentProps = {
  lesson: Lesson
  stepNumber: number
  /** Shows Activity feedback in the layout's toast; null hides it. */
  onFeedback: (feedback: Feedback | null) => void
}

/** Content area for one Step. Real Step content lands in later tickets. */
export function StepContent({ lesson, stepNumber, onFeedback }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  if (!step) return null

  if (stepNumber === 1) return <CoverStep lesson={lesson} title={step.title} />
  if (stepNumber === 2) return <VocabularyStep lesson={lesson} title={step.title} />
  if (stepNumber === 5 && step.activity)
    return <WordSelectionStep lesson={lesson} title={step.title} activity={step.activity} onFeedback={onFeedback} />

  return (
    <div className="flex flex-1 flex-col items-center gap-(--space-xl) text-center">
      <WoodenSign>{step.title}</WoodenSign>
      <Card tone={toneAt(stepNumber)} className="flex w-full max-w-md flex-col items-center gap-(--space-sm)">
        <Mascot size="sm" />
        <p className="font-heading text-heading font-semibold">กำลังพัฒนา</p>
      </Card>
    </div>
  )
}

function CoverStep({ lesson, title }: { lesson: Lesson; title: string }) {
  // Bumped on each tap; the Mascot waves once per bump.
  const [waveCount, setWaveCount] = useState(0)
  const wave = () => setWaveCount((count) => count + 1)
  const navigate = useNavigate()
  const resetSession = useLessonSession((state) => state.resetSession)
  const resumeStep = useLessonSession(({ session }) =>
    session?.lessonId === lesson.id && session.currentStep > 1 ? session.currentStep : null,
  )
  const restart = () => {
    resetSession()
    void navigate({ to: '/lesson/$lessonId/$step', params: { lessonId: lesson.id, step: '2' } })
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-(--space-md) text-center lg:flex-row lg:gap-(--space-xl) lg:text-start">
      {/* The Step title stays the h1 (spec §1.3); the Lesson title is the visible cover heading. */}
      <h1 className="sr-only">{title}</h1>

      <WavingMascot waveCount={waveCount} onTap={wave} />

      <div className="flex flex-col items-center gap-(--space-sm) lg:items-start">
        <h2 className="font-heading text-vocab font-bold text-primary lg:text-heading-lg">{lesson.title}</h2>
        <p className="rounded-full border-[3px] border-border bg-tint-pink px-(--space-md) font-heading text-heading font-semibold text-foreground shadow-clay">
          {lesson.subtitle}
        </p>
        <p className="text-muted-foreground">วิชาภาษาไทย ชั้นประถมศึกษาปีที่ 2</p>

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
          <IntroButton intro={lesson.intro} />
        </div>
      </div>
    </section>
  )
}

const introLabels: Record<AudioStatus, { icon: LucideIcon; text: string }> = {
  idle: { icon: Volume2, text: 'ฟังคำแนะนำ' },
  loading: { icon: Square, text: 'กำลังโหลดเสียง' },
  playing: { icon: Square, text: 'หยุดเสียง' },
  error: { icon: RotateCcw, text: 'ลองฟังอีกครั้ง' },
}

/** Plays the teacher intro; pressing again while it loads or plays stops it. */
function IntroButton({ intro }: { intro: AudioClip }) {
  const status = useClipStatus(intro.id)
  const { icon: Icon, text } = introLabels[status]
  const busy = status === 'loading' || status === 'playing'

  return (
    <Button variant="secondary" size="lg" onClick={() => (busy ? stopAudio() : playClip(intro))}>
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
function VocabularyStep({ lesson, title }: { lesson: Lesson; title: string }) {
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set())

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-xl)">
      <WoodenSign>{title}</WoodenSign>
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

type WordSelectionStepProps = {
  lesson: Lesson
  title: string
  activity: NonNullable<LessonStep['activity']>
  onFeedback: StepContentProps['onFeedback']
}

/** Step 5: select the words of this มาตรา, ตรวจคำตอบ scores every choice, เริ่มใหม่ clears. */
function WordSelectionStep({ lesson, title, activity, onFeedback }: WordSelectionStepProps) {
  const { question, choices, praise } = lesson.wordSelection
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  // Words flagged by the last check; editing a word clears its flag.
  const [wrong, setWrong] = useState<ReadonlySet<string>>(() => new Set())
  const recordActivityCheck = useLessonSession((state) => state.recordActivityCheck)

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
    onFeedback(null)
  }

  const check = () => {
    const result = checkWordSelection(choices, selected)
    setWrong(new Set(result.wrong))
    recordActivityCheck(activity.id, result.score, activity.maxScore, [...selected])
    const scoreText = `ได้ ${result.score}/${activity.maxScore} คะแนน`
    if (result.score === activity.maxScore) {
      onFeedback({ kind: 'correct', message: `เก่งมาก! ${scoreText}` })
      playClip(praise)
    } else {
      onFeedback({ kind: 'wrong', message: `${scoreText} ลองใหม่นะ` })
    }
  }

  const restart = () => {
    setSelected(new Set())
    setWrong(new Set())
    onFeedback(null)
  }

  return (
    // max-lg:pb-40 lets the buttons scroll above the fixed feedback toast on phones.
    <section className="flex flex-1 flex-col items-center gap-(--space-lg) max-lg:pb-40">
      <WoodenSign>{title}</WoodenSign>
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
