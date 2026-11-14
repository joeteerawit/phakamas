import { Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import { toggleMusic } from '../../../audio/music'
import { useLessonSession } from '../../../session/lessonSession'
import { FIRST_STOP, useMap, type MapStop } from '../../../steps/map/useMap'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable as pressFeedback } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { Stage, useStageBleed } from '../../../ui/stage/Stage'

type Point = { x: number; y: number }

/**
 * Map pixels (1920×1080, the stage). The path starts on the taro bank at the bottom left and winds over stepping
 * stones and a boardwalk round the pond up to น้องกบ's hut on stilts at the top right. Each stop has its marker, a
 * 128 px raincoat pocket on its landmark, and the stone where she lands, clear of every marker. Markers stay inside
 * rows 120–960, which a 19.5:9 phone still shows, and clear of the window corners' Back and music and the title.
 */
const START: Point = { x: 240, y: 1045 }
const STOPS: Record<number, { sign: Point; foot: Point }> = {
  2: { sign: { x: 400, y: 820 }, foot: { x: 600, y: 935 } }, // the taro bank
  3: { sign: { x: 300, y: 610 }, foot: { x: 430, y: 740 } }, // the choir rock
  4: { sign: { x: 570, y: 585 }, foot: { x: 700, y: 665 } }, // the stepping-stone stream
  5: { sign: { x: 1020, y: 600 }, foot: { x: 790, y: 575 } }, // the washing line
  6: { sign: { x: 800, y: 330 }, foot: { x: 960, y: 505 } }, // the puddle path
  7: { sign: { x: 1085, y: 330 }, foot: { x: 1200, y: 455 } }, // the rain shelter
  8: { sign: { x: 1500, y: 285 }, foot: { x: 1370, y: 445 } }, // the boot rack
  9: { sign: { x: 1825, y: 440 }, foot: { x: 1630, y: 540 } }, // the painting porch
  10: { sign: { x: 1755, y: 195 }, foot: { x: 1630, y: 250 } }, // น้องกบ's hut
}
// 128 px: 46 CSS px on a 390 px-tall phone.
const SIGN = 128
// น้องกบ's greeting pose (480×600) at 150 px tall, standing on the stone.
const HER = { width: 120, height: 150 }
const LAST_STOP = 10

/** The stones from the start to `to`'s stop, or back, through every stop between. */
function path(from: number | null, to: number): Point[] {
  const at = (step: number | null) => (step === null ? 0 : step - FIRST_STOP + 1)
  const points = [START, ...Object.values(STOPS).map((stop) => stop.foot)]
  const [a, b] = [at(from), at(to)]
  return a <= b ? points.slice(a, b + 1) : points.slice(b, a + 1).reverse()
}

const pressable = cx(pressFeedback, 'absolute block')

/**
 * แม่กบ's Map (docs/mae-kop-spec.md): the rainy pond from above, with one raincoat-pocket marker per stop along the
 * stepping stones and boardwalk, Steps 2–9 and น้องกบ's hut (Step 10). Every stop is open; a raincoat-yellow raindrop
 * arrow bobs over the recommended one, a done stop has a paper boat moored by it, and an Activity's marker shows its
 * raindrop Stars. Tapping a stop hops น้องกบ stone to stone to it, then opens its Step; under reduced motion she is
 * simply there and the Step opens at once. The pond is drawn in CSS and SVG (no Map art yet, #69), in its own layer
 * scaled like a Scene so the markers stay on their landmarks. Back to the cover and the music sit in the window's
 * bottom corners, the title in the top left, all from the Kit.
 */
