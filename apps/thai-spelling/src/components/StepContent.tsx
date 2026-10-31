import { Link } from '@tanstack/react-router'
import type { Lesson } from '../lessons'
import { buttonClass } from './button'

type StepContentProps = {
  lesson: Lesson
  stepNumber: number
}

/** Content area for one Step. Real Step content lands in later tickets. */
export function StepContent({ lesson, stepNumber }: StepContentProps) {
  const step = lesson.steps[stepNumber - 1]
  if (!step) return null

  return (
    <div className="flex flex-1 flex-col items-center gap-6 text-center">
      <h1 className="text-3xl leading-snug font-bold sm:text-4xl lg:text-5xl">{step.title}</h1>

      {stepNumber === 1 && <CoverIntro lesson={lesson} />}

      <p className="rounded-full bg-blossom-soft px-5 py-2 text-xl text-ink-soft ring-2 ring-blossom/70">
        กำลังพัฒนา
      </p>
    </div>
  )
}

function CoverIntro({ lesson }: { lesson: Lesson }) {
  return (
    <section aria-label="ข้อมูลบทเรียน" className="flex flex-col items-center gap-4">
      <p className="text-4xl leading-snug font-bold text-leaf-strong sm:text-5xl">{lesson.title}</p>
      <p className="rounded-2xl bg-sky-soft px-5 py-2 text-2xl font-semibold text-sky-strong ring-2 ring-sky sm:text-3xl">
        {lesson.subtitle}
      </p>
      <p className="text-xl text-ink-soft sm:text-2xl">วิชาภาษาไทย ชั้นประถมศึกษาปีที่ 2</p>
      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId: lesson.id, step: '2' }}
        className={`${buttonClass('primary', 'lg')} mt-2`}
      >
        เริ่มเรียน
      </Link>
    </section>
  )
}
