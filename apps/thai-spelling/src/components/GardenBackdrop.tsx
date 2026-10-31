import { cx } from './clay/buttonClass'

/**
 * Full-bleed sky → grass garden with soft clouds, a sun and hills.
 * Fixed and clipped, so it never adds scroll; hidden from assistive tech.
 */
export function GardenBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linear-to-b from-sky-top via-sky via-45% to-grass"
    >
      {/* Rainbow arc: concentric borders, clipped by the backdrop. */}
      <div className="absolute top-[18%] -left-[30vw] size-[80vw] max-w-[900px] max-h-[900px] rounded-full border-[14px] border-red/70 opacity-80 lg:-left-[10vw] lg:size-[60vw]">
        <div className="size-full rounded-full border-[14px] border-orange/70">
          <div className="size-full rounded-full border-[14px] border-sun/80">
            <div className="size-full rounded-full border-[14px] border-hill/70">
              <div className="size-full rounded-full border-[14px] border-sky-top/70">
                <div className="size-full rounded-full border-[14px] border-purple/70" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sun with a soft halo. */}
      <div className="absolute top-[5%] right-[6%] size-20 rounded-full bg-sun shadow-[0_0_0_14px_color-mix(in_srgb,var(--color-sun)_35%,transparent),0_0_0_28px_color-mix(in_srgb,var(--color-sun)_18%,transparent)] lg:size-28" />

      <Cloud className="top-[10%] left-[-4%] scale-75 sm:left-[6%] lg:scale-100" />
      <Cloud className="top-[22%] right-[-6%] scale-90 sm:right-[12%] lg:top-[16%]" />
      <Cloud className="top-[40%] left-[60%] hidden scale-75 lg:block" />

      {/* Bright rolling hills. */}
      <div className="absolute -bottom-[22vh] -left-[25vw] h-[45vh] w-[90vw] rounded-[50%] bg-hill" />
      <div className="absolute -right-[30vw] -bottom-[26vh] h-[50vh] w-[100vw] rounded-[50%] bg-hill-deep" />

      {/* Flowers on the hills. */}
      <Flower className="bottom-[9vh] left-[8%] bg-red" />
      <Flower className="bottom-[14vh] left-[30%] bg-purple" />
      <Flower className="bottom-[6vh] left-[52%] bg-sun" />
      <Flower className="bottom-[12vh] right-[18%] bg-tint-pink" />
      <Flower className="bottom-[5vh] right-[6%] bg-orange" />
    </div>
  )
}

function Cloud({ className }: { className: string }) {
  return (
    <div className={cx('absolute h-16 w-40 opacity-80', className)}>
      <span className="absolute inset-x-0 bottom-0 h-10 rounded-full bg-card" />
      <span className="absolute bottom-4 left-6 size-14 rounded-full bg-card" />
      <span className="absolute bottom-3 left-[4.5rem] size-11 rounded-full bg-card" />
    </div>
  )
}

function Flower({ className }: { className: string }) {
  return (
    <div className={cx('absolute size-7 rounded-full shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-card)_55%,transparent)] lg:size-9', className)}>
      <span className="absolute inset-[30%] rounded-full bg-sun" />
    </div>
  )
}
