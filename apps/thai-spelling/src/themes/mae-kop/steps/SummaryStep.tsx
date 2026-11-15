import { Link } from '@tanstack/react-router'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useLessonSession } from '../../../session/lessonSession'
import { lessonStars, MAX_STARS } from '../../../session/stars'
import { useRestartLesson } from '../../../session/useRestartLesson'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { JumpingMascot } from '../../../ui/Stars'

// The rainbow's bands, outer to inner; one band per Star the Lesson can give.
const BAND_COLOURS = ['#e8322f', '#f57c1f', '#ffcc00', '#9bd34a', '#3fb24f', '#1fa9a0', '#2f8fe0', '#5b5fd6', '#9b59c9']
// Stage pixels: a wide arc over the pond, its feet at 240 and 1680 (y = 900) and its top at 200; the summary stands
// inside it, clear of every band.
const ARC = { cx: 960, cy: 900, rx: 720, ry: 700, band: 26, gap: 4 }

/**
 * แม่กบ Step 10, น้องกบ's hut after the rain (docs/mae-kop-spec.md), over the kop-rainbow Scene. The rainbow has one band
 * for each Star the Lesson can give: each Star earned fills one band with colour, from the outer band in, and the rest
 * stay pale outlines, so the lit bands are exactly the Lesson's Stars. Under it: เก่งมาก! with the total in raindrop
 * Stars, each Activity's Stars on a raincoat pocket (a pocket not done yet is a ไปทำ back to it), and เรียนอีกครั้ง, which asks first, then
 * clears the Session and starts again. น้องกบ cheers by her hut. Under reduced motion the earned bands simply stand filled.
 */