export function PondMap({ lesson }: StepProps) {
  return (
    <Stage scene="kop-drizzle">
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
  const [hopTo, setHopTo] = useState<number | null>(null)

  const route = hopTo === null ? [at === null ? START : STOPS[at]!.foot] : path(at, hopTo)
  const tall = bleed.y > 0.5
  const open = (step: number) => navigate({ to: '/lesson/$lessonId/$step', params: { lessonId: lesson.id, step: String(step) } })

  const choose = (event: MouseEvent, step: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (hopTo !== null) return event.preventDefault()
    if (still || step === at) return setAt(step)
    event.preventDefault()
    setHopTo(step)
  }

  return (
    <>
      <div className="absolute inset-0" style={{ transform: `scale(${tall ? 1 : bleed.scale})` }}>
        <PondArt faded={tall} />

        <motion.div
          data-testid="map-mascot"
          data-at={hopTo ?? at ?? 'start'}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{ width: HER.width, height: HER.height }}
          initial={false}
          animate={{ x: route.map((p) => p.x - HER.width / 2), y: route.map((p) => p.y - HER.height) }}
          transition={hopTo === null ? { duration: 0 } : { duration: Math.min(2, 0.4 + 0.2 * route.length), ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (hopTo !== null) void open(hopTo)
          }}
        >
          {/* A hop from stone to stone while she travels. */}
          <motion.img
            src={poses.greet}
            alt=""
            draggable={false}
            className="size-full object-contain select-none"
            animate={hopTo === null ? { y: 0 } : { y: [0, -30, 0] }}
            transition={hopTo === null ? { duration: 0 } : { duration: 0.36, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.div>

        <nav aria-label="แผนที่บึงบัว">
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
          <h1 className="truncate">แผนที่บึงบัว</h1>
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

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** The stones between two feet, every ~70 px along the straight line. */
function stones(a: Point, b: Point) {
  const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 70))
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 0.5)) / n, y: a.y + ((b.y - a.y) * (i + 0.5)) / n }))
}

/**
 * The pond from above, drawn in SVG: grassy banks round a teal pond, the stepping stones and boardwalk of the path,
 * and each stop's landmark. A window taller than 16:9 shows it whole, its top and bottom edges fading into the Scene.
 */
