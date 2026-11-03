import type { Scene } from './Stage'

/** Comic cut-outs shared with the cover (docs/comic-art.md). */
const COMIC = '/assets/comic'

// Stage pixels. Negative delays start each cloud part-way across instead of all off-screen.
// Small and faded (70%) so they stay scenery behind the Step's buttons, not shapes competing with them.
const clouds = [
  { top: 70, width: 250, duration: 110, delay: -30 },
  { top: 150, width: 150, duration: 80, delay: -60 },
  { top: 230, width: 235, duration: 140, delay: -100 },
]

const sways = [
  { left: 30, top: 690, width: 98, delay: 0 },
  { left: 125, top: 790, width: 118, delay: -1.3 },
  { left: 1790, top: 760, width: 118, delay: -2.1 },
]

/**
 * The living scene behind every Step (#18): drifting clouds, swaying flowers, a bee crossing every
 * 15 s, and a shimmer on the pond. CSS transform/opacity only; `motion-reduce` freezes all of it.
 */
export function Ambient({ scene }: { scene: Scene }) {
  return (
    <div aria-hidden="true" data-testid="ambient" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {clouds.map((cloud) => (
        <img
          key={cloud.top}
          src={`${COMIC}/decor-cloud.webp`}
          alt=""
          draggable={false}
          data-testid="ambient-cloud"
          className="absolute left-0 animate-cloud-drift opacity-70 will-change-transform motion-reduce:animate-none"
          style={{ top: cloud.top, width: cloud.width, animationDuration: `${cloud.duration}s`, animationDelay: `${cloud.delay}s` }}
        />
      ))}

      {scene === 'pond' && (
        <div
          data-testid="ambient-shimmer"
          className="absolute top-[680px] left-[380px] h-[320px] w-[1180px] overflow-hidden"
          style={{ maskImage: 'radial-gradient(closest-side, black 40%, transparent)' }}
        >
          <div className="h-full w-[1370px] animate-pond-shimmer bg-[repeating-linear-gradient(90deg,transparent_0_70px,rgb(255_255_255/0.28)_90px,transparent_110px_190px)] will-change-transform motion-reduce:animate-none" />
        </div>
      )}

      {sways.map((sway) => (
        <img
          key={sway.left}
          src={`${COMIC}/decor-flowers.webp`}
          alt=""
          draggable={false}
          data-testid="ambient-sway"
          className="absolute origin-bottom animate-sway motion-reduce:animate-none"
          style={{ left: sway.left, top: sway.top, width: sway.width, animationDelay: `${sway.delay}s` }}
        />
      ))}

      <div data-testid="ambient-flyer" className="absolute top-[400px] left-0 animate-fly-across will-change-transform motion-reduce:hidden">
        <img
          src={`${COMIC}/decor-bee.webp`}
          alt=""
          draggable={false}
          className="w-[120px] animate-fly-bob"
        />
      </div>
    </div>
  )
}
