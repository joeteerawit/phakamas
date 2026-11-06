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
 * Pixels of kom-map.webp (1920×1080, the stage). The street starts at the bottom left, by the shops, and winds up
 * to น้องส้ม's home at the top right. Each stop has its sign, a 128 px ice block on its landmark, and the
 * spot on the street where she stands, clear of every sign. Signs stay inside image rows 120–960, which a 19.5:9
 * phone still shows, and clear of the window corners' Back and music buttons and the title sign.
 */
const START: Point = { x: 240, y: 1045 }
const STOPS: Record<number, { sign: Point; foot: Point }> = {
  2: { sign: { x: 400, y: 820 }, foot: { x: 600, y: 935 } }, // the shop row
  3: { sign: { x: 300, y: 610 }, foot: { x: 430, y: 740 } }, // the billboard's building, its screen left in view
  4: { sign: { x: 570, y: 585 }, foot: { x: 700, y: 665 } }, // the bus stop
  5: { sign: { x: 1020, y: 600 }, foot: { x: 790, y: 575 } }, // the umbrella square
  6: { sign: { x: 800, y: 330 }, foot: { x: 960, y: 505 } }, // the apartment block
  7: { sign: { x: 1085, y: 330 }, foot: { x: 1200, y: 455 } }, // the cinema's left wing, its marquee left in view
  8: { sign: { x: 1500, y: 285 }, foot: { x: 1370, y: 445 } }, // the lamp street
  9: { sign: { x: 1825, y: 440 }, foot: { x: 1630, y: 540 } }, // the post office, its envelope sign left in view
  10: { sign: { x: 1755, y: 195 }, foot: { x: 1630, y: 250 } }, // home
}
// 128 px: 46 CSS px on a 390 px-tall phone.
const SIGN = 128
// น้องส้ม's greeting pose (487×800) at 160 px tall, her feet on the street.
const HER = { width: 98, height: 160 }
const LAST_STOP = 10

/** The street from the start to `to`'s stop, or back, through every stop between. */
function street(from: number | null, to: number): Point[] {
  const at = (step: number | null) => (step === null ? 0 : step - FIRST_STOP + 1)
  const points = [START, ...Object.values(STOPS).map((stop) => stop.foot)]
  const [a, b] = [at(from), at(to)]
  return a <= b ? points.slice(a, b + 1) : points.slice(b, a + 1).reverse()
}

const pressable = cx(pressFeedback, 'absolute block')

/**
 * แม่กม's Map (docs/mae-kom-spec.md): the snowy city from above, with one sign per stop along the winding street,
 * Steps 2–9 and home (Step 10). Every stop is open; an arrow bobs beside the recommended one, a done stop's window is
 * lit and an Activity's sign shows its snowflake-stars. Tapping a stop walks น้องส้ม along the street to it, then
 * opens its Step; under reduced motion she is simply there and the Step opens at once. The map is drawn in its own
 * layer, scaled like the Scene to fill a wide window, so the signs stay on their landmarks; a taller window shows it
 * whole, its top and bottom edges fading into the Scene behind. Back to the cover and the music sit in the window's
 * bottom corners, the title in the top left, all from the Kit.
 */
export function CityMap({ lesson }: StepProps) {
  return (
    <Stage scene="kom-map">
      <MapBoard lesson={lesson} />
    </Stage>
  )
}

