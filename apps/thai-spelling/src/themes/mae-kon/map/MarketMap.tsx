import { Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useState, type CSSProperties, type MouseEvent } from 'react'
import { toggleMusic } from '../../../audio/music'
import { useLessonSession } from '../../../session/lessonSession'
import { FIRST_STOP, useMap, type MapStop } from '../../../steps/map/useMap'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable as pressFeedback } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { Stage, useStageBleed } from '../../../ui/stage/Stage'
import { ink } from '../kit/ink'

type Point = { x: number; y: number }

/**
 * Map pixels (1920×1080, the stage). The canal enters at the bottom left and winds up past eight wooden piers to
 * น้องส้ม's stilt house at the top right. Each stop has its pier sign, a 128 px plank on its landmark, and the spot on
 * the canal where her boat moors, clear of every sign. Signs stay inside rows 120–960, which a 19.5:9 phone still
 * shows, and clear of the window corners' Back and music and the title.
 */
const START: Point = { x: 330, y: 1040 }
const STOPS: Record<number, { sign: Point; moor: Point }> = {
  2: { sign: { x: 580, y: 890 }, moor: { x: 420, y: 880 } }, // the leaf-parcel stall
  3: { sign: { x: 160, y: 600 }, moor: { x: 330, y: 690 } }, // the vendor boat
  4: { sign: { x: 420, y: 450 }, moor: { x: 560, y: 610 } }, // the hat stall
  5: { sign: { x: 940, y: 870 }, moor: { x: 860, y: 700 } }, // the fruit boats
  6: { sign: { x: 1280, y: 760 }, moor: { x: 1120, y: 620 } }, // the mooring
  7: { sign: { x: 700, y: 260 }, moor: { x: 900, y: 420 } }, // the comic pier
  8: { sign: { x: 1060, y: 190 }, moor: { x: 1220, y: 340 } }, // the raft landing
  9: { sign: { x: 1660, y: 620 }, moor: { x: 1500, y: 440 } }, // the noodle-boat pier
  10: { sign: { x: 1800, y: 190 }, moor: { x: 1640, y: 280 } }, // น้องส้ม's stilt house
}
// 128 px: 46 CSS px on a 390 px-tall phone.
const SIGN = 128
// น้องส้ม's greeting pose in her boat (480×660) at 176 px tall, her boat on the water.
const HER = { width: 128, height: 176 }
const LAST_STOP = 10
const TITLE = 'แผนที่ตลาดเรือ'

const moorings = [START, ...Object.values(STOPS).map((stop) => stop.moor)]

/** The moorings from the start to `to`'s stop, or back, through every stop between. */
function route(from: number | null, to: number): Point[] {
  const at = (step: number | null) => (step === null ? 0 : step - FIRST_STOP + 1)
  const [a, b] = [at(from), at(to)]
  return a <= b ? moorings.slice(a, b + 1) : moorings.slice(b, a + 1).reverse()
}

const pressable = cx(pressFeedback, 'absolute block')

/**
 * แม่กน's Map (docs/mae-kon-spec.md): the floating market from above, with a wooden pier sign per stop along the
 * winding canal, Steps 2–9 and น้องส้ม's stilt house (Step 10). Every stop is open; a paddle-shaped arrow bobs over the
 * recommended one, a done stop hangs a marigold garland on its pier, and an Activity's sign shows its paddle Stars.
 * Tapping a stop paddles น้องส้ม's boat along the canal to its pier, then opens its Step; under reduced motion she is
 * simply there and the Step opens at once. The market is drawn in CSS and SVG (no Map art yet, #97), in its own
 * layer scaled like a Scene so the signs stay on their landmarks. Back to the cover and the music sit in the window's
 * bottom corners, the title in the top left, all from the Kit.
 */
export function MarketMap({ lesson }: StepProps) {
  return (
    <Stage scene="kon-canal">
      <MapBoard lesson={lesson} />
    </Stage>
  )
}

