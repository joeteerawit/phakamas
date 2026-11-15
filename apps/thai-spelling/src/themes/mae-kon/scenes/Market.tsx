import type { ReactNode } from 'react'
import { ink } from '../kit/ink'

// แม่กน's Scenes (docs/mae-kon-spec.md), drawn in scene pixels (1920×1080) with CSS and inline SVG, so they need no
// raster art until #97. The Stage scales this layer to cover the window, so nothing letterboxes. All of it sits
// behind the Step's words and buttons; under reduced motion everything here stands still (motion-reduce).

const layer = 'pointer-events-none absolute inset-0 overflow-hidden select-none'

/** Water line of the canal: the far bank above it, the water below. */
const WATER_TOP = 660

/** A wooden stilt house on the far bank, with a palm-thatch roof. */
function StiltHouse({ x, k = 1, roof = 'var(--color-teak-deep)' }: { x: number; k?: number; roof?: string }) {
  return (
    <g transform={`translate(${x} ${WATER_TOP}) scale(${k})`}>
      <path d="M20 0 V-60 M150 0 V-60 M85 0 V-60" stroke="var(--color-teak-deep)" strokeWidth={8} />
      <rect x="0" y="-170" width="170" height="112" fill="var(--color-teak)" {...ink} />
      <rect x="66" y="-130" width="40" height="72" fill="var(--color-teak-deep)" {...ink} strokeWidth={4} />
      <path d="M-24 -166 L85 -250 L194 -166 Z" fill={roof} {...ink} />
    </g>
  )
}

/** A banana plant: its trunk and broad, torn leaves. */
function BananaTree({ x, y, k = 1, flip = false }: { x: number; y: number; k?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}>
      <path d="M0 0 Q-10 -150 6 -300" fill="none" stroke="var(--color-banana-deep)" strokeWidth={34} strokeLinecap="round" />
      <path d="M6 -300 Q120 -380 220 -300 Q120 -310 6 -300 Z" fill="var(--color-banana)" {...ink} />
      <path d="M6 -300 Q-60 -420 -160 -380 Q-60 -340 6 -300 Z" fill="var(--color-banana)" {...ink} />
      <path d="M6 -300 Q40 -440 110 -470 Q70 -380 6 -300 Z" fill="var(--color-banana)" {...ink} />
      <path d="M6 -300 Q120 -330 200 -304 M6 -300 Q-70 -370 -140 -378 M6 -300 Q50 -400 100 -452" fill="none" stroke="var(--color-banana-light)" strokeWidth={5} />
    </g>
  )
}

/** A wooden pier at the near bank, its posts standing in the water. */
function Pier({ x, w }: { x: number; w: number }) {
  return (
    <g>
      {[0, 0.5, 1].map((f) => (
        <rect key={f} x={x + f * (w - 18)} y={WATER_TOP + 260} width="18" height="200" fill="var(--color-teak-deep)" {...ink} strokeWidth={4} />
      ))}
      <rect x={x - 10} y={WATER_TOP + 240} width={w + 20} height="34" rx="6" fill="var(--color-teak)" {...ink} />
    </g>
  )
}

/**
 * The canal every แม่กน Scene shares: a warm market sky (or dusk), stilt houses and banana plants on the far bank,
 * the green canal with still ripple lines, and wooden piers with banana plants in the bottom corners.
 */
