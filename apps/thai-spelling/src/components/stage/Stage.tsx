import { Smartphone } from 'lucide-react'
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { Mascot } from '../Mascot'
import { fitStage, isPortrait, STAGE_HEIGHT, STAGE_WIDTH } from './fitStage'

export type Scene = 'garden' | 'pond'

const sceneSrc: Record<Scene, string> = {
  garden: '/assets/canva/backgrounds/garden.webp',
  pond: '/assets/canva/backgrounds/pond.webp',
}

const StageScale = createContext(1)
/** Current stage scale; client-pixel pointer travel ÷ scale = stage pixels. */
export const useStageScale = () => useContext(StageScale)

const subscribe = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/**
 * The fixed 1920×1080 Canva stage, scaled uniformly to fit the window and letterboxed (spec §1.3).
 * Children are positioned in stage pixels. Portrait windows get a blocking rotate overlay instead.
 */
export function Stage({ scene = 'garden', children }: { scene?: Scene; children: ReactNode }) {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth)
  const height = useSyncExternalStore(subscribe, () => window.innerHeight)
  const portrait = isPortrait(width, height)
  const { scale, left, top } = fitStage(width, height)

  return (
    <div className="fixed inset-0 overflow-hidden bg-linear-to-b from-letterbox-sky to-letterbox-grass">
      <div
        data-testid="stage"
        inert={portrait}
        className="absolute origin-top-left overflow-hidden bg-cover"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          left,
          top,
          transform: `scale(${scale})`,
          backgroundImage: `url(${sceneSrc[scene]})`,
        }}
      >
        <StageScale.Provider value={scale}>{children}</StageScale.Provider>
      </div>
      {portrait && <RotateOverlay />}
    </div>
  )
}

function RotateOverlay() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-message"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-(--space-md) bg-linear-to-b from-letterbox-sky to-letterbox-grass p-(--space-md) text-center"
    >
      <Smartphone
        aria-hidden="true"
        data-testid="rotate-phone"
        className="size-24 animate-rotate-phone text-card motion-reduce:animate-none"
        strokeWidth={2}
      />
      <Mascot size="md" decorative />
      <p
        id="rotate-message"
        className="rounded-full bg-pill px-(--space-md) py-(--space-sm) font-heading text-body-lg font-bold whitespace-nowrap text-navy"
      >
        กรุณาหมุนจอเป็นแนวนอน
      </p>
    </div>
  )
}
