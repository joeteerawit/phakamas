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
import { ink } from '../kit/ink'

type Point = { x: number; y: number }

/**
 * Map pixels (1920×1080, the stage). The footpath starts at the foot of the hill, bottom left, and zigzags up three
 * terraces: left to right along the lowest (Steps 2–4), back right to left along the middle (5–7), left to right along
 * the top (8 and 9), and on to the bamboo hut at the top right (10). Each stop has its stake, a 128 px seed-packet
 * label on a wooden post, and the spot on the path where น้องนก lands, clear of every label. Labels stay inside rows
 * 120–960, which a 19.5:9 phone still shows, and clear of the window corners' Back and music and the title.
 */
const START: Point = { x: 300, y: 1050 }
const STOPS: Record<number, { sign: Point; foot: Point }> = {
  2: { sign: { x: 440, y: 850 }, foot: { x: 580, y: 960 } },
  3: { sign: { x: 900, y: 850 }, foot: { x: 1040, y: 960 } },
  4: { sign: { x: 1360, y: 850 }, foot: { x: 1500, y: 960 } },
  5: { sign: { x: 1500, y: 590 }, foot: { x: 1360, y: 700 } },
  6: { sign: { x: 1040, y: 590 }, foot: { x: 900, y: 700 } },
  7: { sign: { x: 580, y: 590 }, foot: { x: 440, y: 700 } },
  8: { sign: { x: 700, y: 330 }, foot: { x: 840, y: 440 } },
  9: { sign: { x: 1160, y: 330 }, foot: { x: 1300, y: 440 } },
  10: { sign: { x: 1700, y: 330 }, foot: { x: 1560, y: 440 } },
}
// 128 px: 46 CSS px on a 390 px-tall phone.
const SIGN = 128
// น้องนก's greeting pose (520×600) at 150 px tall, standing on the path.
const HER = { width: 130, height: 150 }
const TITLE = 'แผนที่สวนผัก'

/** The path from the start to `to`'s stop, or back, through every stop between. */
function path(from: number | null, to: number): Point[] {
  const at = (step: number | null) => (step === null ? 0 : step - FIRST_STOP + 1)
  const points = [START, ...Object.values(STOPS).map((stop) => stop.foot)]
  const [a, b] = [at(from), at(to)]
  return a <= b ? points.slice(a, b + 1) : points.slice(b, a + 1).reverse()
}

const pressable = cx(pressFeedback, 'absolute block')

/**
 * แม่กก's Map (docs/mae-kok-spec.md): the terraced hillside seen from the side, blue mountains behind, with one wooden
 * garden stake per stop along the zigzag footpath, Steps 2–9 and the bamboo hut at the top (Step 10). Every stop is
 * open; a terracotta arrow bobs over the recommended one, a done stop grows a green sprout, and an Activity's label
 * shows its seed-stars, all from the Session. Tapping a stop hops น้องนก up the path to it, then opens its Step; under
 * reduced motion she is simply there and the Step opens at once. The hillside is drawn in CSS and SVG (no Map art yet,
 * #83), in its own layer scaled like a Scene so the stakes stay on their terraces. Back to the cover and the music sit
 * in the window's bottom corners, the title in the top left, all from the Kit.
 */