function CanalBackdrop({ sky, children }: { sky: 'day' | 'dusk'; children?: ReactNode }) {
  const dusk = sky === 'dusk'
  return (
    <svg data-testid="scene-backdrop" aria-hidden="true" viewBox="0 0 1920 1080" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id="kon-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? '#5b3f86' : '#8fd3ef'} />
          <stop offset="0.6" stopColor={dusk ? '#e98a5a' : '#d5effa'} />
          <stop offset="1" stopColor={dusk ? '#ffc98a' : 'var(--color-market-sky)'} />
        </linearGradient>
        <linearGradient id="kon-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? '#52715e' : '#4d9a73'} />
          <stop offset="1" stopColor={dusk ? '#243a33' : 'var(--color-canal-deep)'} />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#kon-sky)" />
      {dusk ? (
        <>
          <circle cx="1500" cy="560" r="110" fill="#ffb46a" opacity="0.9" />
          {[[260, 120], [700, 70], [1180, 150], [1700, 90]].map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r="4" fill="#fff6d8" />
          ))}
        </>
      ) : (
        <circle cx="1700" cy="140" r="76" fill="var(--color-sun)" {...ink} />
      )}
      {/* The far bank: stilt houses between banana plants. */}
      <path d={`M0 ${WATER_TOP - 40} Q480 ${WATER_TOP - 80} 960 ${WATER_TOP - 50} T1920 ${WATER_TOP - 60} V${WATER_TOP} H0 Z`} fill={dusk ? '#4c5e3a' : '#7aa94d'} {...ink} />
      <StiltHouse x={250} k={0.9} />
      <StiltHouse x={760} k={0.75} roof="var(--color-coral-deep)" />
      <StiltHouse x={1180} k={0.85} />
      <StiltHouse x={1560} k={0.7} roof="var(--color-coral-deep)" />
      <BananaTree x={560} y={WATER_TOP - 30} k={0.5} />
      <BananaTree x={1430} y={WATER_TOP - 30} k={0.45} flip />
      <rect y={WATER_TOP} width="1920" height={1080 - WATER_TOP} fill="url(#kon-water)" />
      <path d={`M0 ${WATER_TOP} H1920`} {...ink} />
      {/* Still ripple lines of light on the water. */}
      {[
        [300, 760, 160],
        [1600, 790, 180],
        [960, 1000, 260],
        [620, 900, 120],
        [1320, 920, 130],
      ].map(([cx, cy, w]) => (
        <path key={cx} d={`M${cx! - w!} ${cy} Q${cx} ${cy! - 14} ${cx! + w!} ${cy}`} fill="none" stroke="rgb(255 255 255 / 0.3)" strokeWidth={6} strokeLinecap="round" />
      ))}
      <Pier x={20} w={240} />
      <Pier x={1660} w={240} />
      <BananaTree x={110} y={1080} k={0.9} />
      <BananaTree x={1820} y={1080} k={0.95} flip />
      {children}
    </svg>
  )
}

/** Ripples spreading on the water, each from its own spot; negative delays start them part-way. */
function Ripples({ ripples, testId = 'scene-ripple' }: { ripples: readonly { x: number; y: number; w: number; delay: number }[]; testId?: string }) {
  return ripples.map((ripple) => (
    <span
      key={`${ripple.x}-${ripple.y}`}
      data-testid={testId}
      className="absolute animate-canal-ripple rounded-[50%] border-[5px] border-canal-light/80 will-change-transform motion-reduce:hidden"
      style={{ left: ripple.x - ripple.w / 2, top: ripple.y - ripple.w * 0.1, width: ripple.w, height: ripple.w * 0.2, animationDelay: `${ripple.delay}s` }}
    />
  ))
}

const FRUIT = ['var(--color-marigold)', 'var(--color-coral)', 'var(--color-banana)', '#f6d13a', 'var(--color-lotus)']

/** A vendor boat piled with fruit and flowers, its vendor in a งอบ at the stern. */
function VendorBoat({ load }: { load: number }) {
  return (
    <svg viewBox="0 0 300 150" className="w-[300px] overflow-visible">
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={70 + i * 26} cy={86 - (i % 2) * 14} r="17" fill={FRUIT[(i + load) % FRUIT.length]} {...ink} strokeWidth={3.5} />
      ))}
      <circle cx="244" cy="62" r="18" fill="#f2c48d" {...ink} strokeWidth={3.5} />
      <path d="M214 60 Q244 22 274 60 Z" fill="var(--color-bamboo)" {...ink} strokeWidth={3.5} />
      <path d="M232 78 H256 V100 H232 Z" fill="var(--color-canal)" {...ink} strokeWidth={3.5} />
      <path d="M4 94 Q150 118 296 90 L262 136 Q150 150 36 136 Z" fill="var(--color-teak)" {...ink} />
      <path d="M20 104 Q150 126 282 100" fill="none" stroke="var(--color-teak-deep)" strokeWidth={4} />
    </svg>
  )
}

/** A bird in flight, its wings up. */
function Bird() {
  return (
    <svg viewBox="0 0 80 40" className="w-[70px] overflow-visible">
      <path d="M0 24 Q20 0 40 22 Q60 0 80 24" fill="none" {...ink} strokeWidth={6} />
    </svg>
  )
}

