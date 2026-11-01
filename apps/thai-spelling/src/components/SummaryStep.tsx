import { Link } from '@tanstack/react-router'
import { ChevronRight, RotateCcw, Star } from 'lucide-react'
import { useState } from 'react'
import { lessonActivities } from '../session/activities'
import { useLessonSession } from '../session/lessonSession'
import { Button } from './clay/Button'
import { buttonClass, cx } from './clay/buttonClass'
import { Card, cardClass, toneAt } from './clay/Card'
import { ConfirmDialog } from './clay/ConfirmDialog'
import { Mascot } from './Mascot'
import type { StepProps } from './stepProps'
import { useRestartLesson } from './useRestartLesson'

/** Step 10: review key words and rhyme pairs, each Activity's bestScore and the total. Reading Assessment is Phase 2. */
export function SummaryStep({ lesson }: StepProps) {
  const results = useLessonSession((state) => state.session?.activities)
  const restart = useRestartLesson(lesson.id)
  const [confirmReset, setConfirmReset] = useState(false)

  const activities = lessonActivities(lesson).map((activity) => {
    const result = results?.[activity.id]
    return { ...activity, title: lesson.steps[activity.step - 1]?.title, score: result?.status === 'completed' ? result.bestScore : null }
  })
  const total = activities.reduce((sum, a) => sum + (a.score ?? 0), 0)
  const max = activities.reduce((sum, a) => sum + a.maxScore, 0)

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-lg)">

      <Card tone="mint" className="flex w-full max-w-3xl flex-col gap-(--space-sm)">
        <h2 id="summary-words" className="font-heading text-heading font-semibold">คำสำคัญ</h2>
        <ul aria-labelledby="summary-words" className="grid grid-cols-2 gap-(--space-sm) sm:grid-cols-3">
          {lesson.vocabulary.map((item, i) => (
            <li
              key={item.word}
              className={cx(cardClass({ tone: toneAt(i) }), 'flex min-w-0 items-center gap-(--space-xs) p-(--space-sm) font-heading text-heading font-bold lg:text-vocab')}
            >
              <img src={item.image} alt="" width={256} height={256} draggable={false} className="size-10 shrink-0 object-contain sm:size-12" />
              {item.word}
            </li>
          ))}
        </ul>
      </Card>

      <Card tone="sky" className="flex w-full max-w-3xl flex-col gap-(--space-sm)">
        <h2 id="summary-pairs" className="font-heading text-heading font-semibold">คู่คล้องจอง</h2>
        <ul aria-labelledby="summary-pairs" className="flex flex-wrap gap-(--space-sm)">
          {lesson.rhymeMatching.pairs.map(({ left, right }) => (
            <li key={left} className="rounded-full border-[3px] border-border bg-card px-(--space-md) py-(--space-xs) font-heading text-heading font-bold shadow-clay">
              {left} – {right}
            </li>
          ))}
        </ul>
      </Card>

      <Card tone="yellow" className="flex w-full max-w-3xl flex-col gap-(--space-sm)">
        <h2 id="summary-scores" className="font-heading text-heading font-semibold">คะแนนกิจกรรม</h2>
        <ul aria-labelledby="summary-scores" className="flex flex-col gap-(--space-sm)">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex flex-wrap items-center justify-between gap-(--space-sm) rounded-clay border-[3px] border-border bg-card p-(--space-sm) ps-(--space-md) shadow-clay"
            >
              <span className="font-semibold">{activity.title}</span>
              {activity.score === null ? (
                <span className="flex flex-wrap items-center gap-(--space-sm)">
                  <span className="text-muted-foreground">ยังไม่ได้ทำ</span>
                  <Link
                    to="/lesson/$lessonId/$step"
                    params={{ lessonId: lesson.id, step: String(activity.step) }}
                    className={buttonClass('ghost')}
                    aria-label={`ไปทำ ${activity.title}`}
                  >
                    ไปทำ
                    <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2.75} />
                  </Link>
                </span>
              ) : (
                <span className="flex items-center gap-(--space-xs) font-heading text-heading font-bold">
                  <Star aria-hidden="true" className="size-7 fill-accent text-on-accent" strokeWidth={2} />
                  {activity.score}/{activity.maxScore}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="flex items-center justify-center gap-(--space-sm) text-center font-heading text-heading font-bold">
          <Mascot size="sm" decorative />
          คะแนนรวม {total}/{max}
        </p>
      </Card>

      <Button variant="ghost" size="lg" onClick={() => setConfirmReset(true)}>
        <RotateCcw aria-hidden="true" className="size-7" strokeWidth={2.5} />
        เรียนอีกครั้ง
      </Button>

      <ConfirmDialog
        open={confirmReset}
        message="ล้างความคืบหน้าและคะแนนทั้งหมด แล้วเริ่มเรียนใหม่ไหม?"
        confirmLabel="ล้างและเริ่มใหม่"
        cancelLabel="ยกเลิก"
        onCancel={() => setConfirmReset(false)}
        onConfirm={restart}
      />
    </section>
  )
}
