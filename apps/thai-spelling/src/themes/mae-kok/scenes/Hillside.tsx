import { ink } from '../kit/ink'

// แม่กก's Scenes (docs/mae-kok-spec.md), drawn in scene pixels (1920×1080) over their still backdrop webp (a
// placeholder until #83). The Stage scales this layer to cover the window, so nothing letterboxes. Every moving object
// is marked data-mover and sits behind the Step's words and buttons; under reduced motion everything here stands still.

const layer = 'pointer-events-none absolute inset-0 overflow-hidden select-none'
const still = 'motion-reduce:animate-none'

/** A vegetable leaf swaying from its foot. */
function Leaf({ x, y, k = 1, flip = false, delay = 0 }: { x: number; y: number; k?: number; flip?: boolean; delay?: number }) {
  return (
    <div
      data-mover
      data-testid="scene-leaf"
      className={`absolute h-[220px] w-[140px] origin-bottom animate-sway ${still}`}
      style={{ left: x, top: y, scale: `${flip ? -k : k} ${k}`, animationDelay: `${delay}s`, animationDuration: '5s' }}
    >
      <svg viewBox="0 0 140 220" className="size-full overflow-visible">
        <path d="M70 220 Q66 150 70 90" fill="none" stroke="var(--color-sprout-deep)" strokeWidth={12} strokeLinecap="round" />
        <path d="M70 120 C10 110 -10 30 40 10 C70 0 100 0 110 20 C150 60 120 120 70 120 Z" fill="var(--color-sprout)" {...ink} />
        <path d="M70 120 Q76 60 96 24" fill="none" stroke="var(--color-sprout-light)" strokeWidth={6} strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Cloud({ top, width, duration, delay }: { top: number; width: number; duration: number; delay: number }) {
  return (
    <div
      data-mover
      data-testid="scene-cloud"
      className={`absolute left-0 animate-cloud-drift ${still}`}
      style={{ top, width, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 240 80" className="w-full overflow-visible">
        <path d="M0 60 C-10 20 40 0 70 24 C90 -10 160 -6 170 30 C210 20 240 50 220 76 H10 C-10 76 -10 64 0 60 Z" fill="#ffffff" {...ink} strokeWidth={4} />
      </svg>
    </div>
  )
}

/** A garden sprinkler on its post, its arc of water swinging slowly to and fro. */
function Sprinkler({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <svg viewBox="0 0 40 120" className="absolute top-[60px] left-[60px] w-[40px] overflow-visible">
        <path d="M20 0 V120" {...ink} strokeWidth={10} />
        <path d="M20 0 V120" stroke="var(--color-ridge)" strokeWidth={4} />
      </svg>
      <div data-mover data-testid="scene-sprinkler" className={`absolute top-0 left-0 h-[80px] w-[160px] origin-bottom animate-sway ${still}`} style={{ animationDuration: '3s' }}>
        <svg viewBox="0 0 160 80" className="size-full overflow-visible">
          <path d="M80 70 Q20 0 0 70 M80 70 Q60 -10 40 40 M80 70 Q140 0 160 70 M80 70 Q100 -10 120 40" fill="none" stroke="#7cc8f0" strokeWidth={6} strokeLinecap="round" strokeDasharray="10 10" />
        </svg>
      </div>
    </div>
  )
}

/** A child carrying a basket on the hip, walking to and fro along a far terrace. */
function BasketCarrier({ x, y }: { x: number; y: number }) {
  return (
    <div data-mover data-testid="scene-carrier" className={`absolute animate-amble ${still}`} style={{ left: x, top: y, animationDuration: '14s' }}>
      <svg viewBox="0 0 110 130" className="w-[90px] overflow-visible">
        <path d="M40 92 V126 M66 92 V126" {...ink} strokeWidth={9} />
        <path d="M30 50 H76 L84 98 H22 Z" fill="var(--color-terracotta)" {...ink} />
        <circle cx="53" cy="30" r="22" fill="#f5c08a" {...ink} />
        <path d="M30 26 Q53 -6 76 26 Z" fill="#e8c25a" {...ink} strokeWidth={4} />
        <path d="M76 66 H108 L102 96 H82 Z" fill="var(--color-kraft)" {...ink} strokeWidth={4} />
        <path d="M80 66 Q92 50 104 66" fill="none" {...ink} strokeWidth={3.5} />
        <circle cx="88" cy="62" r="7" fill="var(--color-sprout)" {...ink} strokeWidth={3} />
      </svg>
    </div>
  )
}

/** A worm peeking up out of the soil and back down. */
function Worm({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute h-[70px] w-[60px] overflow-hidden" style={{ left: x, top: y }}>
      <div data-mover data-testid="scene-worm" className={`absolute inset-x-0 top-[20px] animate-hop ${still}`} style={{ animationDuration: '4s' }}>
        <svg viewBox="0 0 60 70" className="w-[60px] overflow-visible">
          <path d="M30 70 V26 Q30 10 40 12" fill="none" stroke="var(--color-soil-deep)" strokeWidth={22} strokeLinecap="round" />
          <path d="M30 70 V26 Q30 10 40 12" fill="none" stroke="#f29aa6" strokeWidth={14} strokeLinecap="round" />
          <circle cx="38" cy="14" r="3" fill="var(--color-soil-deep)" />
        </svg>
      </div>
      <span className="absolute inset-x-0 bottom-0 h-[16px] rounded-t-[50%] bg-soil" />
    </div>
  )
}

/**
 * The busy terraced hillside behind the cover (Step 1): clouds drifting in the sky band above the title, a sprinkler
 * arc on the left terraces, vegetable leaves swaying at both sides, a child carrying a basket along the far terrace
 * under the title, and a worm peeking from the soil on the right, clear of the signboard, น้องนก and the buttons.
 */
export function BusyHillside() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <Cloud top={10} width={260} duration={90} delay={-20} />
      <Cloud top={40} width={200} duration={110} delay={-70} />
      <Sprinkler x={210} y={600} />
      <BasketCarrier x={760} y={775} />
      <Worm x={1560} y={760} />
      <Leaf x={10} y={430} />
      <Leaf x={110} y={500} k={0.8} delay={-1.5} />
      <Leaf x={1770} y={440} flip delay={-0.8} />
      <Leaf x={1670} y={520} k={0.8} flip delay={-2.2} />
    </div>
  )
}

/** The calm terrace (Steps 2–6, 8, 9): a few vegetable leaves sway slowly at the window's sides, clear of the cards. */
export function CalmTerrace() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <Leaf x={40} y={480} k={0.9} />
      <Leaf x={150} y={560} k={0.7} delay={-2} />
      <Leaf x={1740} y={480} k={0.9} flip delay={-1} />
      <Leaf x={1630} y={560} k={0.7} flip delay={-3} />
    </div>
  )
}

/** The hillside at sunset (Step 10): leaves sway slowly at the sides; the Step draws the nine terraces that ripen. */
export function Sunset() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className={layer}>
      <Leaf x={20} y={500} k={0.8} />
      <Leaf x={1760} y={500} k={0.8} flip delay={-1.5} />
    </div>
  )
}

/** Step 7 has no Scene: a flat sky-to-soil wash behind the trellis, with nothing moving. */
export function ComicWash() {
  return (
    <div
      aria-hidden="true"
      data-testid="scene-motion"
      className={`${layer} bg-[linear-gradient(180deg,#bfe6fb_0%,#e9f6ff_45%,#c9e8a6_70%,var(--color-soil)_100%)]`}
    />
  )
}
