import type { ReactNode } from 'react'

// แม่กบ's Scenes (docs/mae-kop-spec.md), drawn in scene pixels (1920×1080) with CSS and inline SVG, so they need no
// raster art. The Stage scales this layer to cover the window, so nothing letterboxes. All of it sits behind the
// Step's words and buttons; under reduced motion everything here stands still (motion-reduce).

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const layer = 'pointer-events-none absolute inset-0 overflow-hidden select-none'

/** Water line of the pond: the far bank above it, the water below. */
const WATER_TOP = 640

function Cloud({ x, y, k = 1, fill = '#e4ebf1' }: { x: number; y: number; k?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${k})`}
      d="M0 60 C-10 20 40 0 70 24 C90 -10 160 -6 170 30 C210 20 240 50 220 76 H10 C-10 76 -10 64 0 60 Z"
      fill={fill}
      {...ink}
      strokeWidth={4}
    />
  )
}

function Reeds({ x, flip = false }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 0) scale(${flip ? -1 : 1} 1)`}>
      {[0, 26, 52].map((dx, i) => (
        <g key={dx}>
          <path d={`M${dx} 1080 Q${dx - 6} ${820 - i * 40} ${dx + 10} ${700 - i * 50}`} fill="none" stroke="var(--color-lily-deep)" strokeWidth={10} strokeLinecap="round" />
          <rect x={dx + 2} y={700 - i * 50} width="18" height="70" rx="9" fill="var(--color-mud)" {...ink} strokeWidth={4} />
        </g>
      ))}
    </g>
  )
}

function LilyPad({ x, y, rx = 90 }: { x: number; y: number; rx?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.32} fill="var(--color-lily)" {...ink} strokeWidth={4} />
      <path d={`M${x} ${y} L${x + rx * 0.8} ${y - rx * 0.12}`} fill="none" {...ink} strokeWidth={4} />
    </g>
  )
}

/** A taro leaf on its stalk, standing at the bank's edge. */
function Taro({ x, y, k = 1, flip = false }: { x: number; y: number; k?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}>
      <path d="M0 0 Q-6 120 4 260" fill="none" stroke="var(--color-lily-deep)" strokeWidth={14} strokeLinecap="round" />
      <path d="M0 0 C-120 -10 -170 -120 -90 -180 C-40 -210 40 -210 90 -180 C170 -120 120 -10 0 0 Z" fill="var(--color-lily)" {...ink} />
      <path d="M0 0 V-170 M0 -60 L-70 -130 M0 -60 L70 -130" fill="none" stroke="#b8e6a0" strokeWidth={6} strokeLinecap="round" />
    </g>
  )
}

/**
 * The still pond every แม่กบ Scene shares: a sky (grey rain clouds, or clear after the rain), the far bank, the teal
 * water with lily pads and reeds at its sides, and taro leaves on the near banks in the bottom corners.
 */
