import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Lesson } from '../lessons'
import { buttonClass } from './button'

type StepLayoutProps = {
  lesson: Lesson
  stepNumber: number
  children: ReactNode
}

/** Shared Step layout (spec §1.3): header, progress bar, content area, Back/Next. */
export function StepLayout({ lesson, stepNumber, children }: StepLayoutProps) {
  const totalSteps = lesson.steps.length
  const isFirst = stepNumber === 1
  const isLast = stepNumber === totalSteps
  const stepParams = (step: number) => ({ lessonId: lesson.id, step: String(step) })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-3 py-3 sm:px-6 sm:py-5">
      <header className="flex items-center gap-2 rounded-3xl bg-white/70 p-2 shadow-sm backdrop-blur-sm sm:gap-4 sm:p-3">
        <Link
          to="/lesson/$lessonId/$step"
          params={stepParams(1)}
          aria-label="กลับไปหน้าปก"
          className={buttonClass('home')}
        >
          <HomeIcon />
          <span className="hidden sm:inline">หน้าปก</span>
        </Link>
        <p className="min-w-0 flex-1 text-center text-lg leading-tight font-bold break-words sm:text-2xl">
          {lesson.title}
        </p>
        <p className="shrink-0 rounded-full bg-sun-soft px-3 py-2 text-lg font-semibold whitespace-nowrap ring-2 ring-sun-strong/60 sm:px-4">
          ขั้น {stepNumber}/{totalSteps}
        </p>
      </header>

      <div
        role="progressbar"
        aria-label="ความคืบหน้าบทเรียน"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={stepNumber}
        aria-valuetext={`ขั้น ${stepNumber} จาก ${totalSteps}`}
        className="h-4 w-full overflow-hidden rounded-full bg-white/70 ring-2 ring-white"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-leaf to-leaf-strong transition-[width] duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
        />
      </div>

      <main className="flex flex-1 flex-col rounded-[2rem] bg-white/75 p-5 shadow-sm backdrop-blur-sm sm:p-8">
        <motion.div
          key={stepNumber}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>

      <nav aria-label="เปลี่ยนขั้น" className="flex flex-wrap items-center justify-between gap-3">
        {!isFirst && (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(stepNumber - 1)}
            className={buttonClass('secondary')}
          >
            <span aria-hidden="true">←</span>
            ย้อนกลับ
          </Link>
        )}
        {isLast ? (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(1)}
            className={`${buttonClass('primary')} ms-auto`}
          >
            กลับหน้าแรก
          </Link>
        ) : (
          <Link
            to="/lesson/$lessonId/$step"
            params={stepParams(stepNumber + 1)}
            className={`${buttonClass('primary')} ms-auto`}
          >
            ถัดไป
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5v-5h4v5" />
    </svg>
  )
}