export function HillsideMap({ lesson }: StepProps) {
  return (
    <Stage scene="kok-terrace">
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
        <HillArt faded={tall} />

        <motion.div
          data-testid="map-mascot"
          data-at={hopTo ?? at ?? 'start'}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{ width: HER.width, height: HER.height }}
          initial={false}
          animate={{ x: route.map((p) => p.x - HER.width / 2), y: route.map((p) => p.y - HER.height) }}
          transition={hopTo === null ? { duration: 0 } : { duration: Math.min(2.2, 0.4 + 0.22 * route.length), ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (hopTo !== null) void open(hopTo)
          }}
        >
          {/* A little hop with every step up the path. */}
          <motion.img
            src={poses.greet}
            alt=""
            draggable={false}
            className="size-full object-contain select-none"
            animate={hopTo === null ? { y: 0 } : { y: [0, -26, 0] }}
            transition={hopTo === null ? { duration: 0 } : { duration: 0.34, repeat: Infinity, ease: 'easeOut' }}
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
          <h1 className="truncate">{TITLE}</h1>
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

// The three terraces, the top one first so each lower one is drawn over its foot: each a green step with a soil front.
const TERRACES = [
  { top: 240, left: 420, right: 1880, fill: '#5c9e3a' },
  { top: 500, left: 220, right: 1920, fill: '#6ab148' },
  { top: 760, left: 0, right: 1920, fill: '#7cc356' },
]

/**
 * The hillside from the side, drawn in SVG: a sky and blue mountains, three stepped terraces with their crop rows, the
 * bamboo hut at the top and the zigzag footpath through every stop. A window taller than 16:9 shows it whole, its top
 * and bottom edges fading into the Scene.
 */
function HillArt({ faded }: { faded: boolean }) {
  const feet = [START, ...Object.values(STOPS).map((stop) => stop.foot)]
  return (
    <svg
      data-testid="map-art"
      aria-hidden="true"
      viewBox="0 0 1920 1080"
      className="pointer-events-none absolute inset-0 size-full select-none"
      style={faded ? { maskImage: 'linear-gradient(transparent, #000 60px, #000 calc(100% - 60px), transparent)' } : undefined}
    >
      <rect width="1920" height="1080" fill="#a9dcf7" />
      <path d="M0 300 L260 120 L520 260 L820 70 L1120 240 L1420 90 L1700 220 L1920 120 V600 H0 Z" fill="var(--color-ridge-light)" {...ink} />
      <path d="M0 380 L360 230 L700 340 L1020 200 L1360 330 L1660 210 L1920 300 V700 H0 Z" fill="var(--color-ridge)" {...ink} />
      {TERRACES.map(({ top, left, right, fill }) => (
        <g key={top}>
          <path d={`M${left} ${top} H${right} V1080 H${left} Z`} fill={fill} {...ink} />
          <path d={`M${left} ${top + 230} H${right} V${top + 260} H${left} Z`} fill="var(--color-soil)" {...ink} strokeWidth={4} />
          {Array.from({ length: Math.floor((right - left) / 90) }, (_, i) => (
            <ellipse key={i} cx={left + 50 + i * 90} cy={top + 30} rx="26" ry="11" fill="var(--color-sprout-deep)" opacity={0.6} />
          ))}
        </g>
      ))}
      {/* The bamboo hut at the top of the hill. */}
      <g data-testid="map-hut">
        <path d="M1600 240 V160 M1800 240 V160" {...ink} strokeWidth={10} />
        <rect x="1610" y="140" width="180" height="100" fill="#d9c27a" {...ink} />
        {[1640, 1680, 1720, 1760].map((x) => (
          <path key={x} d={`M${x} 140 V240`} stroke="#a88e46" strokeWidth={5} />
        ))}
        <path d="M1580 150 L1700 60 L1820 150 Z" fill="var(--color-kraft-deep)" {...ink} />
      </g>
      {/* The footpath, worn soil zigzagging up through every stop. */}
      <polyline
        points={feet.map((p) => `${p.x},${p.y - 10}`).join(' ')}
        fill="none"
        stroke="var(--color-kraft)"
        strokeWidth={34}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        data-testid="map-path"
        points={feet.map((p) => `${p.x},${p.y - 10}`).join(' ')}
        fill="none"
        stroke="var(--color-kraft-deep)"
        strokeWidth={6}
        strokeDasharray="18 16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type StopProps = {
  stop: MapStop
  recommended: boolean
  lessonId: string
  onChoose: (event: MouseEvent, step: number) => void
}

/** One stop's stake: a seed-packet label with the Step number on a wooden post, a sprout once done, and an Activity's seed-stars. */
function Stop({ stop, recommended, lessonId, onChoose }: StopProps) {
  const { Star, card } = useKit()
  const still = useReducedMotion()
  const { sign } = STOPS[stop.step]!
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
      {/* The stake's post, driven into the terrace under its label. */}
      <span
        aria-hidden="true"
        data-testid="stop-post"
        className="pointer-events-none absolute w-[24px] rounded-b-[8px] border-[4px] border-soil-deep bg-plank"
        style={{ left: sign.x - 12, top: sign.y + SIGN / 2 - 8, height: 70 }}
      />
      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId, step: String(stop.step) }}
        aria-label={name}
        data-done={stop.done || undefined}
        onClick={(event) => onChoose(event, stop.step)}
        className={cx(
          card,
          'absolute flex cursor-pointer flex-col items-center justify-center pt-[14px] font-heading font-bold text-soil-deep select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
        )}
        style={{ left: sign.x - SIGN / 2, top: sign.y - SIGN / 2, width: SIGN, height: SIGN }}
      >
        <span aria-hidden="true" className={cx('relative leading-none', stop.stars === undefined ? 'text-[66px]' : 'text-[50px]')}>
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
        {/* A done stop grows a green sprout beside its post. */}
        {stop.done && (
          <svg data-testid="stop-sprout" aria-hidden="true" viewBox="0 0 60 70" className="pointer-events-none absolute -right-[34px] -bottom-[52px] w-[56px] overflow-visible">
            <path d="M30 70 V30" stroke="var(--color-sprout-deep)" strokeWidth={7} strokeLinecap="round" />
            <path d="M30 36 Q4 34 2 8 Q28 10 30 36 Z M30 30 Q54 26 58 2 Q34 4 30 30 Z" fill="var(--color-sprout)" {...ink} strokeWidth={4} />
          </svg>
        )}
      </Link>

      {/* The recommended stop: a terracotta arrow bobbing above its label. */}
      {recommended && (
        <motion.svg
          data-testid="map-arrow"
          aria-hidden="true"
          viewBox="0 0 70 96"
          className="pointer-events-none absolute h-[96px] w-[70px] overflow-visible"
          style={{ left: sign.x - 35, top: sign.y - SIGN / 2 - 106 }}
          animate={still ? undefined : { y: [0, 12] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <path d="M20 4 H50 V54 H66 L35 92 L4 54 H20 Z" fill="var(--color-terracotta)" {...ink} />
        </motion.svg>
      )}
    </>
  )
}