function PondBackdrop({ sky, children }: { sky: 'rain' | 'clear'; children?: ReactNode }) {
  const rain = sky === 'rain'
  return (
    <svg data-testid="scene-backdrop" aria-hidden="true" viewBox="0 0 1920 1080" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id="kop-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rain ? '#7f97ab' : '#7fcdf2'} />
          <stop offset="1" stopColor={rain ? '#c9d6e1' : '#e3f6ff'} />
        </linearGradient>
        <linearGradient id="kop-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rain ? '#3f9a94' : '#2fb3aa'} />
          <stop offset="1" stopColor="var(--color-pond-deep)" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#kop-sky)" />
      {rain ? (
        <>
          <Cloud x={-40} y={20} k={1.6} fill="#aebdcb" />
          <Cloud x={520} y={-10} k={1.3} fill="#b9c7d3" />
          <Cloud x={1050} y={30} k={1.5} fill="#aebdcb" />
          <Cloud x={1560} y={0} k={1.7} fill="#b9c7d3" />
        </>
      ) : (
        <>
          <circle cx="1720" cy="150" r="80" fill="var(--color-sun)" {...ink} />
          <Cloud x={120} y={90} k={0.9} fill="#ffffff" />
          <Cloud x={1300} y={200} k={0.7} fill="#ffffff" />
        </>
      )}
      {/* The far bank and its trees. */}
      <path d={`M0 ${WATER_TOP - 70} Q300 ${WATER_TOP - 140} 640 ${WATER_TOP - 80} T1280 ${WATER_TOP - 90} T1920 ${WATER_TOP - 100} V${WATER_TOP + 10} H0 Z`} fill={rain ? '#5f8d6a' : '#6fbf62'} {...ink} />
      <rect y={WATER_TOP} width="1920" height={1080 - WATER_TOP} fill="url(#kop-water)" />
      <path d={`M0 ${WATER_TOP} H1920`} {...ink} />
      {/* Still rings of light on the water. */}
      {[
        [260, 760, 120],
        [1660, 790, 140],
        [960, 1010, 220],
      ].map(([cx, cy, rx]) => (
        <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={rx! * 0.18} fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth={6} />
      ))}
      <LilyPad x={150} y={700} />
      <LilyPad x={1790} y={720} rx={100} />
      <LilyPad x={330} y={880} rx={70} />
      <LilyPad x={1600} y={900} rx={76} />
      <Reeds x={40} />
      <Reeds x={1880} flip />
      <Taro x={70} y={930} k={0.8} />
      <Taro x={1850} y={940} k={0.85} flip />
      {children}
    </svg>
  )
}

/** Rings spreading on the water, each from its own spot; negative delays start them part-way. */
function Rings({ rings, testId }: { rings: readonly { x: number; y: number; w: number; delay: number }[]; testId?: string }) {
  return rings.map((ring) => (
    <span
      key={`${ring.x}-${ring.y}`}
      data-testid={testId}
      className="absolute animate-ring-spread rounded-[50%] border-[5px] border-card/80 will-change-transform motion-reduce:hidden"
      style={{ left: ring.x - ring.w / 2, top: ring.y - ring.w * 0.12, width: ring.w, height: ring.w * 0.24, animationDelay: `${ring.delay}s` }}
    />
  ))
}

/** A child in a raincoat and boots, splashing in place. */
function Splasher({ x, y, coat, delay }: { x: number; y: number; coat: string; delay: number }) {
  return (
    <div data-testid="scene-splasher" className="absolute origin-bottom animate-splash-hop motion-reduce:animate-none" style={{ left: x, top: y, animationDelay: `${delay}s` }}>
      <svg viewBox="0 0 120 170" className="w-[90px] overflow-visible">
        <ellipse cx="60" cy="164" rx="56" ry="10" fill="var(--color-pond-light)" {...ink} strokeWidth={3} />
        <rect x="34" y="128" width="22" height="34" rx="6" fill="var(--color-comic-red)" {...ink} strokeWidth={4} />
        <rect x="64" y="128" width="22" height="34" rx="6" fill="var(--color-comic-red)" {...ink} strokeWidth={4} />
        <path d="M60 52 L100 134 H20 Z" fill={coat} {...ink} />
        <circle cx="60" cy="44" r="26" fill="#f5c08a" {...ink} />
        <path d="M30 44 Q60 0 90 44 Q60 30 30 44 Z" fill={coat} {...ink} />
        <path d="M50 52 Q60 60 70 52" fill="none" {...ink} strokeWidth={3} />
      </svg>
    </div>
  )
}

// Rain over the whole cover: streaks spread evenly but out of order, each loop started part-way.
const rain = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 83) % 2060,
  height: 40 + (i % 3) * 16,
  duration: 1.1 + (i % 5) * 0.18,
  delay: -((i * 0.37) % 1.6),
}))

/**
 * The busy rainy-pond cover Scene (Step 1): rain, rings on the puddles, swaying reeds, a paper boat drifting across
 * the water below the title, and children in raincoats splashing at the sides, clear of the title panel and buttons.
 */