/** Everything on the Map, inside the Stage so it knows how far the window reaches past the stage. */
function MapBoard({ lesson }: StepProps) {
  const { stops, recommended, here } = useMap(lesson)
  const still = !!useReducedMotion()
  const bleed = useStageBleed()
  const navigate = useNavigate()
  const kit = useKit()
  const { poses } = useMascot()
  const musicOn = useLessonSession((state) => state.musicOn)
  const [at, setAt] = useState(here)
  const [walkTo, setWalkTo] = useState<number | null>(null)

  const route = walkTo === null ? [at === null ? START : STOPS[at]!.foot] : street(at, walkTo)
  const tall = bleed.y > 0.5
  const open = (step: number) => navigate({ to: '/lesson/$lessonId/$step', params: { lessonId: lesson.id, step: String(step) } })

  const choose = (event: MouseEvent, step: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (walkTo !== null) return event.preventDefault()
    if (still || step === at) return setAt(step)
    event.preventDefault()
    setWalkTo(step)
  }

  return (
    <>
      <div className="absolute inset-0" style={{ transform: `scale(${tall ? 1 : bleed.scale})` }}>
        <img
          src="/assets/comic/kom-map.webp"
          alt=""
          draggable={false}
          data-testid="map-art"
          className="pointer-events-none absolute inset-0 size-full select-none"
          style={tall ? { maskImage: 'linear-gradient(transparent, #000 60px, #000 calc(100% - 60px), transparent)' } : undefined}
        />

        <motion.div
          data-testid="map-mascot"
          data-at={walkTo ?? at ?? 'start'}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{ width: HER.width, height: HER.height }}
          initial={false}
          animate={{ x: route.map((p) => p.x - HER.width / 2), y: route.map((p) => p.y - HER.height) }}
          transition={walkTo === null ? { duration: 0 } : { duration: Math.min(2, 0.4 + 0.2 * route.length), ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (walkTo !== null) void open(walkTo)
          }}
        >
          {/* A little hop with each step while she walks. */}
          <motion.img
            src={poses.greet}
            alt=""
            draggable={false}
            className="size-full object-contain select-none"
            animate={walkTo === null ? { y: 0 } : { y: [0, -14, 0] }}
            transition={walkTo === null ? { duration: 0 } : { duration: 0.32, repeat: Infinity }}
          />
        </motion.div>

        <nav aria-label="แผนที่เมืองหิมะ">
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
          <h1 className="truncate">แผนที่เมืองหิมะ</h1>
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

type StopProps = {
  stop: MapStop
  recommended: boolean
  lessonId: string
  onChoose: (event: MouseEvent, step: number) => void
}

/** One stop's sign: an ice block with the Step number, its window lit once done, and an Activity's Stars. */
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
        className="ice-block absolute flex cursor-pointer flex-col items-center justify-center font-heading font-bold select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
        style={{ left: sign.x - SIGN / 2, top: sign.y - SIGN / 2, width: SIGN, height: SIGN }}
      >
        {/* The window: dark until the stop is done, then lit warm yellow. */}
        <span
          aria-hidden="true"
          data-testid="stop-window"
          className={cx(
            'absolute top-[10px] right-[10px] grid size-[32px] grid-cols-2 gap-[3px] rounded-[6px] border-[4px] border-comic-ink bg-comic-ink',
            stop.done && 'shadow-[0_0_16px_6px_var(--color-sun)]',
          )}
        >
          {[0, 1, 2, 3].map((pane) => (
            <span key={pane} className={stop.done ? 'bg-sun' : 'bg-sign-blue/60'} />
          ))}
        </span>
        <span aria-hidden="true" className={cx('leading-none', stop.stars === undefined ? 'text-[68px]' : 'mt-[4px] text-[52px]')}>
          {stop.step}
        </span>
        {stop.stars !== undefined && (
          <span aria-hidden="true" data-testid="stop-stars" className="mt-[8px] flex gap-[3px] text-[28px]">
            {[1, 2, 3].map((n) => (
              <span key={n} data-earned={n <= stop.stars! || undefined} className={n <= stop.stars! ? undefined : 'opacity-30 grayscale'}>
                <Star />
              </span>
            ))}
          </span>
        )}
      </Link>

      {/* The recommended stop: a red arrow bobbing above its sign (left of home, at the top of the map). */}
      {recommended && (
        <motion.svg
          data-testid="map-arrow"
          aria-hidden="true"
          viewBox="0 0 70 90"
          className={cx('pointer-events-none absolute h-[90px] w-[70px] overflow-visible', home && '-rotate-90')}
          style={home ? { left: sign.x - SIGN / 2 - 90, top: sign.y - 45 } : { left: sign.x - 35, top: sign.y - SIGN / 2 - 100 }}
          animate={still ? undefined : home ? { x: [0, 12] } : { y: [0, 12] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <path
            d="M20 4 H50 V48 H66 L35 86 L4 48 H20 Z"
            fill="var(--color-comic-red)"
            stroke="var(--color-comic-ink)"
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <path d="M28 12 V44" stroke="var(--color-card)" strokeWidth={5} strokeLinecap="round" />
        </motion.svg>
      )}
    </>
  )
}