export function SummaryStep({ lesson }: StepProps) {
  const { Button, card } = useKit()
  const still = !!useReducedMotion()
  const results = useLessonSession((state) => state.session?.activities)
  const { activities, total, max } = lessonStars(lesson, results)
  const restart = useRestartLesson(lesson.id)
  const [confirming, setConfirming] = useState(false)

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0 font-heading text-pond-deep">
      <Rainbow bands={max} earned={total} still={still} />

      {/* น้องกบ cheering by her hut on stilts, left of the list. */}
      <svg aria-hidden="true" viewBox="0 0 300 300" className="absolute top-[600px] left-[10px] h-[220px] w-[220px] overflow-visible">
        <path d="M70 230 V300 M230 230 V300" stroke="var(--color-mud)" strokeWidth={14} strokeLinecap="round" />
        <rect x="50" y="120" width="200" height="120" rx="14" fill="var(--color-pond)" stroke="var(--color-rubber-deep)" strokeWidth={6} />
        <path d="M20 130 L150 30 L280 130 Z" fill="var(--color-raincoat)" stroke="var(--color-rubber-deep)" strokeWidth={6} strokeLinejoin="round" />
        <rect x="125" y="160" width="50" height="80" rx="20" fill="var(--color-pond-deep)" stroke="var(--color-rubber-deep)" strokeWidth={5} />
      </svg>
      <JumpingMascot className="top-[690px] left-[130px] h-[200px] w-[160px]" />

      <h2 className="drop-label absolute top-[514px] left-1/2 flex h-[90px] -translate-x-1/2 items-center px-[40px] text-[64px] leading-[1.3] font-bold">เก่งมาก!</h2>
      <p className="absolute top-[612px] left-1/2 flex h-[70px] -translate-x-1/2 items-center gap-[14px] rounded-full border-[5px] border-pond-deep bg-card px-[28px] text-[38px] font-bold whitespace-nowrap">
        ได้ {total}/{max} ดาว
        <StarRow stars={total} slots={max} />
      </p>

      {/* Each Activity on a raincoat pocket, side by side inside the arc; one not done yet is itself the way back to it. */}
      <ul aria-label="ดาวแต่ละกิจกรรม" className="absolute top-[696px] left-[536px] flex w-[848px] gap-[16px]">
        {activities.map((activity) => {
          const title = lesson.steps[activity.step - 1]?.title
          const result = results?.[activity.id]
          const pocket = cx('relative flex h-[200px] w-[272px] flex-col items-center justify-center gap-[6px] px-[20px] pt-[34px] pb-[14px] text-center', card)
          return (
            <li key={activity.id}>
              {result?.status === 'completed' ? (
                <div className={pocket}>
                  <span className="relative text-[28px] leading-[1.3] font-bold whitespace-nowrap">{title}</span>
                  <span className="relative text-[26px] text-rubber">
                    {result.bestScore}/{activity.maxScore}
                  </span>
                  <span className="sr-only">{activity.stars} ดาว</span>
                  <span className="relative">
                    <StarRow stars={activity.stars} slots={MAX_STARS} />
                  </span>
                </div>
              ) : (
                <Link
                  to="/lesson/$lessonId/$step"
                  params={{ lessonId: lesson.id, step: String(activity.step) }}
                  aria-label={`ไปทำ ${title}`}
                  className={cx(pocket, 'pointer-events-auto cursor-pointer focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring')}
                >
                  <span className="relative text-[28px] leading-[1.3] font-bold whitespace-nowrap">{title}</span>
                  <span aria-hidden="true" className="relative text-[26px] text-rubber">
                    ยังไม่ได้ทำ
                  </span>
                  <span aria-hidden="true" className="drop-label relative flex items-center ps-[18px] pe-[8px] text-[28px] font-bold">
                    ไปทำ
                    <ChevronRight className="size-[32px]" strokeWidth={3} />
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      <Button onClick={() => setConfirming(true)} className="absolute top-[946px] left-[770px] flex h-[124px] w-[380px] items-center justify-center gap-[14px] text-[46px] font-bold">
        <RotateCcw aria-hidden="true" className="relative size-[50px] shrink-0" strokeWidth={3} />
        <span className="relative">เรียนอีกครั้ง</span>
      </Button>

      <div className="pointer-events-auto">
        <PondConfirm open={confirming} onCancel={() => setConfirming(false)} onConfirm={restart} />
      </div>
    </section>
  )
}

/** A row of raindrop Star slots, the first `stars` filled; an empty slot is a pale drop. */
function StarRow({ stars, slots }: { stars: number; slots: number }) {
  const { Star } = useKit()
  return (
    <span aria-hidden="true" className="flex gap-[4px] text-[40px] leading-none">
      {Array.from({ length: slots }, (_, i) => (
        <span key={i} data-earned={i < stars || undefined} className={i < stars ? undefined : 'opacity-30 grayscale'}>
          <Star />
        </span>
      ))}
    </span>
  )
}

/** The nine-band rainbow: band `i` (outer first) is coloured once `earned > i`, else a pale outline. */
function Rainbow({ bands, earned, still }: { bands: number; earned: number; still: boolean }) {
  return (
    <svg
      data-testid="rainbow"
      role="img"
      aria-label={`รุ้ง ${earned} จาก ${bands} สี`}
      viewBox="0 0 1920 1080"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      {Array.from({ length: bands }, (_, i) => {
        const inset = i * (ARC.band + ARC.gap) + ARC.band / 2
        const [rx, ry] = [ARC.rx - inset, ARC.ry - inset]
        const d = `M${ARC.cx - rx} ${ARC.cy} A${rx} ${ry} 0 0 1 ${ARC.cx + rx} ${ARC.cy}`
        const lit = i < earned
        return (
          <g key={i} data-testid="rainbow-band" data-earned={lit || undefined}>
            <path d={d} fill="none" stroke="var(--color-card)" strokeOpacity={0.55} strokeWidth={ARC.band} />
            <path d={d} fill="none" stroke="var(--color-rubber)" strokeOpacity={0.5} strokeWidth={3} strokeDasharray="10 8" />
            {lit && (
              <motion.path
                data-testid="band-colour"
                d={d}
                fill="none"
                stroke={BAND_COLOURS[i % BAND_COLOURS.length]}
                strokeWidth={ARC.band}
                initial={still ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: still ? 0 : 0.3 + i * 0.15, ease: 'easeOut' }}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** เรียนอีกครั้ง asks first, on a native modal dialog: focus trapped, Esc cancels, the safe choice focused. */
function PondConfirm({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { Button } = useKit()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby="pond-confirm"
      onClose={onCancel}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-[28px] border-[5px] border-pond-deep bg-raincoat-light p-6 text-center font-heading text-pond-deep backdrop:bg-rubber-deep/50"
    >
      <p id="pond-confirm" className="mb-5 text-[1.4rem] leading-[1.5] font-bold">
        ล้างความคืบหน้าและคะแนนทั้งหมด แล้วเริ่มเรียนใหม่ไหม?
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Safe choice first in focus order: showModal focuses it. */}
        <Button autoFocus onClick={onCancel} className="relative min-h-14 px-6 text-[1.2rem] font-bold">
          <span className="relative">ยกเลิก</span>
        </Button>
        <Button onClick={onConfirm} className="relative min-h-14 px-6 text-[1.2rem] font-bold">
          <span className="relative">ล้างและเริ่มใหม่</span>
        </Button>
      </div>
    </dialog>
  )
}