export function RainyPond() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <PondBackdrop sky="rain" />
      <Rings
        rings={[
          { x: 520, y: 780, w: 160, delay: 0 },
          { x: 1380, y: 760, w: 180, delay: -1.2 },
          { x: 760, y: 990, w: 200, delay: -2.1 },
          { x: 1240, y: 1000, w: 150, delay: -0.6 },
        ]}
      />
      <div data-testid="scene-boat" className="absolute top-[790px] left-0 animate-boat-drift will-change-transform motion-reduce:animate-none">
        <svg viewBox="0 0 160 90" className="w-[160px] overflow-visible">
          <path d="M6 50 H154 L128 86 H32 Z" fill="var(--color-card)" {...ink} />
          <path d="M80 4 L80 50 L40 50 Z M80 4 L120 50 H80 Z" fill="var(--color-raincoat-light)" {...ink} />
        </svg>
      </div>
      <Splasher x={270} y={780} coat="var(--color-raincoat)" delay={0} />
      <Splasher x={1250} y={712} coat="var(--color-comic-red)" delay={-1.1} />
      {rain.map((drop) => (
        <span
          key={drop.left}
          data-testid="scene-rain"
          className="absolute top-0 w-[5px] animate-rain-fall rounded-full bg-card/70 will-change-transform motion-reduce:hidden"
          style={{ left: drop.left, height: drop.height, animationDuration: `${drop.duration}s`, animationDelay: `${drop.delay}s`, rotate: '4deg' }}
        />
      ))}
      <div className="absolute top-[700px] left-[30px] h-[380px] w-[120px] origin-bottom animate-sway motion-reduce:animate-none">
        <svg viewBox="0 0 120 380" className="size-full overflow-visible">
          <Reeds x={30} />
        </svg>
      </div>
    </div>
  )
}

// The calm drizzle falls only down the window's sides (x < 300 and x > 1620), clear of the Step's cards.
const drizzle = [
  { left: 70, duration: 9, delay: -2 },
  { left: 160, duration: 11, delay: -7 },
  { left: 250, duration: 10, delay: -4 },
  { left: 1680, duration: 10, delay: -1 },
  { left: 1770, duration: 12, delay: -8 },
  { left: 1860, duration: 9, delay: -5 },
]

/** The calm drizzle Scene (Steps 2–6, 8, 9): a few drops falling down the window's sides and slow rings on the pond. */
export function Drizzle() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <PondBackdrop sky="rain" />
      <Rings
        testId="scene-ring"
        rings={[
          { x: 150, y: 1000, w: 180, delay: 0 },
          { x: 1770, y: 990, w: 180, delay: -1.6 },
        ]}
      />
      {drizzle.map((drop) => (
        <div
          key={drop.left}
          data-testid="scene-drifter"
          className="absolute top-0 animate-drift-fall will-change-transform motion-reduce:hidden"
          style={{ left: drop.left, animationDuration: `${drop.duration}s`, animationDelay: `${drop.delay}s` }}
        >
          <svg viewBox="0 0 20 30" className="w-[22px]">
            <path d="M10 0 C14 10 19 16 19 21 C19 26 15 30 10 30 C5 30 1 26 1 21 C1 16 6 10 10 0 Z" fill="var(--color-pond-light)" stroke="var(--color-rubber-deep)" strokeWidth={2.5} />
          </svg>
        </div>
      ))}
    </div>
  )
}

/** The pond after the rain (Step 10): a clear sky and the sun, with slow rings at the sides; the Step draws the rainbow. */
export function AfterRain() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <PondBackdrop sky="clear" />
      <Rings
        testId="scene-ring"
        rings={[
          { x: 150, y: 1000, w: 180, delay: 0 },
          { x: 1770, y: 990, w: 180, delay: -1.6 },
        ]}
      />
    </div>
  )
}

/** Step 7 has no Scene: a wet-slate comic gutter behind the four panels, with nothing moving. */
export function ComicGutter() {
  return (
    <div
      aria-hidden="true"
      data-testid="scene-motion"
      className={`${layer} bg-rubber-deep bg-[radial-gradient(circle_at_20%_30%,rgb(255_255_255/0.06)_0_40px,transparent_41px),radial-gradient(circle_at_70%_80%,rgb(255_255_255/0.05)_0_60px,transparent_61px)] bg-[length:400px_300px]`}
    />
  )
}
