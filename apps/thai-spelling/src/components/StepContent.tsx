import { Link, useNavigate } from '@tanstack/react-router'
import { Check, RotateCcw, Square, Volume2, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState } from 'react'
import { playClip, stopAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { AudioClip, Lesson, VocabularyWord } from '../lessons'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { Card, cardClass, toneAt, type CardTone } from './clay/Card'
import { WoodenSign } from './clay/WoodenSign'
import { Mascot } from './Mascot'
import { RhymeMatchingStep } from './RhymeMatchingStep'

type StepContentProps = {
  lesson: Lesson
  stepNumber: number
}

/** Content area for one Step. Real Step content lands in later tickets. */
export function StepContent({ lesson, stepNumber }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  if (!step) return null

  if (stepNumber === 1) return <CoverStep lesson={lesson} title={step.title} />
  if (stepNumber === 2) return <VocabularyStep lesson={lesson} title={step.title} />
  if (stepNumber === 8) return <RhymeMatchingStep lesson={lesson} title={step.title} />

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
