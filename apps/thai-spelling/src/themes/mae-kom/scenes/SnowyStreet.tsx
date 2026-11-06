const COMIC = '/assets/comic'
const layer = 'pointer-events-none absolute select-none'

// Scene pixels of kom-scene-cover.webp. Negative delays start each loop part-way through so the street is alive on arrival.
const flakes = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 79) % 2140,
  size: 10 + ((i * 7) % 12),
  duration: 9 + ((i * 5) % 8),
  delay: -((i * 1.7) % 14),
}))

// The street lamps' heads.
const lamps = [
  { left: 1385, top: 495, size: 150 },
  { left: 1262, top: 705, size: 80 },
  { left: 793, top: 733, size: 70 },
  { left: 874, top: 775, size: 50 },
  { left: 1184, top: 790, size: 50 },
]

const gusts = [
  { top: 600, width: 360, duration: 10, delay: -2 },
  { top: 330, width: 280, duration: 13, delay: -9 },
]

/**
 * The แม่กม cover Scene's moving objects over kom-scene-cover.webp (docs/mae-kom-spec.md): snow blowing in
 * the wind, gusts, a red umbrella blown across the sky, an orange rolling down the street and glowing lamps.
 * Drawn in the Stage's Scene layer, so all of it stays behind the sign and buttons; reduced motion stills it.
 */
export function SnowyStreet() {
  return (
    <div aria-hidden="true" data-testid="scene-motion" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {lamps.map((lamp) => (
        <div
          key={lamp.left}
          className="absolute -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_236_150/0.9),rgb(255_200_80/0.35)_55%,transparent)] opacity-80 animate-lamp-glow motion-reduce:animate-none"
          style={{ left: lamp.left, top: lamp.top, width: lamp.size, height: lamp.size, animationDelay: `${-lamp.left % 2.4}s` }}
        />
      ))}

      {gusts.map((gust) => (
        <svg
          key={gust.top}
          viewBox="0 0 360 80"
          className="absolute left-0 animate-wind-gust will-change-transform motion-reduce:hidden"
          style={{ top: gust.top, width: gust.width, animationDuration: `${gust.duration}s`, animationDelay: `${gust.delay}s` }}
        >
          <path d="M10 50 C 90 20, 170 70, 250 40 S 340 10, 330 40 S 290 60, 300 30" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" />
          <path d="M60 72 C 130 55, 190 75, 250 62" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
        </svg>
      ))}

      <img
        src={`${COMIC}/word-rom.webp`}
        alt=""
        draggable={false}
        className={`${layer} top-[170px] left-0 w-[130px] animate-umbrella-blow will-change-transform motion-reduce:hidden [animation-delay:-3s]`}
      />
      <img
        src={`${COMIC}/word-som.webp`}
        alt=""
        draggable={false}
        className={`${layer} top-[960px] left-0 w-[80px] animate-orange-roll will-change-transform motion-reduce:hidden [animation-delay:-5s]`}
      />

      {flakes.map((flake) => (
        <div
          key={flake.left}
          className="absolute top-0 animate-snow-fall rounded-full bg-card opacity-90 will-change-transform motion-reduce:hidden"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
