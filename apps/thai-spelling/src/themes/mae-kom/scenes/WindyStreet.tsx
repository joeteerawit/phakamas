// Scene pixels of kom-scene-windy.webp. Everything falls down the side columns (x < 300 and x > 1620, sway
// included), so nothing moving crosses the cards between them; negative delays start part-way down.
const leaves = [
  { left: 90, fill: 'fill-hill', duration: 24, delay: -4 },
  { left: 210, fill: 'fill-orange', duration: 28, delay: -17 },
  { left: 1700, fill: 'fill-sun', duration: 26, delay: -9 },
  { left: 1820, fill: 'fill-hill', duration: 30, delay: -22 },
  { left: 1760, fill: 'fill-orange', duration: 22, delay: -1 },
]

const flakes = [
  { left: 60, size: 16, duration: 20, delay: -3 },
  { left: 160, size: 12, duration: 26, delay: -14 },
  { left: 250, size: 18, duration: 23, delay: -8 },
  { left: 120, size: 10, duration: 30, delay: -21 },
  { left: 1680, size: 14, duration: 25, delay: -6 },
  { left: 1790, size: 18, duration: 21, delay: -16 },
  { left: 1860, size: 12, duration: 28, delay: -11 },
  { left: 1730, size: 10, duration: 32, delay: -27 },
]

const fall = 'absolute top-0 animate-drift-fall will-change-transform motion-reduce:hidden'

/**
 * The calm แม่กม windy-street Scene's moving objects over kom-scene-windy.webp (docs/mae-kom-spec.md): a few
 * leaves and snowflakes drifting slowly down. Drawn in the Stage's Scene layer, behind every card and button;
 * reduced motion stills it.
 */
export function WindyStreet() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {leaves.map((leaf) => (
        <div
          key={leaf.left}
          data-testid="scene-drifter"
          className={fall}
          style={{ left: leaf.left, animationDuration: `${leaf.duration}s`, animationDelay: `${leaf.delay}s` }}
        >
          <svg viewBox="0 0 50 30" className="w-[50px] animate-leaf-sway text-comic-ink" style={{ animationDelay: `${leaf.delay / 7}s` }}>
            <path d="M3 15 C 12 2, 34 0, 47 15 C 34 30, 12 28, 3 15 Z" className={leaf.fill} stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M3 15 L 40 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      ))}

      {flakes.map((flake) => (
        <div
          key={flake.left}
          data-testid="scene-drifter"
          className={fall}
          style={{ left: flake.left, animationDuration: `${flake.duration}s`, animationDelay: `${flake.delay}s` }}
        >
          <div
            className="animate-leaf-sway rounded-full bg-card opacity-90"
            style={{ width: flake.size, height: flake.size, animationDelay: `${flake.delay / 5}s` }}
          />
        </div>
      ))}
    </div>
  )
}