function PondArt({ faded }: { faded: boolean }) {
  const feet = [START, ...Object.values(STOPS).map((stop) => stop.foot)]
  const path = feet.slice(1).flatMap((foot, i) => stones(feet[i]!, foot))
  return (
    <svg
      data-testid="map-art"
      aria-hidden="true"
      viewBox="0 0 1920 1080"
      className="pointer-events-none absolute inset-0 size-full select-none"
      style={faded ? { maskImage: 'linear-gradient(transparent, #000 60px, #000 calc(100% - 60px), transparent)' } : undefined}
    >
      <rect width="1920" height="1080" fill="#7cc36a" />
      {/* Grass tufts on the banks. */}
      {Array.from({ length: 40 }, (_, i) => (
        <path key={i} d={`M${(i * 211) % 1900} ${(i * 137) % 1060} l8 -18 l8 18`} fill="none" stroke="var(--color-lily-deep)" strokeWidth={4} strokeLinecap="round" />
      ))}
      {/* The pond and the stream that runs into it. */}
      <path d="M480 470 C520 360 760 300 960 340 C1180 380 1420 330 1540 420 C1660 520 1560 700 1380 760 C1160 840 900 860 700 800 C520 740 440 600 480 470 Z" fill="var(--color-pond)" {...ink} />
      <path d="M560 1080 C600 940 700 780 760 700" fill="none" stroke="var(--color-pond)" strokeWidth={60} />
      <path d="M520 470 C580 400 760 360 900 380" fill="none" stroke="var(--color-pond-light)" strokeWidth={6} strokeLinecap="round" />
      {[
        [760, 640, 70],
        [1160, 600, 90],
        [1300, 700, 50],
        [980, 740, 60],
      ].map(([cx, cy, rx]) => (
        <g key={cx}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={rx! * 0.7} fill="var(--color-lily)" {...ink} strokeWidth={4} />
          <path d={`M${cx} ${cy} L${cx! + rx! * 0.8} ${cy! - rx! * 0.3}`} {...ink} strokeWidth={4} />
        </g>
      ))}

      {/* Landmarks. 2: taro leaves on the bank. */}
      {[
        [330, 900],
        [470, 960],
        [250, 760],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M0 0 C-60 -10 -80 -70 -40 -95 C-15 -110 15 -110 40 -95 C80 -70 60 -10 0 0 Z" fill="var(--color-lily-deep)" {...ink} />
          <path d="M0 0 V-90" stroke="#b8e6a0" strokeWidth={5} />
        </g>
      ))}
      {/* 3: the choir rock. */}
      <ellipse cx="300" cy="690" rx="110" ry="50" fill="var(--color-rubber)" {...ink} />
      {/* 5: the washing line on two poles, with three cards pegged on it. */}
      <path d="M900 560 V680 M1160 560 V680 M900 572 Q1030 610 1160 572" fill="none" {...ink} />
      {[950, 1030, 1110].map((x, i) => (
        <rect key={x} x={x - 22} y={584 + (i === 1 ? 6 : 0)} width="44" height="54" rx="6" fill="var(--color-pond-light)" {...ink} strokeWidth={4} />
      ))}
      {/* 6: the puddles on the path. */}
      {[
        [700, 300],
        [880, 250],
        [640, 400],
      ].map(([cx, cy]) => (
        <ellipse key={cx} cx={cx} cy={cy} rx="60" ry="30" fill="var(--color-pond-light)" {...ink} strokeWidth={4} />
      ))}
      {/* 7: the rain shelter's roof. */}
      <path d="M990 250 L1085 190 L1180 250 Z" fill="var(--color-raincoat)" {...ink} />
      {/* 8: the porch with its boot rack. */}
      <rect x="1400" y="170" width="220" height="70" rx="10" fill="var(--color-mud)" {...ink} />
      {[1430, 1480, 1540, 1590].map((x) => (
        <rect key={x} x={x - 14} y="186" width="28" height="40" rx="6" fill="var(--color-rubber)" {...ink} strokeWidth={4} />
      ))}
      {/* 9: the painting porch's easel. */}
      <path d="M1800 520 L1760 620 M1850 520 L1890 620 M1825 520 V630" fill="none" {...ink} />
      <rect x="1770" y="440" width="110" height="90" rx="6" fill="var(--color-card)" {...ink} />
      {/* 10: น้องกบ's hut on stilts over the water. */}
      <ellipse cx="1755" cy="200" rx="170" ry="90" fill="var(--color-pond)" {...ink} />
      <path d="M1700 230 V280 M1810 230 V280" {...ink} strokeWidth={8} />
      <rect x="1690" y="120" width="130" height="110" rx="10" fill="var(--color-pond-deep)" {...ink} />
      <path d="M1670 130 L1755 60 L1840 130 Z" fill="var(--color-raincoat)" {...ink} />

      {/* The boardwalk round the hut and the stepping stones of the path. */}
      <path d="M1630 250 L1630 540" stroke="var(--color-mud)" strokeWidth={34} />
      {path.map((stone, i) => (
        <ellipse key={i} data-testid="map-stone" cx={stone.x} cy={stone.y} rx="26" ry="18" fill="#c9d3dc" {...ink} strokeWidth={4} />
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

/** One stop's marker: a raincoat pocket with the Step number, a paper boat moored once done, and an Activity's Stars. */
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
        className="pocket-card absolute flex cursor-pointer flex-col items-center justify-center font-heading font-bold text-pond-deep select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
        style={{ left: sign.x - SIGN / 2, top: sign.y - SIGN / 2, width: SIGN, height: SIGN }}
      >
        <span aria-hidden="true" className={cx('relative leading-none', stop.stars === undefined ? 'text-[68px]' : 'mt-[10px] text-[52px]')}>
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
        {/* A done stop has a paper boat moored by its pocket. */}
        {stop.done && (
          <svg data-testid="stop-boat" aria-hidden="true" viewBox="0 0 80 46" className="pointer-events-none absolute -right-[30px] -bottom-[26px] w-[70px] overflow-visible">
            <path d="M3 26 H77 L64 44 H16 Z" fill="var(--color-card)" stroke="var(--color-rubber-deep)" strokeWidth={4} strokeLinejoin="round" />
            <path d="M40 2 L40 26 L20 26 Z M40 2 L60 26 H40 Z" fill="var(--color-raincoat)" stroke="var(--color-rubber-deep)" strokeWidth={4} strokeLinejoin="round" />
          </svg>
        )}
      </Link>

      {/* The recommended stop: a raincoat-yellow raindrop arrow bobbing above its marker (left of the hut, at the top). */}
      {recommended && (
        <motion.svg
          data-testid="map-arrow"
          aria-hidden="true"
          viewBox="0 0 70 96"
          className={cx('pointer-events-none absolute h-[96px] w-[70px] overflow-visible', home && '-rotate-90')}
          style={home ? { left: sign.x - SIGN / 2 - 92, top: sign.y - 48 } : { left: sign.x - 35, top: sign.y - SIGN / 2 - 106 }}
          animate={still ? undefined : home ? { x: [0, 12] } : { y: [0, 12] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <path
            d="M35 92 C22 70 4 52 4 34 C4 16 18 4 35 4 C52 4 66 16 66 34 C66 52 48 70 35 92 Z"
            fill="var(--color-raincoat)"
            stroke="var(--color-rubber-deep)"
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <path d="M22 30 L35 46 L48 30" fill="none" stroke="var(--color-rubber-deep)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      )}
    </>
  )
}