function MapBoard({ lesson }: StepProps) {
  const { stops, recommended, here } = useMap(lesson)
  const still = !!useReducedMotion()
  const bleed = useStageBleed()
  const navigate = useNavigate()
  const kit = useKit()
  const { poses } = useMascot()
  const musicOn = useLessonSession((state) => state.musicOn)
  const [at, setAt] = useState(here)
  const [paddleTo, setPaddleTo] = useState<number | null>(null)

  const points = paddleTo === null ? [at === null ? START : STOPS[at]!.moor] : route(at, paddleTo)
  const tall = bleed.y > 0.5
  const open = (step: number) => navigate({ to: '/lesson/$lessonId/$step', params: { lessonId: lesson.id, step: String(step) } })

  const choose = (event: MouseEvent, step: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (paddleTo !== null) return event.preventDefault()
    if (still || step === at) return setAt(step)
    event.preventDefault()
    setPaddleTo(step)
  }

  return (
    <>
      <div className="absolute inset-0" style={{ transform: `scale(${tall ? 1 : bleed.scale})` }}>
        <MarketFromAbove faded={tall} />

        <motion.div
          data-testid="map-mascot"
          data-at={paddleTo ?? at ?? 'start'}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{ width: HER.width, height: HER.height }}
          initial={false}
          animate={{ x: points.map((p) => p.x - HER.width / 2), y: points.map((p) => p.y - HER.height + 30) }}
          transition={paddleTo === null ? { duration: 0 } : { duration: Math.min(2.4, 0.5 + 0.25 * points.length), ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (paddleTo !== null) void open(paddleTo)
          }}
        >
          {/* Her boat rocks as she paddles along. */}
          <motion.img
            src={poses.greet}
            alt=""
            draggable={false}
            className="size-full object-contain select-none"
            animate={paddleTo === null ? { rotate: 0 } : { rotate: [-4, 4, -4] }}
            transition={paddleTo === null ? { duration: 0 } : { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <nav aria-label={TITLE}>
          <ol>
            {stops.map((stop) => (
              <li key={stop.step}>
                <Stop stop={stop} recommended={stop.step === recommended} lessonId={lesson.id} onChoose={choose} />
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="pointer-events-none absolute" style={{ inset: bleed.inset }}>
        <kit.TitleSign>
          <h1 className="truncate-thai">{TITLE}</h1>
        </kit.TitleSign>
        <Link
          to="/lesson/$lessonId/$step"
          params={{ lessonId: lesson.id, step: '1' }}
          aria-label="กลับหน้าปก"
          className={cx(pressable, 'bottom-[13px] left-[29px] h-[150px] w-[146px]', kit.back.className)}
        >
          <kit.back.Art />
        </Link>
        <button
          type="button"
          aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
          aria-pressed={musicOn}
          onClick={toggleMusic}
          className={cx(pressable, 'right-[46px] bottom-[27px] size-[122px]', kit.music.className)}
        >
          <kit.music.Art on={musicOn} />
        </button>
      </div>
    </>
  )
}

/** A smooth canal through the moorings: each bend a quadratic curve through the midpoints. */
function canalPath(points: readonly Point[]) {
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  let d = `M${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const m = mid(points[i]!, points[i + 1]!)
    d += ` Q${points[i]!.x} ${points[i]!.y} ${m.x} ${m.y}`
  }
  const last = points.at(-1)!
  return `${d} T${last.x} ${last.y}`
}

/** One small pier on the canal bank: planks on four posts. */
function Pier({ x, y }: Point) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-40" y="-14" width="80" height="28" rx="4" fill="var(--color-teak)" {...ink} strokeWidth={4} />
      <path d="M-26 -14 V14 M0 -14 V14 M26 -14 V14" stroke="var(--color-teak-deep)" strokeWidth={3} />
    </g>
  )
}

/**
 * The floating market from above, drawn in SVG: banks of orchards and banana plants round a winding green canal,
 * a pier at each mooring, and each stop's landmark. A window taller than 16:9 shows it whole, its top and bottom
 * edges fading into the Scene.
 */
function MarketFromAbove({ faded }: { faded: boolean }) {
  const d = canalPath([START, ...moorings.slice(1), { x: 1780, y: 300 }])
  return (
    <svg
      data-testid="map-art"
      aria-hidden="true"
      viewBox="0 0 1920 1080"
      className="pointer-events-none absolute inset-0 size-full select-none"
      style={faded ? { maskImage: 'linear-gradient(transparent, #000 60px, #000 calc(100% - 60px), transparent)' } : undefined}
    >
      <rect width="1920" height="1080" fill="#8cc06a" />
      {/* Orchard rows and banana plants on the banks. */}
      {Array.from({ length: 34 }, (_, i) => (
        <circle key={i} cx={(i * 263) % 1900} cy={(i * 149) % 1060} r={18 + (i % 3) * 6} fill={i % 2 ? 'var(--color-banana)' : 'var(--color-banana-deep)'} {...ink} strokeWidth={3} />
      ))}
      {/* The canal, its bank and a lighter channel down its middle. */}
      <path d={d} fill="none" stroke="var(--color-kon-ink)" strokeWidth={128} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--color-canal)" strokeWidth={116} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#4d9a73" strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60 90" />

      {/* Landmarks. 2: banana-leaf parcels on a tray. */}
      <ellipse cx="560" cy="1010" rx="90" ry="40" fill="var(--color-bamboo)" {...ink} />
      {[520, 560, 600].map((x) => (
        <rect key={x} x={x - 16} y="992" width="32" height="32" rx="6" fill="var(--color-banana)" {...ink} strokeWidth={3} />
      ))}
      {/* 3: a vendor boat. */}
      <path d="M180 760 Q260 790 340 760 L320 790 Q260 800 200 790 Z" fill="var(--color-teak)" {...ink} />
      {/* 4: hats on the hat stall. */}
      {[380, 440, 500].map((x) => (
        <ellipse key={x} cx={x} cy="340" rx="34" ry="20" fill="var(--color-coral)" {...ink} strokeWidth={4} />
      ))}
      {/* 5: two fruit boats moored side by side. */}
      {[960, 1060].map((y, i) => (
        <g key={y}>
          <path d={`M780 ${y - 200} Q860 ${y - 180} 940 ${y - 200} L920 ${y - 170} H800 Z`} fill="var(--color-teak)" {...ink} strokeWidth={4} />
          {[820, 860, 900].map((x, j) => (
            <circle key={x} cx={x} cy={y - 206} r="12" fill={(i + j) % 2 ? 'var(--color-marigold)' : 'var(--color-coral)'} {...ink} strokeWidth={3} />
          ))}
        </g>
      ))}
      {/* 6: mooring posts. */}
      {[1340, 1380, 1420].map((x) => (
        <rect key={x} x={x - 8} y="580" width="16" height="70" rx="6" fill="var(--color-teak-deep)" {...ink} strokeWidth={3} />
      ))}
      {/* 7: four comic boards on the bank. */}
      {[620, 680, 740, 800].map((x) => (
        <rect key={x} x={x - 24} y="140" width="48" height="40" rx="4" fill="var(--color-card)" {...ink} strokeWidth={3} />
      ))}
      {/* 8: a bamboo raft. */}
      <rect x="1240" y="150" width="130" height="70" rx="10" fill="var(--color-bamboo)" {...ink} />
      <path d="M1266 150 V220 M1292 150 V220 M1318 150 V220 M1344 150 V220" stroke="var(--color-bamboo-deep)" strokeWidth={4} />
      {/* 9: the noodle boat and its steam. */}
      <path d="M1680 460 Q1760 480 1840 460 L1820 490 H1700 Z" fill="var(--color-coral)" {...ink} />
      <path d="M1740 450 Q1730 420 1750 400 M1770 450 Q1760 420 1780 400" fill="none" stroke="var(--color-card)" strokeWidth={6} strokeLinecap="round" />
      {/* 10: น้องส้ม's stilt house over the water. */}
      <path d="M1730 340 V380 M1830 340 V380" {...ink} strokeWidth={8} />
      <rect x="1700" y="250" width="160" height="96" rx="8" fill="var(--color-teak)" {...ink} />
      <path d="M1680 256 L1780 190 L1880 256 Z" fill="var(--color-teak-deep)" {...ink} />

      {/* A pier at every mooring. */}
      {moorings.slice(1).map((m, i) => (
        <Pier key={i} x={m.x + 70} y={m.y + 40} />
      ))}
    </svg>
  )
}

type StopProps = {
  stop: MapStop
  recommended: boolean
  lessonId: string
  onChoose: (event: MouseEvent, step: number) => void
}

/** One stop's sign: a wooden pier plank with the Step number, a marigold garland once done, and an Activity's Stars. */
function Stop({ stop, recommended, lessonId, onChoose }: StopProps) {
  const { Star } = useKit()
  const still = useReducedMotion()
  const { sign } = STOPS[stop.step]!
  const home = stop.step === LAST_STOP
  const name = [
    `ขั้น ${stop.step} ${stop.title}`,
    stop.done && 'ทำแล้ว',
    stop.stars !== undefined && `ได้ ${stop.stars} ดาว`,
    recommended && 'ไปต่อที่นี่',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId, step: String(stop.step) }}
        aria-label={name}
        data-done={stop.done || undefined}
        onClick={(event) => onChoose(event, stop.step)}
        className="plank-sign absolute flex cursor-pointer flex-col items-center justify-center font-heading font-bold text-kon-ink select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
        style={{ left: sign.x - SIGN / 2, top: sign.y - SIGN / 2, width: SIGN, height: SIGN, '--rope': '10px', '--rope-inset': '-4px' } as CSSProperties}
      >
        <span aria-hidden="true" className={cx('relative leading-none', stop.stars === undefined ? 'text-[68px]' : 'mt-[6px] text-[52px]')}>
          {stop.step}
        </span>
        {stop.stars !== undefined && (
          <span aria-hidden="true" data-testid="stop-stars" className="relative mt-[6px] flex gap-[3px] text-[28px]">
            {[1, 2, 3].map((n) => (
              <span key={n} data-earned={n <= stop.stars! || undefined} className={n <= stop.stars! ? undefined : 'opacity-30 grayscale'}>
                <Star />
              </span>
            ))}
          </span>
        )}
        {/* A done stop hangs a marigold garland along the bottom of its pier sign. */}
        {stop.done && (
          <svg data-testid="stop-garland" aria-hidden="true" viewBox="0 0 140 40" className="pointer-events-none absolute -bottom-[30px] left-1/2 w-[140px] -translate-x-1/2 overflow-visible">
            <path d="M6 4 Q70 44 134 4" fill="none" stroke="var(--color-banana-deep)" strokeWidth={3} />
            {Array.from({ length: 7 }, (_, i) => {
              const t = (i + 0.5) / 7
              return (
                <circle
                  key={i}
                  cx={6 + 128 * t}
                  cy={4 + 40 * t * (1 - t) * 2}
                  r="9"
                  fill={i % 2 ? 'var(--color-marigold-deep)' : 'var(--color-marigold)'}
                  stroke="var(--color-kon-ink)"
                  strokeWidth={2.5}
                />
              )
            })}
          </svg>
        )}
      </Link>

      {/* The recommended stop: a paddle-shaped arrow bobbing above its sign, blade down (left of the stilt house). */}
      {recommended && (
        <motion.svg
          data-testid="map-arrow"
          aria-hidden="true"
          viewBox="0 0 60 110"
          className={cx('pointer-events-none absolute h-[110px] w-[60px] overflow-visible', home && '-rotate-90')}
          style={home ? { left: sign.x - SIGN / 2 - 96, top: sign.y - 55 } : { left: sign.x - 30, top: sign.y - SIGN / 2 - 122 }}
          animate={still ? undefined : home ? { x: [0, 12] } : { y: [0, 12] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <rect x="22" y="2" width="16" height="22" rx="7" fill="var(--color-teak-deep)" {...ink} strokeWidth={4} />
          <rect x="25" y="20" width="10" height="38" rx="4" fill="var(--color-honey)" {...ink} strokeWidth={4} />
          <path d="M30 108 Q4 86 6 70 Q8 54 30 54 Q52 54 54 70 Q56 86 30 108 Z" fill="var(--color-marigold)" {...ink} />
        </motion.svg>
      )}
    </>
  )
}
