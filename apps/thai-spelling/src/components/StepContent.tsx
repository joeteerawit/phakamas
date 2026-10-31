import { Link, useNavigate } from '@tanstack/react-router'
import { Check, ChevronRight, Eye, RotateCcw, Square, Star, Volume2, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip, stopAudio, useAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import type { AudioClip, Lesson, SpottingWord, VocabularyWord } from '../lessons'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { Card, cardClass, toneAt, type CardTone } from './clay/Card'
import type { Feedback } from './clay/FeedbackToast'
import { WoodenSign } from './clay/WoodenSign'
import { Mascot } from './Mascot'
import { WordFillingStep } from './WordFillingStep'
import { RhymeMatchingStep } from './RhymeMatchingStep'
import { RhymeStep } from './RhymeStep'

type StepContentProps = {
  lesson: Lesson
  stepNumber: number
  /** Activity Steps report feedback here for the layout's toast. */
  onFeedback: (feedback: Feedback | null) => void
}

/** Content area for one Step. Real Step content lands in later tickets. */
export function StepContent({ lesson, stepNumber, onFeedback }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  if (!step) return null

  if (stepNumber === 1) return <CoverStep lesson={lesson} title={step.title} />
  if (stepNumber === 2) return <VocabularyStep lesson={lesson} title={step.title} />
  if (stepNumber === 3) return <ListenRepeatStep words={lesson.listenAndRepeat} title={step.title} />
  if (stepNumber === 4) return <SpottingStep lesson={lesson} title={step.title} />
  if (stepNumber === 6) return <WordFillingStep lesson={lesson} title={step.title} onFeedback={onFeedback} />
  if (stepNumber === 8) return <RhymeMatchingStep lesson={lesson} title={step.title} onFeedback={onFeedback} />
  if (stepNumber === 7) return <RhymeStep lesson={lesson} title={step.title} />

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

const wordStatusText: Partial<Record<AudioStatus, string>> = {
  loading: 'กำลังโหลด',
  playing: 'กำลังเล่น',
  error: 'เล่นเสียงไม่ได้ ลองอีกครั้ง',
}

/**
 * Step 3: one big word at a time, played only on demand. When its sound
 * ends the Mascot says ถึงตาหนูอ่านแล้ว; hearing every word earns a star.
 */
function ListenRepeatStep({ words, title }: { words: readonly VocabularyWord[]; title: string }) {
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
      <WoodenSign>{title}</WoodenSign>

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
function SpottingStep({ lesson, title }: { lesson: Lesson; title: string }) {
  const { heading, explanation, words } = lesson.spotting
  const [showAll, setShowAll] = useState(false)
  const [tapped, setTapped] = useState<ReadonlySet<string>>(() => new Set())
  const toggleAll = () => {
    setShowAll((on) => !on)
    setTapped(new Set())
  }

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-xl)">
      <WoodenSign>{title}</WoodenSign>
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