// Vendor boats down the canal below the title sign: spread along one slow loop, each started part-way.
const boats = [
  { top: 830, delay: 0, load: 0 },
  { top: 890, delay: -20, load: 2 },
  { top: 850, delay: -40, load: 4 },
]

/**
 * The busy floating-market cover Scene (Step 1): vendor boats piled with fruit and flowers bobbing down the canal,
 * a few birds crossing the sky high over the title sign, and ripples on the water.
 */
export function FloatingMarket() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <CanalBackdrop sky="day" />
      <Ripples
        ripples={[
          { x: 420, y: 780, w: 170, delay: 0 },
          { x: 1500, y: 760, w: 190, delay: -1.4 },
          { x: 820, y: 1010, w: 210, delay: -2.4 },
          { x: 1200, y: 1020, w: 160, delay: -0.7 },
        ]}
      />
      {boats.map((boat) => (
        <div
          key={boat.top}
          data-testid="scene-boat"
          className="absolute left-0 animate-market-drift will-change-transform motion-reduce:hidden"
          style={{ top: boat.top, animationDelay: `${boat.delay}s` }}
        >
          <div className="animate-boat-bob motion-reduce:animate-none" style={{ animationDelay: `${boat.delay / 10}s` }}>
            <VendorBoat load={boat.load} />
          </div>
        </div>
      ))}
      {[
        { top: 40, delay: 0 },
        { top: 80, delay: -9 },
      ].map((bird) => (
        <div
          key={bird.top}
          data-testid="scene-bird"
          className="absolute left-0 animate-bird-cross will-change-transform motion-reduce:hidden"
          style={{ top: bird.top, animationDelay: `${bird.delay}s` }}
        >
          <Bird />
        </div>
      ))}
    </div>
  )
}

// The quiet canal's lotus pads drift down only the window's sides (x < 300 and x > 1620), clear of the Step's cards.
const lotusPads = [
  { left: 60, duration: 30, delay: -4, flower: true },
  { left: 190, duration: 36, delay: -20, flower: false },
  { left: 1690, duration: 32, delay: -12, flower: false },
  { left: 1810, duration: 34, delay: -26, flower: true },
]

/** A lotus pad seen from above, with a pink flower on some. */
function LotusPad({ flower }: { flower: boolean }) {
  return (
    <svg viewBox="0 0 90 90" className="w-[86px] overflow-visible">
      <path d="M45 4 A41 41 0 1 1 41 4 L45 45 Z" fill="var(--color-banana)" stroke="var(--color-banana-deep)" strokeWidth={4} strokeLinejoin="round" />
      {flower && (
        <g>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx="45" cy="30" rx="9" ry="16" transform={`rotate(${deg} 45 45)`} fill="var(--color-lotus)" stroke="var(--color-lotus-deep)" strokeWidth={3} />
          ))}
          <circle cx="45" cy="45" r="7" fill="#f6d13a" />
        </g>
      )}
    </svg>
  )
}

/** The quiet canal Scene (Steps 2–9): a few lotus pads drifting slowly down the window's sides and slow ripples. */
export function QuietCanal() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <CanalBackdrop sky="day" />
      <Ripples
        ripples={[
          { x: 150, y: 1000, w: 180, delay: 0 },
          { x: 1770, y: 990, w: 180, delay: -2 },
        ]}
      />
      {lotusPads.map((pad) => (
        <div
          key={pad.left}
          data-testid="scene-drifter"
          className="absolute top-0 animate-lotus-drift will-change-transform motion-reduce:hidden"
          style={{ left: pad.left, animationDuration: `${pad.duration}s`, animationDelay: `${pad.delay}s` }}
        >
          <LotusPad flower={pad.flower} />
        </div>
      ))}
    </div>
  )
}

/** The canal at dusk (Step 10): a warm evening sky over still water, with slow ripples at the sides; the Step draws the lotus. */
export function CanalAtDusk() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <CanalBackdrop sky="dusk" />
      <Ripples
        ripples={[
          { x: 150, y: 1000, w: 180, delay: 0 },
          { x: 1770, y: 990, w: 180, delay: -2 },
        ]}
      />
    </div>
  )
}
