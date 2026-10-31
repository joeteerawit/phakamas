import { Link, useNavigate } from '@tanstack/react-router'
import { RotateCcw, Volume2 } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState } from 'react'
import type { Lesson } from '../lessons'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass } from './clay/buttonClass'
import { Card, toneAt } from './clay/Card'
import { WoodenSign } from './clay/WoodenSign'
import { Mascot } from './Mascot'

type StepContentProps = {
  lesson: Lesson
  stepNumber: number
}

/** Content area for one Step. Real Step content lands in later tickets. */
export function StepContent({ lesson, stepNumber }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  if (!step) return null

  if (stepNumber === 1) return <CoverStep lesson={lesson} title={step.title} />

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
          {/* Audio comes later; for now น้องลิง waves so the tap still answers. */}
          <Button variant="secondary" size="lg" onClick={wave}>
            <Volume2 aria-hidden="true" className="size-7" strokeWidth={2.5} />
            ฟังคำแนะนำ
          </Button>
        </div>
      </div>
    </section>
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
